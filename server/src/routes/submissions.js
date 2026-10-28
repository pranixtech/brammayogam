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
  const message = textField(request.body?.message ?? '', 1000)

  if (!fullName || !email || !phone || !country || message === null) {
    return response.status(400).json({ message: 'Complete the required fields and keep the message under 1,000 characters.' })
  }
  if (!validEmail(email)) return response.status(400).json({ message: 'Enter a valid email address.' })
  if (!validPhone(phone)) return response.status(400).json({ message: 'Enter a valid phone or WhatsApp number.' })
  if (request.body?.consent !== true) {
    return response.status(400).json({ message: 'Please agree to be contacted about online classes.' })
  }

  try {
    await pool.query(
      `INSERT INTO class_registrations (full_name, email, phone, country, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [fullName, email, phone, country, message],
    )
    return response.status(201).json({ message: 'Registration received. We will contact you about online classes.' })
  } catch (error) {
    return next(error)
  }
})

router.post('/feedback', submissionLimiter, async (request, response, next) => {
  const fullName = textField(request.body?.fullName, 120)
  const email = textField(request.body?.email ?? '', 254)?.toLowerCase()
  const message = textField(request.body?.message, 2000)
  const rating = request.body?.rating === '' || request.body?.rating == null ? null : Number(request.body.rating)

  if (!fullName || email === null || !message || message.length < 5) {
    return response.status(400).json({ message: 'Enter your name and feedback of at least five characters.' })
  }
  if (email && !validEmail(email)) return response.status(400).json({ message: 'Enter a valid email address.' })
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return response.status(400).json({ message: 'Choose a rating from 1 to 5.' })
  }

  try {
    await pool.query(
      `INSERT INTO visitor_feedback (full_name, email, rating, message)
       VALUES ($1, $2, $3, $4)`,
      [fullName, email, rating, message],
    )
    return response.status(201).json({ message: 'Thank you. Your feedback has been shared with the team.' })
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
      'id, full_name AS "fullName", email, phone, country, message, created_at AS "createdAt"',
      page,
    )
    response.set('Cache-Control', 'no-store')
    return response.json({ registrations: result.items, page, pageSize: result.pageSize, total: result.total })
  } catch (error) {
    return next(error)
  }
})

router.get('/admin/feedback', authenticateAdmin, async (request, response, next) => {
  const page = pageFromQuery(request.query.page)
  if (!page) return response.status(400).json({ message: 'Choose a valid page number.' })

  try {
    const result = await listSubmissions(
      'visitor_feedback',
      'id, full_name AS "fullName", email, rating, message, created_at AS "createdAt"',
      page,
    )
    response.set('Cache-Control', 'no-store')
    return response.json({ feedback: result.items, page, pageSize: result.pageSize, total: result.total })
  } catch (error) {
    return next(error)
  }
})

export { router as submissionsRouter }
