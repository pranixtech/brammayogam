import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { pool } from '../db.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'

const router = Router()
const PAGE_SIZE = 20

const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many submissions. Please try again later.' },
})

function textField(value, maxLength) {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text.length <= maxLength ? text : null
}

function validEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validPhone(value) {
  const digits = value.replace(/\D/g, '')
  return /^[+\d][\d\s()-]*$/.test(value) && digits.length >= 7 && digits.length <= 15
}

function pageFromQuery(value) {
  const page = Number(value ?? 1)
  return Number.isSafeInteger(page) && page > 0 && page <= 1_000_000 ? page : null
}

function feedbackId(value) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function publishedFeedbackFields(body) {
  const fullName = textField(body?.fullName, 120)
  const roleOrLocation = textField(body?.roleOrLocation ?? '', 160)
  const message = textField(body?.message, 2000)
  const rating = Number(body?.rating ?? 5)

  if (!fullName || roleOrLocation === null || !message || message.length < 5) return null
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null
  return { fullName, roleOrLocation, message, rating }
}

const publishedFeedbackColumns = `
  id, full_name AS "fullName", role_or_location AS "roleOrLocation",
  rating, message, created_at AS "createdAt", updated_at AS "updatedAt"`

async function listSubmissions(table, columns, page) {
  const [items, count] = await Promise.all([
    pool.query(
      `SELECT ${columns} FROM ${table} ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2`,
      [PAGE_SIZE, (page - 1) * PAGE_SIZE],
    ),
    pool.query(`SELECT COUNT(*)::integer AS total FROM ${table}`),
  ])
  return { items: items.rows, page, pageSize: PAGE_SIZE, total: count.rows[0].total }
}

router.post('/registrations', submissionLimiter, async (request, response, next) => {
  const fullName = textField(request.body?.fullName, 120)
  const email = textField(request.body?.email, 254)?.toLowerCase()
  const phone = textField(request.body?.phone, 30)
  const country = textField(request.body?.country, 80)
  const message = textField(request.body?.message ?? '', 100)
  const requestedClassId = request.body?.classId ? Number(request.body.classId) : null

  if (!fullName || !email || !phone || !country || !message) {
    return response.status(400).json({ message: 'Complete the required fields and keep the purpose under 100 characters.' })
  }
  if (!validEmail(email)) return response.status(400).json({ message: 'Enter a valid email address.' })
  if (!validPhone(phone)) return response.status(400).json({ message: 'Enter a valid phone or WhatsApp number.' })
  if (requestedClassId !== null && (!Number.isSafeInteger(requestedClassId) || requestedClassId <= 0)) {
    return response.status(400).json({ message: 'Choose a valid upcoming class.' })
  }
  if (request.body?.consent !== true) {
    return response.status(400).json({ message: 'Please agree to be contacted about online classes.' })
  }

  try {
    let classTitle = ''
    if (requestedClassId !== null) {
      const classResult = await pool.query('SELECT title FROM upcoming_classes WHERE id = $1', [requestedClassId])
      if (!classResult.rows[0]) return response.status(400).json({ message: 'The selected class is no longer available.' })
      classTitle = classResult.rows[0].title
    }
    await pool.query(
      `INSERT INTO class_registrations (full_name, email, phone, country, message, class_id, class_title)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [fullName, email, phone, country, message, requestedClassId, classTitle],
    )
    return response.status(201).json({ message: 'Registration received. We will contact you about online classes.' })
  } catch (error) {
    return next(error)
  }
})

router.get('/feedback', async (_request, response, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${publishedFeedbackColumns}
       FROM published_feedback ORDER BY created_at DESC, id DESC`,
    )
    response.set('Cache-Control', 'no-store')
    return response.json({ feedback: rows })
  } catch (error) {
    return next(error)
  }
})

router.get('/admin/registrations', authenticateAdmin, async (request, response, next) => {
  const page = pageFromQuery(request.query.page)
  if (!page) return response.status(400).json({ message: 'Choose a valid page number.' })

  try {
    const result = await listSubmissions(
      'class_registrations',
      'id, full_name AS "fullName", email, phone, country, message, class_id AS "classId", class_title AS "classTitle", created_at AS "createdAt"',
      page,
    )
    response.set('Cache-Control', 'no-store')
    return response.json({ registrations: result.items, page, pageSize: result.pageSize, total: result.total })
  } catch (error) {
    return next(error)
  }
})

router.get('/admin/feedback', authenticateAdmin, async (_request, response, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${publishedFeedbackColumns}
       FROM published_feedback ORDER BY created_at DESC, id DESC`,
    )
    response.set('Cache-Control', 'no-store')
    return response.json({ feedback: rows })
  } catch (error) {
    return next(error)
  }
})

router.post('/admin/feedback', authenticateAdmin, async (request, response, next) => {
  const fields = publishedFeedbackFields(request.body)
  if (!fields) {
    return response.status(400).json({ message: 'Enter a name, a message of at least five characters, and a rating from 1 to 5.' })
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO published_feedback (full_name, role_or_location, rating, message)
       VALUES ($1, $2, $3, $4)
       RETURNING ${publishedFeedbackColumns}`,
      [fields.fullName, fields.roleOrLocation, fields.rating, fields.message],
    )
    return response.status(201).json({ feedback: rows[0] })
  } catch (error) {
    return next(error)
  }
})

router.put('/admin/feedback/:id', authenticateAdmin, async (request, response, next) => {
  const id = feedbackId(request.params.id)
  const fields = publishedFeedbackFields(request.body)
  if (!id) return response.status(400).json({ message: 'Choose a valid feedback entry.' })
  if (!fields) {
    return response.status(400).json({ message: 'Enter a name, a message of at least five characters, and a rating from 1 to 5.' })
  }

  try {
    const { rows } = await pool.query(
      `UPDATE published_feedback
       SET full_name = $1, role_or_location = $2, rating = $3, message = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING ${publishedFeedbackColumns}`,
      [fields.fullName, fields.roleOrLocation, fields.rating, fields.message, id],
    )
    if (!rows[0]) return response.status(404).json({ message: 'Feedback entry not found.' })
    return response.json({ feedback: rows[0] })
  } catch (error) {
    return next(error)
  }
})

router.delete('/admin/feedback/:id', authenticateAdmin, async (request, response, next) => {
  const id = feedbackId(request.params.id)
  if (!id) return response.status(400).json({ message: 'Choose a valid feedback entry.' })

  try {
    const result = await pool.query('DELETE FROM published_feedback WHERE id = $1', [id])
    if (result.rowCount === 0) return response.status(404).json({ message: 'Feedback entry not found.' })
    return response.status(204).end()
  } catch (error) {
    return next(error)
  }
})

export { router as submissionsRouter }
