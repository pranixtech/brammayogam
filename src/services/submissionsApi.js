import { request } from './apiClient'

export function submitRegistration(details) {
  return request('/api/registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  })
}

export function submitFeedback(details) {
  return request('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  })
}

export function getAdminRegistrations(page, signal) {
  return request(`/api/admin/registrations?page=${page}`, { signal, cache: 'no-store' })
}

export function getAdminFeedback(page, signal) {
  return request(`/api/admin/feedback?page=${page}`, { signal, cache: 'no-store' })
}
