import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import { config } from './config.js'
import { ADMIN_COOKIE_NAME } from './middleware/authenticateAdmin.js'

let realtimeServer = null

function cookieValue(header, name) {
  const entry = String(header ?? '').split(';').map((value) => value.trim()).find((value) => value.startsWith(`${name}=`))
  if (!entry) return ''
  try {
    return decodeURIComponent(entry.slice(name.length + 1))
  } catch {
    return ''
  }
}

export function initializeRealtime(server) {
  realtimeServer = new Server(server, {
    path: '/socket.io',
    serveClient: false,
    transports: ['websocket', 'polling'],
  })

  realtimeServer.use((socket, next) => {
    const token = cookieValue(socket.request.headers.cookie, ADMIN_COOKIE_NAME)
    if (!token) return next(new Error('Admin authentication required.'))
    try {
      socket.data.admin = jwt.verify(token, config.jwtSecret, {
        algorithms: ['HS256'],
        issuer: 'brahmam-foundation',
        audience: 'brahmam-admin',
      })
      return next()
    } catch {
      return next(new Error('Admin session expired.'))
    }
  })

  return realtimeServer
}

export function notifyNewRegistration(registration) {
  realtimeServer?.emit('registration:new', registration)
}
