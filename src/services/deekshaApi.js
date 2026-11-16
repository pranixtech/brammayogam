import { request } from './apiClient'

export function getDeekshaPrograms(signal) {
  return request('/api/deeksha-programs', { signal, cache: 'no-store' })
}

export function submitDeekshaSelection(details) {
  return request('/api/deeksha-submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  })
}

export function getAdminDeekshaPrograms(signal) {
  return request('/api/admin/deeksha-programs', { signal, cache: 'no-store' })
}

export function createDeekshaProgram(details) {
  return request('/api/admin/deeksha-programs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  })
}

export function updateDeekshaProgram(id, details) {
  return request(`/api/admin/deeksha-programs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  })
}

export function deleteDeekshaProgram(id) {
  return request(`/api/admin/deeksha-programs/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function getAdminDeekshaSubmissions(search = '', signal) {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''
  return request(`/api/admin/deeksha-submissions${query}`, { signal, cache: 'no-store' })
}
