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

router.post('/admin/upcoming-classes', authenticateAdmin, upload.single('image'), async (request, response, next) => {
  const file = request.file
  const title = String(request.body?.title ?? '').trim().slice(0, 120)
  if (!file) return response.status(400).json({ message: 'Choose a JPG, PNG or WebP image.' })
  if (!title) {
    await fs.unlink(file.path).catch(() => undefined)
    return response.status(400).json({ message: 'Enter a class title.' })
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
      `INSERT INTO upcoming_classes (title, file_name, original_name, file_size)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, file_name, created_at`,
      [title, webpName, file.originalname, fileSize],
    )
    await client.query('COMMIT')
    return response.status(201).json({ upcomingClass: toUpcomingClass(rows[0]) })
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => undefined)
    await fs.unlink(file.path).catch(() => undefined)
    await fs.unlink(webpPath).catch(() => undefined)
    return next(error)
  } finally {
    client?.release()
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
