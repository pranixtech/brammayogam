import { io } from 'socket.io-client'

export function connectAdminNotifications(onRegistration) {
  const socket = io({
    path: '/socket.io',
    withCredentials: true,
    transports: ['websocket', 'polling'],
  })
  socket.on('registration:new', onRegistration)
  return () => socket.disconnect()
}
