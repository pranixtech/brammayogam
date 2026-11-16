import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { pool } from '../db.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'

const router = Router()
const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many Deeksha submissions. Please try again later.' },
})

const programColumns = `
  id, title, subtitle, description, benefits, sort_order AS "sortOrder",
  is_published AS "isPublished", seed_key IS NOT NULL AS "isBuiltIn",
  created_at AS "createdAt", updated_at AS "updatedAt"`

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text.length <= maxLength ? text : null
}

function positiveId(value) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function cleanProgram(body) {
  const title = cleanText(body?.title, 160)
  const subtitle = cleanText(body?.subtitle ?? '', 240)
  const description = cleanText(body?.description ?? '', 2000)
  const rawBenefits = Array.isArray(body?.benefits) ? body.benefits : []
  const benefits = rawBenefits.map((item) => cleanText(item, 500)).filter(Boolean).slice(0, 30)
  const sortOrder = Number(body?.sortOrder ?? 0)
  const isPublished = body?.isPublished === true
  if (!title || subtitle === null || description === null || !Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) return null
  return { title, subtitle, description, benefits, sortOrder, isPublished }
}

router.get('/deeksha-programs', async (_request, response, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${programColumns} FROM deeksha_programs
       WHERE is_published = TRUE ORDER BY sort_order ASC, id ASC`,
    )
    response.set('Cache-Control', 'no-store')
    return response.json({ programs: rows })
  } catch (error) {
    return next(error)
  }
})

router.post('/deeksha-submissions', submissionLimiter, async (request, response, next) => {
  const fullName = cleanText(request.body?.fullName, 120)
  const email = cleanText(request.body?.email ?? '', 254)?.toLowerCase()
  const phone = cleanText(request.body?.phone, 30)
  const city = cleanText(request.body?.city ?? '', 100)
  const country = String(request.body?.country ?? '').trim().toUpperCase()
  const message = cleanText(request.body?.message ?? '', 1000)
  const selectedIds = [...new Set(Array.isArray(request.body?.programIds) ? request.body.programIds.map(positiveId).filter(Boolean) : [])]
  const consent = request.body?.consent === true

  if (!fullName || !phone || city === null || message === null) return response.status(400).json({ message: 'Enter your name and phone number.' })
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response.status(400).json({ message: 'Enter a valid email address.' })
  if (!/^[+\d][\d\s()-]*$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15) {
    return response.status(400).json({ message: 'Enter a valid phone or WhatsApp number.' })
  }
  if (country && !/^[A-Z]{2}$/.test(country)) return response.status(400).json({ message: 'Choose a valid country.' })
  if (!selectedIds.length || selectedIds.length > 20) return response.status(400).json({ message: 'Choose at least one Deeksha program.' })
  if (!consent) return response.status(400).json({ message: 'Please agree to be contacted about your Deeksha selection.' })

  try {
    const { rows: programs } = await pool.query(
      `SELECT id, title FROM deeksha_programs
       WHERE is_published = TRUE AND id = ANY($1::bigint[])
       ORDER BY sort_order ASC, id ASC`,
      [selectedIds],
    )
    if (programs.length !== selectedIds.length) return response.status(400).json({ message: 'One or more selected Deeksha programs are no longer available.' })
    const snapshot = programs.map((program) => ({ id: String(program.id), title: program.title }))
    const { rows } = await pool.query(
      `INSERT INTO deeksha_submissions
        (full_name, email, phone, city, country, message, selected_programs)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       RETURNING id, created_at AS "createdAt"`,
      [fullName, email, phone, city, country, message, JSON.stringify(snapshot)],
    )
    return response.status(201).json({ submission: rows[0] })
  } catch (error) {
    return next(error)
  }
})

router.get('/admin/deeksha-programs', authenticateAdmin, async (_request, response, next) => {
  try {
    const { rows } = await pool.query(`SELECT ${programColumns} FROM deeksha_programs ORDER BY sort_order ASC, id ASC`)
    response.set('Cache-Control', 'no-store')
    return response.json({ programs: rows })
  } catch (error) {
    return next(error)
  }
})

router.post('/admin/deeksha-programs', authenticateAdmin, async (request, response, next) => {
  const fields = cleanProgram(request.body)
  if (!fields) return response.status(400).json({ message: 'Enter valid Deeksha program details.' })
  try {
    const { rows } = await pool.query(
      `INSERT INTO deeksha_programs
        (title, subtitle, description, benefits, sort_order, is_published)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6)
       RETURNING ${programColumns}`,
      [fields.title, fields.subtitle, fields.description, JSON.stringify(fields.benefits), fields.sortOrder, fields.isPublished],
    )
    return response.status(201).json({ program: rows[0] })
  } catch (error) {
    return next(error)
  }
})

router.put('/admin/deeksha-programs/:id', authenticateAdmin, async (request, response, next) => {
  const id = positiveId(request.params.id)
  const fields = cleanProgram(request.body)
  if (!id) return response.status(400).json({ message: 'Choose a valid Deeksha program.' })
  if (!fields) return response.status(400).json({ message: 'Enter valid Deeksha program details.' })
  try {
    const { rows } = await pool.query(
      `UPDATE deeksha_programs
       SET title = $1, subtitle = $2, description = $3, benefits = $4::jsonb,
         sort_order = $5, is_published = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING ${programColumns}`,
      [fields.title, fields.subtitle, fields.description, JSON.stringify(fields.benefits), fields.sortOrder, fields.isPublished, id],
    )
    if (!rows[0]) return response.status(404).json({ message: 'Deeksha program not found.' })
    return response.json({ program: rows[0] })
  } catch (error) {
    return next(error)
  }
})

router.delete('/admin/deeksha-programs/:id', authenticateAdmin, async (request, response, next) => {
  const id = positiveId(request.params.id)
  if (!id) return response.status(400).json({ message: 'Choose a valid Deeksha program.' })
  try {
    const { rows } = await pool.query('DELETE FROM deeksha_programs WHERE id = $1 AND seed_key IS NULL RETURNING id', [id])
    if (!rows[0]) return response.status(409).json({ message: 'Built-in Deeksha programs can be unpublished or edited, but not deleted.' })
    return response.status(204).end()
  } catch (error) {
    return next(error)
  }
})

router.get('/admin/deeksha-submissions', authenticateAdmin, async (request, response, next) => {
  const search = cleanText(String(request.query.search ?? ''), 120)
  if (search === null) return response.status(400).json({ message: 'Search text is too long.' })
  const values = []
  let whereClause = ''
  if (search) {
    values.push(`%${search}%`)
    whereClause = `WHERE full_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR selected_programs::text ILIKE $1 OR id::text ILIKE $1`
  }
  try {
    const { rows } = await pool.query(
      `SELECT id, full_name AS "fullName", email, phone, city, country, message,
        selected_programs AS "selectedPrograms", created_at AS "createdAt"
       FROM deeksha_submissions ${whereClause}
       ORDER BY created_at DESC, id DESC LIMIT 500`,
      values,
    )
    response.set('Cache-Control', 'no-store')
    return response.json({ submissions: rows })
  } catch (error) {
    return next(error)
  }
})

export { router as deekshaRouter }
