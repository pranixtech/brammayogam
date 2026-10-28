import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export const ADMIN_COOKIE_NAME = 'brahmam_admin'

export function authenticateAdmin(request, response, next) {
  const token = request.cookies[ADMIN_COOKIE_NAME]
  if (!token) return response.status(401).json({ message: 'Admin authentication required.' })

  try {
    request.admin = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'brahmam-foundation',
      audience: 'brahmam-admin',
    })
    return next()
  } catch {
    return response.status(401).json({ message: 'Your admin session has expired.' })
  }
}
