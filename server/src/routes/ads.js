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
const allowedImages = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_ADS = 5

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: MAX_ADS },
  fileFilter: (_request, file, callback) => {
    const allowed = allowedImages.has(file.mimetype)
    callback(allowed ? null : new Error('Only JPG, PNG and WebP images are allowed.'), allowed)
  },
})

function toAd(row) {
  return {
    id: String(row.id),
    image: `/uploads/${row.file_name}`,
    createdAt: row.created_at,
  }
}

router.get('/ads', async (_request, response, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, file_name, created_at FROM homepage_ads ORDER BY created_at ASC, id ASC LIMIT 5',
    )
    response.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return response.json({ ads: rows.map(toAd) })
  } catch (error) {
    return next(error)
  }
})

router.post('/admin/ads', authenticateAdmin, upload.array('images', MAX_ADS), async (request, response, next) => {
  const files = request.files ?? []
  if (!files.length) return response.status(400).json({ message: 'Choose at least one JPG, PNG or WebP image.' })

  const writtenFiles = []
  let client
  try {
    client = await pool.connect()
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock($1)', [20261030])
    const { rows: countRows } = await client.query('SELECT COUNT(*)::integer AS count FROM homepage_ads')
    const availableSlots = MAX_ADS - countRows[0].count
    if (files.length > availableSlots) {
      await client.query('ROLLBACK')
      return response.status(409).json({
        message: availableSlots > 0
          ? `Only ${availableSlots} ad slot${availableSlots === 1 ? '' : 's'} remaining.`
          : 'All 5 ad slots are filled. Delete one before uploading another.',
      })
    }

    const ads = []
    for (const file of files) {
      const webpName = `${crypto.randomUUID()}.webp`
      const webpPath = path.join(config.uploadDirectory, webpName)
      await sharp(file.buffer, { failOn: 'error', limitInputPixels: 50_000_000 })
        .rotate()
        .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 88 })
        .toFile(webpPath)
      writtenFiles.push(webpPath)
      const fileSize = (await fs.stat(webpPath)).size
      const { rows } = await client.query(
        `INSERT INTO homepage_ads (file_name, original_name, file_size)
         VALUES ($1, $2, $3)
         RETURNING id, file_name, created_at`,
        [webpName, file.originalname, fileSize],
      )
      ads.push(toAd(rows[0]))
    }

    await client.query('COMMIT')
    return response.status(201).json({ ads })
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => undefined)
    await Promise.all(writtenFiles.map((filePath) => fs.unlink(filePath).catch(() => undefined)))
    return next(error)
  } finally {
    client?.release()
  }
})

router.delete('/admin/ads/:id', authenticateAdmin, async (request, response, next) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM homepage_ads WHERE id = $1 RETURNING file_name',
      [request.params.id],
    )
    if (!rows.length) return response.status(404).json({ message: 'Ad not found.' })
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
    if (error.code === 'LIMIT_FILE_SIZE') return response.status(400).json({ message: 'Ad images must be 10 MB or smaller.' })
    if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') return response.status(400).json({ message: 'Upload no more than 5 ad images at once.' })
    return response.status(400).json({ message: error.message })
  }
  return next(error)
})

export { router as adsRouter }
