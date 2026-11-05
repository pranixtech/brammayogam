import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import sharp from 'sharp'
import { config } from '../config.js'
import { pool } from '../db.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'

const router = Router()
const PAGE_SIZE = 20
const allowedPaymentImages = new Set(['image/jpeg', 'image/png', 'image/webp'])

const paymentScreenshotUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (_request, file, callback) => {
    const allowed = allowedPaymentImages.has(file.mimetype)
    callback(allowed ? null : new Error('Upload the payment screenshot as a JPG, PNG or WebP image.'), allowed)
  },
})

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

router.post('/registrations', submissionLimiter, paymentScreenshotUpload.single('paymentScreenshot'), async (request, response, next) => {
  const fullName = textField(request.body?.fullName, 120)
  const email = textField(request.body?.email, 254)?.toLowerCase()
  const phone = textField(request.body?.phone, 30)
  const city = textField(request.body?.city, 80)
  const country = String(request.body?.country ?? '').trim().toUpperCase()
  const message = textField(request.body?.message ?? '', 100)
  const requestedClassId = request.body?.classId ? Number(request.body.classId) : null
  const paymentMethod = String(request.body?.paymentMethod ?? '').trim().toUpperCase()
  const paymentScreenshot = request.file

  if (!fullName || !email || !phone || !city || !message || !/^[A-Z]{2}$/.test(country)) {
    return response.status(400).json({ message: 'Complete the required fields and keep the purpose under 100 characters.' })
  }
  if (!validEmail(email)) return response.status(400).json({ message: 'Enter a valid email address.' })
  if (!validPhone(phone)) return response.status(400).json({ message: 'Enter a valid phone or WhatsApp number.' })
  if (requestedClassId !== null && (!Number.isSafeInteger(requestedClassId) || requestedClassId <= 0)) {
    return response.status(400).json({ message: 'Choose a valid upcoming class.' })
  }
  if (request.body?.consent !== true) {
    if (request.body?.consent !== 'true') {
      return response.status(400).json({ message: 'Please agree to be contacted about online classes.' })
    }
  }
  if (paymentMethod !== 'UPI') {
    return response.status(400).json({ message: 'Choose the available UPI payment method.' })
  }
  if (!paymentScreenshot) {
    return response.status(400).json({ message: 'Upload your payment screenshot before submitting the registration.' })
  }

  const paymentScreenshotFileName = `${crypto.randomUUID()}.webp`
  const paymentScreenshotPath = path.join(config.registrationPaymentDirectory, paymentScreenshotFileName)

  try {
    await sharp(paymentScreenshot.buffer, { failOn: 'error', limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 84 })
      .toFile(paymentScreenshotPath)
  } catch {
    return response.status(400).json({ message: 'The payment screenshot could not be read. Upload a valid JPG, PNG or WebP image.' })
  }

  try {
    let classTitle = ''
    if (requestedClassId !== null) {
      const classResult = await pool.query('SELECT title FROM upcoming_classes WHERE id = $1', [requestedClassId])
      if (!classResult.rows[0]) {
        await fs.unlink(paymentScreenshotPath).catch(() => undefined)
        return response.status(400).json({ message: 'The selected class is no longer available.' })
      }
      classTitle = classResult.rows[0].title
    }
    await pool.query(
      `INSERT INTO class_registrations
        (full_name, email, phone, city, country, message, class_id, class_title, payment_method, payment_screenshot_file_name, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING')`,
      [fullName, email, phone, city, country, message, requestedClassId, classTitle, paymentMethod, paymentScreenshotFileName],
    )
    return response.status(201).json({ message: 'Registration and payment proof received. Our team will verify the payment and contact you.' })
  } catch (error) {
    await fs.unlink(paymentScreenshotPath).catch(() => undefined)
    return next(error)
  }
})

router.get('/admin/registrations/:id/payment-screenshot', authenticateAdmin, async (request, response, next) => {
  const id = feedbackId(request.params.id)
  if (!id) return response.status(400).json({ message: 'Choose a valid registration.' })

  try {
    const { rows } = await pool.query(
      'SELECT payment_screenshot_file_name FROM class_registrations WHERE id = $1',
      [id],
    )
    const fileName = rows[0]?.payment_screenshot_file_name
    if (!fileName) return response.status(404).json({ message: 'Payment screenshot not found.' })
    response.set('Cache-Control', 'private, no-store')
    return response.sendFile(path.join(config.registrationPaymentDirectory, fileName))
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
  const search = textField(String(request.query.search ?? ''), 120)
  const paymentStatus = String(request.query.paymentStatus ?? '').trim().toUpperCase()
  if (!page) return response.status(400).json({ message: 'Choose a valid page number.' })
  if (search === null) return response.status(400).json({ message: 'Search text is too long.' })
  if (paymentStatus && !['PENDING', 'VERIFIED'].includes(paymentStatus)) {
    return response.status(400).json({ message: 'Choose a valid payment status.' })
  }

  try {
    const values = []
    const filters = []
    if (search) {
      values.push(`%${search}%`)
      const parameter = `$${values.length}`
      filters.push(`(
        full_name ILIKE ${parameter} OR email ILIKE ${parameter} OR phone ILIKE ${parameter}
        OR class_title ILIKE ${parameter} OR payment_method ILIKE ${parameter}
        OR payment_status ILIKE ${parameter}
      )`)
    }
    if (paymentStatus) {
      values.push(paymentStatus)
      filters.push(`payment_status = $${values.length}`)
    }
    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
    const limitParameter = values.length + 1
    const offsetParameter = values.length + 2
    const [items, count] = await Promise.all([
      pool.query(
        `SELECT id, full_name AS "fullName", email, phone, city, country, message,
          class_id AS "classId", class_title AS "classTitle", payment_method AS "paymentMethod",
          payment_status AS "paymentStatus", payment_screenshot_file_name <> '' AS "hasPaymentScreenshot",
          payment_verified_by AS "paymentVerifiedBy", payment_verified_at AS "paymentVerifiedAt",
          created_at AS "createdAt"
         FROM class_registrations ${whereClause}
         ORDER BY created_at DESC, id DESC LIMIT $${limitParameter} OFFSET $${offsetParameter}`,
        [...values, PAGE_SIZE, (page - 1) * PAGE_SIZE],
      ),
      pool.query(`SELECT COUNT(*)::integer AS total FROM class_registrations ${whereClause}`, values),
    ])
    response.set('Cache-Control', 'no-store')
    return response.json({ registrations: items.rows, page, pageSize: PAGE_SIZE, total: count.rows[0].total })
  } catch (error) {
    return next(error)
  }
})

router.patch('/admin/registrations/:id/verify-payment', authenticateAdmin, async (request, response, next) => {
  const id = feedbackId(request.params.id)
  if (!id) return response.status(400).json({ message: 'Choose a valid registration.' })

  try {
    const { rows } = await pool.query(
      `UPDATE class_registrations
       SET payment_status = 'VERIFIED', payment_verified_by = $1, payment_verified_at = NOW()
       WHERE id = $2 AND payment_status = 'PENDING' AND payment_screenshot_file_name <> ''
       RETURNING id, payment_status AS "paymentStatus",
         payment_verified_by AS "paymentVerifiedBy", payment_verified_at AS "paymentVerifiedAt"`,
      [request.admin.username, id],
    )
    if (!rows[0]) {
      const existing = await pool.query('SELECT payment_status FROM class_registrations WHERE id = $1', [id])
      if (!existing.rows[0]) return response.status(404).json({ message: 'Registration not found.' })
      if (existing.rows[0].payment_status === 'VERIFIED') {
        return response.status(409).json({ message: 'This payment has already been verified.' })
      }
      return response.status(400).json({ message: 'A pending payment screenshot is required before verification.' })
    }
    return response.json({ registration: rows[0] })
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

router.use((error, _request, response, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return response.status(400).json({ message: 'Payment screenshots must be 10 MB or smaller.' })
    return response.status(400).json({ message: error.message })
  }
  if (error.message?.startsWith('Upload the payment screenshot')) {
    return response.status(400).json({ message: error.message })
  }
  return next(error)
})

export { router as submissionsRouter }
