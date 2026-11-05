import { request } from './apiClient'

export function submitRegistration(details) {
  const formData = new FormData()
  Object.entries(details).forEach(([key, value]) => {
    if (value === null || value === undefined) return
    formData.append(key, value instanceof File ? value : String(value))
  })
  return request('/api/registrations', {
    method: 'POST',
    body: formData,
  })
}

export function getFeedback(signal) {
  return request('/api/feedback', { signal, cache: 'no-store' })
}

export function getAdminRegistrations({ page, search = '', paymentStatus = '' }, signal) {
  const parameters = new URLSearchParams({ page: String(page) })
  if (search.trim()) parameters.set('search', search.trim())
  if (paymentStatus) parameters.set('paymentStatus', paymentStatus)
  return request(`/api/admin/registrations?${parameters}`, { signal, cache: 'no-store' })
}

export function verifyRegistrationPayment(id) {
  return request(`/api/admin/registrations/${encodeURIComponent(id)}/verify-payment`, { method: 'PATCH' })
}

export function getAdminFeedback(signal) {
  return request('/api/admin/feedback', { signal, cache: 'no-store' })
}

export function createAdminFeedback(details) {
  return request('/api/admin/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  })
}

export function updateAdminFeedback(id, details) {
  return request(`/api/admin/feedback/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  })
}

export function deleteAdminFeedback(id) {
  return request(`/api/admin/feedback/${id}`, { method: 'DELETE' })
}
