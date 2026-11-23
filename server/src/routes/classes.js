import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { config } from '../config.js'
import { pool } from '../db.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'

const router = Router()
const allowedImages = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadDirectory,
    filename: (_request, file, callback) => callback(null, `${crypto.randomUUID()}${allowedImages[file.mimetype]}`),
  }),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (_request, file, callback) => callback(null, Boolean(allowedImages[file.mimetype])),
})

function toUpcomingClass(row) {
  return {
    id: String(row.id),
    title: row.title,
    image: `/uploads/${row.file_name}`,
    createdAt: row.created_at,
  }
}

function toAdminUpcomingClass(row) {
  return { ...toUpcomingClass(row), meetingUrl: row.meeting_url || '' }
}

function cleanMeetingUrl(value) {
  const url = String(value ?? '').trim()
  if (!url) return ''
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    const isZoom = host === 'zoom.us' || host.endsWith('.zoom.us')
    const isGoogleMeet = host === 'meet.google.com'
    return parsed.protocol === 'https:' && (isZoom || isGoogleMeet) ? parsed.toString() : null
  } catch {
    return null
  }
}

router.get('/upcoming-classes', async (_request, response, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, title, file_name, created_at FROM upcoming_classes ORDER BY created_at DESC, id DESC LIMIT 10',
    )
    response.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return response.json({ classes: rows.map(toUpcomingClass) })
  } catch (error) {
    return next(error)
  }
})

router.get('/admin/upcoming-classes', authenticateAdmin, async (_request, response, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, title, meeting_url, file_name, created_at FROM upcoming_classes ORDER BY created_at DESC, id DESC LIMIT 10',
    )
    response.set('Cache-Control', 'no-store')
    return response.json({ classes: rows.map(toAdminUpcomingClass) })
  } catch (error) {
    return next(error)
  }
})

router.post('/admin/upcoming-classes', authenticateAdmin, upload.single('image'), async (request, response, next) => {
  const file = request.file
  const title = String(request.body?.title ?? '').trim().slice(0, 120)
  const meetingUrl = cleanMeetingUrl(request.body?.meetingUrl)
  if (!file) return response.status(400).json({ message: 'Choose a JPG, PNG or WebP image.' })
  if (!title) {
    await fs.unlink(file.path).catch(() => undefined)
    return response.status(400).json({ message: 'Enter a class title.' })
  }
  if (meetingUrl === null) {
    await fs.unlink(file.path).catch(() => undefined)
    return response.status(400).json({ message: 'Use a valid Zoom or Google Meet link.' })
  }

  const webpName = `${crypto.randomUUID()}.webp`
  const webpPath = path.join(config.uploadDirectory, webpName)
  let client
  try {
    await sharp(file.path, { failOn: 'error', limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 86 })
      .toFile(webpPath)
    await fs.unlink(file.path)

    client = await pool.connect()
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock($1)', [20261029])
    const { rows: countRows } = await client.query('SELECT COUNT(*)::integer AS count FROM upcoming_classes')
    if (countRows[0].count >= 10) {
      await client.query('ROLLBACK')
      await fs.unlink(webpPath).catch(() => undefined)
      return response.status(409).json({ message: 'Only 10 upcoming class images can be published. Delete one before adding another.' })
    }
    const fileSize = (await fs.stat(webpPath)).size
    const { rows } = await client.query(
      `INSERT INTO upcoming_classes (title, meeting_url, file_name, original_name, file_size)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, meeting_url, file_name, created_at`,
      [title, meetingUrl, webpName, file.originalname, fileSize],
    )
    await client.query('COMMIT')
    return response.status(201).json({ upcomingClass: toAdminUpcomingClass(rows[0]) })
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => undefined)
    await fs.unlink(file.path).catch(() => undefined)
    await fs.unlink(webpPath).catch(() => undefined)
    return next(error)
  } finally {
    client?.release()
  }
})

router.patch('/admin/upcoming-classes/:id/meeting-link', authenticateAdmin, async (request, response, next) => {
  const meetingUrl = cleanMeetingUrl(request.body?.meetingUrl)
  if (meetingUrl === null) return response.status(400).json({ message: 'Use a valid Zoom or Google Meet link.' })
  try {
    const { rows } = await pool.query(
      `UPDATE upcoming_classes SET meeting_url = $1 WHERE id = $2
       RETURNING id, title, meeting_url, file_name, created_at`,
      [meetingUrl, request.params.id],
    )
    if (!rows[0]) return response.status(404).json({ message: 'Upcoming class not found.' })
    return response.json({ upcomingClass: toAdminUpcomingClass(rows[0]) })
  } catch (error) {
    return next(error)
  }
})

router.delete('/admin/upcoming-classes/:id', authenticateAdmin, async (request, response, next) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM upcoming_classes WHERE id = $1 RETURNING file_name',
      [request.params.id],
    )
    if (!rows.length) return response.status(404).json({ message: 'Upcoming class not found.' })
    await fs.unlink(path.join(config.uploadDirectory, rows[0].file_name)).catch((error) => {
      if (error.code !== 'ENOENT') throw error
    })
    return response.status(204).end()
  } catch (error) {
    return next(error)
  }
})

router.use((error, _request, response, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return response.status(400).json({ message: 'Class images must be 10 MB or smaller.' })
    return response.status(400).json({ message: error.message })
  }
  return next(error)
})

export { router as classesRouter }
