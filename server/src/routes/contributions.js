import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { config } from '../config.js'
import { pool } from '../db.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'

const MAX_CONTRIBUTIONS = 2
const router = Router()
const mediaTypes = {
  'image/jpeg': { type: 'image', extension: '.jpg' },
  'image/png': { type: 'image', extension: '.png' },
  'image/webp': { type: 'image', extension: '.webp' },
  'video/mp4': { type: 'video', extension: '.mp4' },
  'video/webm': { type: 'video', extension: '.webm' },
}

const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadDirectory,
    filename: (_request, file, callback) => {
      callback(null, `${crypto.randomUUID()}${mediaTypes[file.mimetype].extension}`)
    },
  }),
  limits: { fileSize: config.maxActivityUploadBytes, files: 1 },
  fileFilter: (_request, file, callback) => {
    callback(null, Boolean(mediaTypes[file.mimetype]))
  },
})

function toContribution(row) {
  return {
    id: String(row.id),
    quote: row.quote,
    mediaType: row.media_type,
    src: `/uploads/${row.file_name}`,
    createdAt: row.created_at,
  }
}

async function isValidVideo(file) {
  const handle = await fs.open(file.path, 'r')
  try {
    const header = Buffer.alloc(16)
    const { bytesRead } = await handle.read(header, 0, header.length, 0)
    if (file.mimetype === 'video/mp4') {
      return bytesRead >= 12 && header.toString('ascii', 4, 8) === 'ftyp'
    }
    return bytesRead >= 4 && header.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
  } finally {
    await handle.close()
  }
}

router.get('/contributions', async (_request, response, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, quote, media_type, file_name, created_at
       FROM annathanam_contributions ORDER BY created_at ASC, id ASC LIMIT $1`,
      [MAX_CONTRIBUTIONS],
    )
    response.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.json({ contributions: rows.map(toContribution), limit: MAX_CONTRIBUTIONS })
  } catch (error) {
    next(error)
  }
})

router.post('/admin/contributions', authenticateAdmin, upload.single('media'), async (request, response, next) => {
  const file = request.file
  const quote = String(request.body?.quote ?? '').trim().slice(0, 1000)
  const mediaType = file && mediaTypes[file.mimetype]?.type

  if (!file) return response.status(400).json({ message: 'Choose a JPG, PNG, WebP, MP4 or WebM file.' })
  if (!quote) {
    await fs.unlink(file.path).catch(() => undefined)
    return response.status(400).json({ message: 'Enter the quote shown below the media.' })
  }

  let finalPath = file.path
  let imageOutputPath
  let client
  try {
    if (mediaType === 'image') {
      const webpName = `${crypto.randomUUID()}.webp`
      const webpPath = path.join(config.uploadDirectory, webpName)
      imageOutputPath = webpPath
      try {
        await sharp(file.path, { failOn: 'error', limitInputPixels: 50_000_000 })
          .rotate()
          .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 86 })
          .toFile(webpPath)
      } catch {
        await fs.unlink(file.path).catch(() => undefined)
        await fs.unlink(webpPath).catch(() => undefined)
        return response.status(400).json({ message: 'The selected image could not be read.' })
      }
      await fs.unlink(file.path)
      finalPath = webpPath
    } else if (!(await isValidVideo(file))) {
      await fs.unlink(file.path)
      return response.status(400).json({ message: 'The selected video is not a valid MP4 or WebM file.' })
    }

    const fileName = path.basename(finalPath)
    const fileSize = (await fs.stat(finalPath)).size
    client = await pool.connect()
    await client.query('BEGIN')
    await client.query('LOCK TABLE annathanam_contributions IN EXCLUSIVE MODE')
    const { rows: countRows } = await client.query('SELECT COUNT(*)::int AS count FROM annathanam_contributions')
    if (countRows[0].count >= MAX_CONTRIBUTIONS) {
      await client.query('ROLLBACK')
      await fs.unlink(finalPath).catch(() => undefined)
      return response.status(409).json({ message: 'Only two Annathanam contributions can be published. Delete one before adding another.' })
    }

    const { rows } = await client.query(
      `INSERT INTO annathanam_contributions (quote, media_type, file_name, original_name, file_size)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, quote, media_type, file_name, created_at`,
      [quote, mediaType, fileName, file.originalname, fileSize],
    )
    await client.query('COMMIT')
    return response.status(201).json({ contribution: toContribution(rows[0]), limit: MAX_CONTRIBUTIONS })
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => undefined)
    await fs.unlink(finalPath).catch(() => undefined)
    if (finalPath !== file.path) await fs.unlink(file.path).catch(() => undefined)
    if (imageOutputPath && imageOutputPath !== finalPath) await fs.unlink(imageOutputPath).catch(() => undefined)
    return next(error)
  } finally {
    client?.release()
  }
})

router.delete('/admin/contributions/:id', authenticateAdmin, async (request, response, next) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM annathanam_contributions WHERE id = $1 RETURNING file_name',
      [request.params.id],
    )
    if (!rows.length) return response.status(404).json({ message: 'Annathanam contribution not found.' })
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
    if (error.code === 'LIMIT_FILE_SIZE') {
      return response.status(400).json({ message: 'Annathanam media files must be 100 MB or smaller.' })
    }
    return response.status(400).json({ message: error.message })
  }
  return next(error)
})

export { router as contributionsRouter }
