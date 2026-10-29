import { request } from './apiClient'

export function submitRegistration(details) {
  return request('/api/registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  })
}

export function getFeedback(signal) {
  return request('/api/feedback', { signal, cache: 'no-store' })
}

export function getAdminRegistrations(page, signal) {
  return request(`/api/admin/registrations?page=${page}`, { signal, cache: 'no-store' })
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
