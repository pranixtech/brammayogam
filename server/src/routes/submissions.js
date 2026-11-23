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
import { authenticateUser } from '../middleware/authenticateUser.js'
import { notifyNewRegistration } from '../realtime.js'

const router = Router()
const PAGE_SIZE = 20
const allowedPaymentImages = new Set(['image/jpeg', 'image/png', 'image/webp'])
const feedbackMediaTypes = {
  'video/mp4': { type: 'video', extension: '.mp4' },
  'video/webm': { type: 'video', extension: '.webm' },
  'audio/mpeg': { type: 'audio', extension: '.mp3' },
  'audio/mp4': { type: 'audio', extension: '.m4a' },
  'audio/wav': { type: 'audio', extension: '.wav' },
  'audio/x-wav': { type: 'audio', extension: '.wav' },
  'audio/ogg': { type: 'audio', extension: '.ogg' },
  'audio/webm': { type: 'audio', extension: '.weba' },
  'audio/amr': { type: 'audio', extension: '.amr' },
  'audio/x-amr': { type: 'audio', extension: '.amr' },
}

const paymentScreenshotUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (_request, file, callback) => {
    const allowed = allowedPaymentImages.has(file.mimetype)
    callback(allowed ? null : new Error('Upload the payment screenshot as a JPG, PNG or WebP image.'), allowed)
  },
})

const feedbackMediaUpload = multer({
  storage: multer.diskStorage({
    destination: config.uploadDirectory,
    filename: (_request, file, callback) => {
      callback(null, `feedback-${crypto.randomUUID()}${feedbackMediaTypes[file.mimetype].extension}`)
    },
  }),
  limits: { fileSize: config.maxActivityUploadBytes, files: 1 },
  fileFilter: (_request, file, callback) => {
    const accepted = Boolean(feedbackMediaTypes[file.mimetype])
    callback(accepted ? null : new Error('Upload feedback as an MP4, WebM, MP3, M4A, WAV, OGG or AMR file.'), accepted)
  },
})

const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many submissions. Please try again later.' },
})

const protectedRegistrationActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many password attempts. Please try again later.' },
})

function safeEqual(first, second) {
  const firstBuffer = Buffer.from(String(first))
  const secondBuffer = Buffer.from(String(second))
  return firstBuffer.length === secondBuffer.length && crypto.timingSafeEqual(firstBuffer, secondBuffer)
}

function derivePasswordHash(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) reject(error)
      else resolve(derivedKey.toString('hex'))
    })
  })
}

async function adminPasswordIsValid(username, password) {
  const { rows } = await pool.query(
    'SELECT password_hash, password_salt FROM admin_credentials WHERE lower(username) = lower($1)',
    [username],
  )
  if (!rows[0]) {
    return safeEqual(username, config.adminUsername) && safeEqual(password, config.adminPassword)
  }
  const candidateHash = await derivePasswordHash(String(password), rows[0].password_salt)
  return safeEqual(candidateHash, rows[0].password_hash)
}

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

function validDateFilter(value) {
  if (!value) return ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value
}

function feedbackId(value) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function publishedFeedbackFields(body) {
  const fullName = textField(body?.fullName, 120)
  const roleOrLocation = textField(body?.roleOrLocation ?? '', 160)
  const message = textField(body?.message ?? '', 2000)
  const rating = Number(body?.rating ?? 5)

  if (!fullName || roleOrLocation === null || message === null) return null
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null
  return { fullName, roleOrLocation, message, rating }
}

const publishedFeedbackColumns = `
  id, full_name AS "fullName", role_or_location AS "roleOrLocation",
  rating, message, media_type AS "mediaType",
  CASE WHEN file_name <> '' THEN '/uploads/' || file_name ELSE NULL END AS "mediaUrl",
  original_name AS "originalName", mime_type AS "mimeType", file_size AS "fileSize",
  created_at AS "createdAt", updated_at AS "updatedAt"`

const publicFeedbackColumns = `
  id, full_name AS "fullName", role_or_location AS "roleOrLocation",
  rating, message, media_type AS "mediaType",
  CASE WHEN file_name <> '' THEN '/uploads/' || file_name ELSE NULL END AS "mediaUrl",
  created_at AS "createdAt", updated_at AS "updatedAt"`

async function validFeedbackMedia(file) {
  const handle = await fs.open(file.path, 'r')
  try {
    const header = Buffer.alloc(16)
    const { bytesRead } = await handle.read(header, 0, header.length, 0)
    if (file.mimetype === 'video/mp4' || file.mimetype === 'audio/mp4') {
      return bytesRead >= 12 && header.toString('ascii', 4, 8) === 'ftyp'
    }
    if (file.mimetype === 'video/webm' || file.mimetype === 'audio/webm') {
      return bytesRead >= 4 && header.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
    }
    if (file.mimetype === 'audio/mpeg') {
      return bytesRead >= 3 && (header.toString('ascii', 0, 3) === 'ID3' || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0))
    }
    if (file.mimetype === 'audio/wav' || file.mimetype === 'audio/x-wav') {
      return bytesRead >= 12 && header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WAVE'
    }
    if (file.mimetype === 'audio/amr' || file.mimetype === 'audio/x-amr') {
      return bytesRead >= 6 && (header.toString('ascii', 0, 6) === '#!AMR\n' || header.toString('ascii', 0, 8) === '#!AMR-WB')
    }
    return file.mimetype === 'audio/ogg' && bytesRead >= 4 && header.toString('ascii', 0, 4) === 'OggS'
  } finally {
    await handle.close()
  }
}

router.post('/registrations', authenticateUser, submissionLimiter, paymentScreenshotUpload.single('paymentScreenshot'), async (request, response, next) => {
  const accountResult = await pool.query('SELECT full_name, email, phone FROM user_accounts WHERE id = $1', [request.user.id]).catch(next)
  if (!accountResult) return
  const account = accountResult.rows[0]
  if (!account) return response.status(401).json({ message: 'User account not found. Please log in again.' })
  const fullName = account.full_name
  const email = account.email
  const phone = account.phone ? `+${account.phone}` : ''
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
  if (!['UPI', 'BANK_TRANSFER'].includes(paymentMethod)) {
    return response.status(400).json({ message: 'Choose UPI or Bank Transfer as the payment method.' })
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
    const { rows } = await pool.query(
      `INSERT INTO class_registrations
        (full_name, email, phone, city, country, message, class_id, class_title, payment_method, payment_screenshot_file_name, payment_status, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', $11)
       RETURNING id, full_name AS "fullName", class_title AS "classTitle",
         payment_status AS "paymentStatus", created_at AS "createdAt"`,
      [fullName, email, phone, city, country, message, requestedClassId, classTitle, paymentMethod, paymentScreenshotFileName, request.user.id],
    )
    notifyNewRegistration(rows[0])
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
      `SELECT ${publicFeedbackColumns}
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
  const dateFrom = validDateFilter(String(request.query.dateFrom ?? '').trim())
  const dateTo = validDateFilter(String(request.query.dateTo ?? '').trim())
  const sortBy = String(request.query.sortBy ?? 'createdAt')
  const sortDirection = String(request.query.sortDirection ?? 'desc').toLowerCase()
  const sortColumns = { createdAt: 'created_at', fullName: 'full_name', paymentStatus: 'payment_status', classTitle: 'class_title' }
  if (!page) return response.status(400).json({ message: 'Choose a valid page number.' })
  if (search === null) return response.status(400).json({ message: 'Search text is too long.' })
  if (dateFrom === null || dateTo === null || (dateFrom && dateTo && dateFrom > dateTo)) {
    return response.status(400).json({ message: 'Choose a valid registration date range.' })
  }
  if (!sortColumns[sortBy] || !['asc', 'desc'].includes(sortDirection)) {
    return response.status(400).json({ message: 'Choose a valid table sort.' })
  }
  if (paymentStatus && !['PENDING', 'VERIFIED'].includes(paymentStatus)) {
    return response.status(400).json({ message: 'Choose a valid payment status.' })
  }

  try {
    const values = []
    const filters = []
    if (search) {
      const registrationIdSearch = /^#(\d+)$/.exec(search)
      if (registrationIdSearch) {
        values.push(Number(registrationIdSearch[1]))
        filters.push(`id = $${values.length}`)
      } else {
        values.push(`%${search}%`)
        const parameter = `$${values.length}`
        filters.push(`(
          full_name ILIKE ${parameter} OR email ILIKE ${parameter} OR phone ILIKE ${parameter}
          OR class_title ILIKE ${parameter} OR payment_method ILIKE ${parameter}
          OR payment_status ILIKE ${parameter}
        )`)
      }
    }
    if (paymentStatus) {
      values.push(paymentStatus)
      filters.push(`payment_status = $${values.length}`)
    }
    if (dateFrom) {
      values.push(dateFrom)
      filters.push(`created_at >= $${values.length}::date`)
    }
    if (dateTo) {
      values.push(dateTo)
      filters.push(`created_at < ($${values.length}::date + INTERVAL '1 day')`)
    }
    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
    const orderColumn = sortColumns[sortBy]
    const orderDirection = sortDirection.toUpperCase()
    const limitParameter = values.length + 1
    const offsetParameter = values.length + 2
    const [items, count] = await Promise.all([
      pool.query(
        `SELECT id, user_id AS "userId", full_name AS "fullName", email, phone, city, country, message,
          class_id AS "classId", class_title AS "classTitle", payment_method AS "paymentMethod",
          payment_status AS "paymentStatus", payment_screenshot_file_name <> '' AS "hasPaymentScreenshot",
          payment_verified_by AS "paymentVerifiedBy", payment_verified_at AS "paymentVerifiedAt",
          payment_status_updated_by AS "paymentStatusUpdatedBy", payment_status_updated_at AS "paymentStatusUpdatedAt",
          created_at AS "createdAt"
         FROM class_registrations ${whereClause}
         ORDER BY ${orderColumn} ${orderDirection}, id ${orderDirection}
         LIMIT $${limitParameter} OFFSET $${offsetParameter}`,
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

router.get('/admin/registrations/share-template', authenticateAdmin, async (_request, response, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT template_html AS "templateHtml", updated_by AS "updatedBy", updated_at AS "updatedAt" FROM registration_share_settings WHERE id = 1',
    )
    response.set('Cache-Control', 'no-store')
    return response.json({ template: rows[0] })
  } catch (error) {
    return next(error)
  }
})

router.put('/admin/registrations/share-template', authenticateAdmin, async (request, response, next) => {
  const templateHtml = typeof request.body?.templateHtml === 'string' ? request.body.templateHtml.trim() : ''
  const plainText = templateHtml.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim()
  const unsafeHtml = /<(script|iframe|object|embed|style|link|meta)\b|\son\w+\s*=|javascript\s*:/i.test(templateHtml)
  if (!plainText) return response.status(400).json({ message: 'Enter a WhatsApp message template.' })
  if (templateHtml.length > 10000) return response.status(400).json({ message: 'The WhatsApp message template is too long.' })
  if (unsafeHtml) return response.status(400).json({ message: 'The WhatsApp message template contains unsupported content.' })

  try {
    const { rows } = await pool.query(
      `UPDATE registration_share_settings
       SET template_html = $1, updated_by = $2, updated_at = NOW()
       WHERE id = 1
       RETURNING template_html AS "templateHtml", updated_by AS "updatedBy", updated_at AS "updatedAt"`,
      [templateHtml, request.admin.username],
    )
    return response.json({ template: rows[0] })
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
       SET payment_status = 'VERIFIED', payment_verified_by = $1, payment_verified_at = NOW(),
         payment_status_updated_by = $1, payment_status_updated_at = NOW()
       WHERE id = $2 AND payment_status = 'PENDING' AND payment_screenshot_file_name <> ''
       RETURNING id, payment_status AS "paymentStatus",
         payment_verified_by AS "paymentVerifiedBy", payment_verified_at AS "paymentVerifiedAt",
         payment_status_updated_by AS "paymentStatusUpdatedBy", payment_status_updated_at AS "paymentStatusUpdatedAt"`,
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

router.patch('/admin/registrations/:id/undo-verification', authenticateAdmin, protectedRegistrationActionLimiter, async (request, response, next) => {
  const id = feedbackId(request.params.id)
  const password = typeof request.body?.password === 'string' ? request.body.password : ''
  if (!id) return response.status(400).json({ message: 'Choose a valid registration.' })
  if (!password || password.length > 256) return response.status(400).json({ message: 'Enter your admin password.' })

  try {
    const passwordIsValid = await adminPasswordIsValid(request.admin.username, password)
    if (!passwordIsValid) return response.status(403).json({ message: 'The admin password is incorrect.' })

    const { rows } = await pool.query(
      `UPDATE class_registrations
       SET payment_status = 'PENDING', payment_verified_by = NULL, payment_verified_at = NULL,
         payment_status_updated_by = $1, payment_status_updated_at = NOW()
       WHERE id = $2 AND payment_status = 'VERIFIED' AND payment_screenshot_file_name <> ''
       RETURNING id, payment_status AS "paymentStatus",
         payment_verified_by AS "paymentVerifiedBy", payment_verified_at AS "paymentVerifiedAt",
         payment_status_updated_by AS "paymentStatusUpdatedBy", payment_status_updated_at AS "paymentStatusUpdatedAt"`,
      [request.admin.username, id],
    )
    if (!rows[0]) {
      const existing = await pool.query('SELECT payment_status FROM class_registrations WHERE id = $1', [id])
      if (!existing.rows[0]) return response.status(404).json({ message: 'Registration not found.' })
      return response.status(409).json({ message: 'Only a verified payment can be returned to pending.' })
    }
    return response.json({ registration: rows[0] })
  } catch (error) {
    return next(error)
  }
})

router.delete('/admin/registrations/:id', authenticateAdmin, protectedRegistrationActionLimiter, async (request, response, next) => {
  const id = feedbackId(request.params.id)
  const password = typeof request.body?.password === 'string' ? request.body.password : ''
  if (!id) return response.status(400).json({ message: 'Choose a valid registration.' })
  if (!password || password.length > 256) return response.status(400).json({ message: 'Enter your admin password.' })

  try {
    const passwordIsValid = await adminPasswordIsValid(request.admin.username, password)
    if (!passwordIsValid) return response.status(403).json({ message: 'The admin password is incorrect.' })

    const { rows } = await pool.query(
      `DELETE FROM class_registrations
       WHERE id = $1
       RETURNING payment_screenshot_file_name AS "paymentScreenshotFileName"`,
      [id],
    )
    if (!rows[0]) return response.status(404).json({ message: 'Registration not found.' })

    const fileName = rows[0].paymentScreenshotFileName
    if (fileName) {
      await fs.unlink(path.join(config.registrationPaymentDirectory, fileName)).catch(() => undefined)
    }
    return response.status(204).end()
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

router.post('/admin/feedback', authenticateAdmin, feedbackMediaUpload.single('media'), async (request, response, next) => {
  const fields = publishedFeedbackFields(request.body)
  const file = request.file
  if (!fields) {
    if (file) await fs.unlink(file.path).catch(() => undefined)
    return response.status(400).json({ message: 'Enter a name and a rating from 1 to 5.' })
  }
  if (!file) return response.status(400).json({ message: 'Choose an audio or video feedback file.' })
  if (!(await validFeedbackMedia(file))) {
    await fs.unlink(file.path).catch(() => undefined)
    return response.status(400).json({ message: 'The selected feedback file is not a valid supported audio or video file.' })
  }

  try {
    const media = feedbackMediaTypes[file.mimetype]
    const { rows } = await pool.query(
      `INSERT INTO published_feedback
        (full_name, role_or_location, rating, message, media_type, file_name, original_name, mime_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING ${publishedFeedbackColumns}`,
      [fields.fullName, fields.roleOrLocation, fields.rating, fields.message, media.type, file.filename, file.originalname, file.mimetype, file.size],
    )
    return response.status(201).json({ feedback: rows[0] })
  } catch (error) {
    await fs.unlink(file.path).catch(() => undefined)
    return next(error)
  }
})

router.put('/admin/feedback/:id', authenticateAdmin, feedbackMediaUpload.single('media'), async (request, response, next) => {
  const id = feedbackId(request.params.id)
  const fields = publishedFeedbackFields(request.body)
  const file = request.file
  if (!id) {
    if (file) await fs.unlink(file.path).catch(() => undefined)
    return response.status(400).json({ message: 'Choose a valid feedback entry.' })
  }
  if (!fields) {
    if (file) await fs.unlink(file.path).catch(() => undefined)
    return response.status(400).json({ message: 'Enter a name and a rating from 1 to 5.' })
  }
  if (file && !(await validFeedbackMedia(file))) {
    await fs.unlink(file.path).catch(() => undefined)
    return response.status(400).json({ message: 'The selected feedback file is not a valid supported audio or video file.' })
  }

  try {
    const existing = await pool.query('SELECT file_name FROM published_feedback WHERE id = $1', [id])
    if (!existing.rows[0]) {
      if (file) await fs.unlink(file.path).catch(() => undefined)
      return response.status(404).json({ message: 'Feedback entry not found.' })
    }
    let result
    if (file) {
      const media = feedbackMediaTypes[file.mimetype]
      result = await pool.query(
        `UPDATE published_feedback
         SET full_name = $1, role_or_location = $2, rating = $3, message = $4,
           media_type = $5, file_name = $6, original_name = $7, mime_type = $8, file_size = $9, updated_at = NOW()
         WHERE id = $10
         RETURNING ${publishedFeedbackColumns}`,
        [fields.fullName, fields.roleOrLocation, fields.rating, fields.message, media.type, file.filename, file.originalname, file.mimetype, file.size, id],
      )
      if (existing.rows[0].file_name) await fs.unlink(path.join(config.uploadDirectory, existing.rows[0].file_name)).catch(() => undefined)
    } else {
      result = await pool.query(
        `UPDATE published_feedback
         SET full_name = $1, role_or_location = $2, rating = $3, message = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING ${publishedFeedbackColumns}`,
        [fields.fullName, fields.roleOrLocation, fields.rating, fields.message, id],
      )
    }
    const { rows } = result
    if (!rows[0]) return response.status(404).json({ message: 'Feedback entry not found.' })
    return response.json({ feedback: rows[0] })
  } catch (error) {
    if (file) await fs.unlink(file.path).catch(() => undefined)
    return next(error)
  }
})

router.delete('/admin/feedback/:id', authenticateAdmin, async (request, response, next) => {
  const id = feedbackId(request.params.id)
  if (!id) return response.status(400).json({ message: 'Choose a valid feedback entry.' })

  try {
    const { rows } = await pool.query('DELETE FROM published_feedback WHERE id = $1 RETURNING file_name', [id])
    if (!rows[0]) return response.status(404).json({ message: 'Feedback entry not found.' })
    if (rows[0].file_name) await fs.unlink(path.join(config.uploadDirectory, rows[0].file_name)).catch(() => undefined)
    return response.status(204).end()
  } catch (error) {
    return next(error)
  }
})

router.use((error, _request, response, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return response.status(400).json({ message: 'The selected upload is larger than the allowed file-size limit.' })
    return response.status(400).json({ message: error.message })
  }
  if (error.message?.startsWith('Upload the payment screenshot')) {
    return response.status(400).json({ message: error.message })
  }
  if (error.message?.startsWith('Upload feedback as')) return response.status(400).json({ message: error.message })
  return next(error)
})

export { router as submissionsRouter }
