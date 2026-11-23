import { request } from './apiClient'

export function requestUserOtp({ phone, purpose, fullName, email, city, country, password, verificationMethod }) {
  return request('/api/auth/otp/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, purpose, fullName, email, city, country, password, verificationMethod }),
  })
}

export async function verifyUserOtp({ challengeId, otp }) {
  const result = await request('/api/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId, otp }),
  })
  notifyAuthChanged()
  return result
}

export function getUserSession() {
  return request('/api/auth/session', { cache: 'no-store' })
}

function notifyAuthChanged() {
  window.dispatchEvent(new Event('brahmam:auth-changed'))
}

export async function loginUser({ identifier, password }) {
  const result = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  })
  notifyAuthChanged()
  return result
}

export async function logoutUser() {
  const result = await request('/api/auth/logout', { method: 'POST' })
  notifyAuthChanged()
  return result
}
