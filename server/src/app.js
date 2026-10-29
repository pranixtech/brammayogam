import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import cookieParser from 'cookie-parser'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import sharp from 'sharp'
import { config } from './config.js'
import { pool } from './db.js'
import { ADMIN_COOKIE_NAME, authenticateAdmin } from './middleware/authenticateAdmin.js'
import { activitiesRouter } from './routes/activities.js'
import { adsRouter } from './routes/ads.js'
import { classesRouter } from './routes/classes.js'
import { contributionsRouter } from './routes/contributions.js'
import { paymentsRouter } from './routes/payments.js'
import { quotesRouter } from './routes/quotes.js'
import { submissionsRouter } from './routes/submissions.js'

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 20 },
  fileFilter: (_request, file, callback) => {
    callback(allowedMimeTypes.has(file.mimetype) ? null : new Error('Only JPG, PNG and WebP images are allowed.'), allowedMimeTypes.has(file.mimetype))
  },
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
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

async function isValidAdminLogin(username, password) {
  if (!safeEqual(username, config.adminUsername)) return false
  const { rows } = await pool.query(
    'SELECT password_hash, password_salt FROM admin_credentials WHERE username = $1',
    [config.adminUsername],
  )
  if (!rows[0]) return safeEqual(password, config.adminPassword)
  const candidateHash = await derivePasswordHash(String(password), rows[0].password_salt)
  return safeEqual(candidateHash, rows[0].password_hash)
}

function toPhoto(row) {
  return {
    id: String(row.id),
    categoryId: row.category_id,
    src: `/uploads/${row.file_name}`,
    alt: row.alt_text,
    width: row.width,
    height: row.height,
    createdAt: row.created_at,
  }
}

function extractYouTubeId(value) {
  let parsedUrl
  try {
    parsedUrl = new URL(String(value).trim())
  } catch {
    return null
  }

  const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '')
  let videoId = null
  if (hostname === 'youtu.be') {
    videoId = parsedUrl.pathname.split('/').filter(Boolean)[0]
  } else if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
    if (parsedUrl.pathname === '/watch') videoId = parsedUrl.searchParams.get('v')
    else {
      const [type, id] = parsedUrl.pathname.split('/').filter(Boolean)
      if (['embed', 'shorts', 'live'].includes(type)) videoId = id
    }
  }

  return /^[A-Za-z0-9_-]{11}$/.test(videoId ?? '') ? videoId : null
}

function toVideo(row) {
  return {
    id: String(row.id),
    youtubeId: row.youtube_id,
    title: row.title,
    url: `https://www.youtube.com/watch?v=${row.youtube_id}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${row.youtube_id}`,
    thumbnail: `https://i.ytimg.com/vi/${row.youtube_id}/hqdefault.jpg`,
    createdAt: row.created_at,
  }
}

export async function createApp() {
  await fs.mkdir(config.uploadDirectory, { recursive: true })

  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'same-site' },
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", 'data:', 'https://i.ytimg.com'],
        frameSrc: ["'self'", 'https://www.youtube-nocookie.com'],
      },
    },
  }))
  app.use(express.json({
    limit: '100kb',
    verify: (request, _response, buffer) => {
      if (request.originalUrl === '/api/payments/webhook') request.rawBody = Buffer.from(buffer)
    },
  }))
  app.use(cookieParser())
  app.use('/uploads', express.static(config.uploadDirectory, { immutable: true, maxAge: '30d', fallthrough: false }))
  app.use('/api', activitiesRouter)
  app.use('/api', adsRouter)
  app.use('/api', classesRouter)
  app.use('/api', contributionsRouter)
  app.use('/api', paymentsRouter)
  app.use('/api', quotesRouter)
  app.use('/api', submissionsRouter)

  app.get('/api/health', async (_request, response, next) => {
    try {
      await pool.query('SELECT 1')
      response.json({ status: 'ok' })
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/categories', async (_request, response, next) => {
    try {
      const { rows } = await pool.query(
        'SELECT id, label, description FROM photo_categories ORDER BY sort_order, label',
      )
      response.json({ categories: rows })
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/photos', async (request, response, next) => {
    try {
      const parameters = []
      let where = ''
      if (request.query.category) {
        parameters.push(request.query.category)
        where = 'WHERE category_id = $1'
      }
      const { rows } = await pool.query(
        `SELECT id, category_id, file_name, alt_text, width, height, created_at
         FROM photos ${where} ORDER BY created_at DESC, id DESC`,
        parameters,
      )
      response.set('Cache-Control', 'no-store, no-cache, must-revalidate')
      response.json({ photos: rows.map(toPhoto) })
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/videos', async (_request, response, next) => {
    try {
      const { rows } = await pool.query(
        'SELECT id, youtube_id, title, created_at FROM youtube_videos ORDER BY created_at DESC, id DESC',
      )
      response.set('Cache-Control', 'no-store, no-cache, must-revalidate')
      response.json({ videos: rows.map(toVideo) })
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/home-videos', async (_request, response, next) => {
    try {
      const { rows } = await pool.query(
        'SELECT id, youtube_id, title, created_at FROM homepage_youtube_videos ORDER BY created_at DESC, id DESC LIMIT 4',
      )
      response.set('Cache-Control', 'no-store, no-cache, must-revalidate')
      response.json({ videos: rows.map(toVideo) })
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/guru-interviews', async (_request, response, next) => {
    try {
      const { rows } = await pool.query(
        'SELECT id, youtube_id, title, created_at FROM guru_interview_videos ORDER BY created_at DESC, id DESC LIMIT 3',
      )
      response.set('Cache-Control', 'no-store, no-cache, must-revalidate')
      response.json({ videos: rows.map(toVideo) })
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/admin/login', loginLimiter, async (request, response, next) => {
    const { username = '', password = '' } = request.body ?? {}
    try {
      const isValid = await isValidAdminLogin(username, password)
      if (!isValid) return response.status(401).json({ message: 'Invalid username or password.' })

      const token = jwt.sign({ username: config.adminUsername, role: 'admin' }, config.jwtSecret, {
        algorithm: 'HS256',
        issuer: 'brahmam-foundation',
        audience: 'brahmam-admin',
        expiresIn: '8h',
      })

      response.cookie(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: config.cookieSecure,
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000,
        path: '/',
      })
      return response.json({ admin: { username: config.adminUsername } })
    } catch (error) {
      return next(error)
    }
  })

  app.post('/api/admin/logout', (_request, response) => {
    response.clearCookie(ADMIN_COOKIE_NAME, { path: '/' })
    response.status(204).end()
  })

  app.get('/api/admin/session', authenticateAdmin, (request, response) => {
    response.json({ admin: { username: request.admin.username } })
  })

  app.post('/api/admin/photos', authenticateAdmin, upload.array('images', 20), async (request, response, next) => {
    const files = request.files ?? []
    const categoryId = String(request.body.categoryId ?? '')
    const altText = String(request.body.altText ?? '').trim().slice(0, 240)
    const writtenFiles = []
    let client

    if (files.length === 0) return response.status(400).json({ message: 'Select at least one image.' })

    try {
      const category = await pool.query('SELECT id, label FROM photo_categories WHERE id = $1', [categoryId])
      if (category.rowCount === 0) return response.status(400).json({ message: 'Choose a valid photo category.' })

      client = await pool.connect()
      await client.query('BEGIN')
      const insertedPhotos = []
      for (const [index, file] of files.entries()) {
        const fileName = `${crypto.randomUUID()}.webp`
        const outputPath = path.join(config.uploadDirectory, fileName)
        const image = sharp(file.buffer, { failOn: 'error', limitInputPixels: 50_000_000 })
          .rotate()
          .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 86 })
        const metadata = await image.toFile(outputPath)
        writtenFiles.push(outputPath)

        const imageAlt = altText || `${category.rows[0].label} gallery image ${index + 1}`
        const { rows } = await client.query(
          `INSERT INTO photos (category_id, file_name, original_name, alt_text, width, height, file_size)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, category_id, file_name, alt_text, width, height, created_at`,
          [categoryId, fileName, file.originalname, imageAlt, metadata.width, metadata.height, metadata.size],
        )
        insertedPhotos.push(toPhoto(rows[0]))
      }

      await client.query('COMMIT')
      return response.status(201).json({ photos: insertedPhotos })
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => undefined)
      await Promise.all(writtenFiles.map((filePath) => fs.unlink(filePath).catch(() => undefined)))
      return next(error)
    } finally {
      client?.release()
    }
  })

  app.delete('/api/admin/photos/:id', authenticateAdmin, async (request, response, next) => {
    try {
      const { rows } = await pool.query('DELETE FROM photos WHERE id = $1 RETURNING file_name', [request.params.id])
      if (rows.length === 0) return response.status(404).json({ message: 'Photo not found.' })

      await fs.unlink(path.join(config.uploadDirectory, rows[0].file_name)).catch((error) => {
        if (error.code !== 'ENOENT') throw error
      })
      return response.status(204).end()
    } catch (error) {
      return next(error)
    }
  })

  app.post('/api/admin/videos', authenticateAdmin, async (request, response, next) => {
    const youtubeId = extractYouTubeId(request.body?.url)
    const title = String(request.body?.title ?? '').trim().slice(0, 160)
    if (!youtubeId) return response.status(400).json({ message: 'Enter a valid YouTube video link.' })
    if (!title) return response.status(400).json({ message: 'Enter a title for the video.' })

    try {
      const { rows } = await pool.query(
        `INSERT INTO youtube_videos (youtube_id, title)
         VALUES ($1, $2)
         RETURNING id, youtube_id, title, created_at`,
        [youtubeId, title],
      )
      return response.status(201).json({ video: toVideo(rows[0]) })
    } catch (error) {
      if (error.code === '23505') return response.status(409).json({ message: 'This YouTube video is already in the gallery.' })
      return next(error)
    }
  })

  app.delete('/api/admin/videos/:id', authenticateAdmin, async (request, response, next) => {
    try {
      const result = await pool.query('DELETE FROM youtube_videos WHERE id = $1', [request.params.id])
      if (result.rowCount === 0) return response.status(404).json({ message: 'Video not found.' })
      return response.status(204).end()
    } catch (error) {
      return next(error)
    }
  })

  app.post('/api/admin/home-videos', authenticateAdmin, async (request, response, next) => {
    const youtubeId = extractYouTubeId(request.body?.url)
    const title = String(request.body?.title ?? '').trim().slice(0, 160)
    if (!youtubeId) return response.status(400).json({ message: 'Enter a valid YouTube video link.' })
    if (!title) return response.status(400).json({ message: 'Enter a title for the video.' })

    let client
    try {
      client = await pool.connect()
      await client.query('BEGIN')
      await client.query('LOCK TABLE homepage_youtube_videos IN EXCLUSIVE MODE')
      const countResult = await client.query('SELECT COUNT(*)::integer AS total FROM homepage_youtube_videos')
      if (countResult.rows[0].total >= 4) {
        await client.query('ROLLBACK')
        return response.status(409).json({ message: 'The homepage already has four videos. Delete one before adding another.' })
      }

      const { rows } = await client.query(
        `INSERT INTO homepage_youtube_videos (youtube_id, title)
         VALUES ($1, $2)
         RETURNING id, youtube_id, title, created_at`,
        [youtubeId, title],
      )
      await client.query('COMMIT')
      return response.status(201).json({ video: toVideo(rows[0]) })
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => undefined)
      if (error.code === '23505') return response.status(409).json({ message: 'This YouTube video is already on the homepage.' })
      return next(error)
    } finally {
      client?.release()
    }
  })

  app.delete('/api/admin/home-videos/:id', authenticateAdmin, async (request, response, next) => {
    try {
      const result = await pool.query('DELETE FROM homepage_youtube_videos WHERE id = $1', [request.params.id])
      if (result.rowCount === 0) return response.status(404).json({ message: 'Homepage video not found.' })
      return response.status(204).end()
    } catch (error) {
      return next(error)
    }
  })

  app.post('/api/admin/guru-interviews', authenticateAdmin, async (request, response, next) => {
    const youtubeId = extractYouTubeId(request.body?.url)
    const title = String(request.body?.title ?? '').trim().slice(0, 160)
    if (!youtubeId) return response.status(400).json({ message: 'Enter a valid YouTube video link.' })
    if (!title) return response.status(400).json({ message: 'Enter a title for the interview.' })

    let client
    try {
      client = await pool.connect()
      await client.query('BEGIN')
      await client.query('LOCK TABLE guru_interview_videos IN EXCLUSIVE MODE')
      const countResult = await client.query('SELECT COUNT(*)::integer AS total FROM guru_interview_videos')
      if (countResult.rows[0].total >= 3) {
        await client.query('ROLLBACK')
        return response.status(409).json({ message: 'Three Guru interview videos are already published. Delete one before adding another.' })
      }
      const { rows } = await client.query(
        `INSERT INTO guru_interview_videos (youtube_id, title)
         VALUES ($1, $2)
         RETURNING id, youtube_id, title, created_at`,
        [youtubeId, title],
      )
      await client.query('COMMIT')
      return response.status(201).json({ video: toVideo(rows[0]) })
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => undefined)
      if (error.code === '23505') return response.status(409).json({ message: 'This interview is already published.' })
      return next(error)
    } finally {
      client?.release()
    }
  })

  app.delete('/api/admin/guru-interviews/:id', authenticateAdmin, async (request, response, next) => {
    try {
      const result = await pool.query('DELETE FROM guru_interview_videos WHERE id = $1', [request.params.id])
      if (result.rowCount === 0) return response.status(404).json({ message: 'Guru interview not found.' })
      return response.status(204).end()
    } catch (error) {
      return next(error)
    }
  })

  app.use((error, _request, response, next) => {
    void next
    console.error(error)
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE' ? 'Each image must be 10 MB or smaller.' : error.message
      return response.status(400).json({ message })
    }
    if (error.message?.startsWith('Only JPG')) return response.status(400).json({ message: error.message })
    if (error.statusCode) return response.status(error.statusCode).json({ message: error.message })
    return response.status(500).json({ message: 'An unexpected server error occurred.' })
  })

  return app
}
