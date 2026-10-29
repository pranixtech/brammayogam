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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (_request, file, callback) => {
    const allowed = allowedImages.has(file.mimetype)
    callback(allowed ? null : new Error('Only JPG, PNG and WebP images are allowed.'), allowed)
  },
})

function toQuoteImage(row) {
  return {
    id: String(row.id),
    image: `/uploads/${row.file_name}`,
    createdAt: row.created_at,
  }
}

router.get('/quote-image', async (_request, response, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, file_name, created_at FROM quote_images ORDER BY created_at DESC, id DESC LIMIT 1',
    )
    response.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return response.json({ quoteImage: rows[0] ? toQuoteImage(rows[0]) : null })
  } catch (error) {
    return next(error)
  }
})

router.post('/admin/quote-image', authenticateAdmin, upload.single('image'), async (request, response, next) => {
  const file = request.file
  if (!file) return response.status(400).json({ message: 'Choose a JPG, PNG or WebP image.' })

  const webpName = `${crypto.randomUUID()}.webp`
  const webpPath = path.join(config.uploadDirectory, webpName)
  let client
  try {
    await sharp(file.buffer, { failOn: 'error', limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 88 })
      .toFile(webpPath)
    const fileSize = (await fs.stat(webpPath)).size

    client = await pool.connect()
    await client.query('BEGIN')
    await client.query('LOCK TABLE quote_images IN EXCLUSIVE MODE')
    const { rows: existingRows } = await client.query('SELECT file_name FROM quote_images')
    await client.query('DELETE FROM quote_images')
    const { rows } = await client.query(
      `INSERT INTO quote_images (file_name, original_name, file_size)
       VALUES ($1, $2, $3)
       RETURNING id, file_name, created_at`,
      [webpName, file.originalname, fileSize],
    )
    await client.query('COMMIT')
    await Promise.all(existingRows.map(({ file_name: oldFile }) => (
      fs.unlink(path.join(config.uploadDirectory, oldFile)).catch(() => undefined)
    )))
    return response.status(201).json({ quoteImage: toQuoteImage(rows[0]) })
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => undefined)
    await fs.unlink(webpPath).catch(() => undefined)
    return next(error)
  } finally {
    client?.release()
  }
})

router.delete('/admin/quote-image/:id', authenticateAdmin, async (request, response, next) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM quote_images WHERE id = $1 RETURNING file_name',
      [request.params.id],
    )
    if (!rows.length) return response.status(404).json({ message: 'Quote image not found.' })
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
    if (error.code === 'LIMIT_FILE_SIZE') return response.status(400).json({ message: 'Quote images must be 10 MB or smaller.' })
    return response.status(400).json({ message: error.message })
  }
  return next(error)
})

export { router as quotesRouter }
