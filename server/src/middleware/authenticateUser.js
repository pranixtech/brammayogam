import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export const USER_COOKIE_NAME = 'brahmam_user'

export function authenticateUser(request, response, next) {
  const token = request.cookies[USER_COOKIE_NAME]
  if (!token) return response.status(401).json({ message: 'User authentication required.' })

  try {
    request.user = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'brahmam-foundation',
      audience: 'brahmam-user',
    })
    return next()
  } catch {
    return response.status(401).json({ message: 'Your login session has expired.' })
  }
}
