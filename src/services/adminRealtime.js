import { io } from 'socket.io-client'

export function connectAdminNotifications(onRegistration) {
  const socket = io({
    path: '/socket.io',
    withCredentials: true,
    // Start with long-polling and upgrade to WebSocket when the production
    // proxy supports it. This keeps admin notifications available during a
    // proxy reload or when a network blocks WebSocket upgrades.
    transports: ['polling', 'websocket'],
  })
  socket.on('registration:new', onRegistration)
  return () => socket.disconnect()
}
