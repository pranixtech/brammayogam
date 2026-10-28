import { request } from './apiClient'

const UPDATED_KEY = 'brahmam-contributions-updated'
const UPDATED_EVENT = 'brahmam:contributions-updated'

export function getContributions(signal) {
  return request('/api/contributions', { signal, cache: 'no-store' })
}

export function uploadContribution(formData) {
  return request('/api/admin/contributions', { method: 'POST', body: formData })
}

export function deleteContribution(id) {
  return request(`/api/admin/contributions/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function notifyContributionsUpdated() {
  window.dispatchEvent(new Event(UPDATED_EVENT))
  try {
    window.localStorage.setItem(UPDATED_KEY, String(Date.now()))
  } catch {
    // The current tab still receives the event.
  }
}

export function subscribeToContributions(callback) {
  const handleStorage = (event) => {
    if (event.key === UPDATED_KEY && event.newValue) callback()
  }
  window.addEventListener(UPDATED_EVENT, callback)
  window.addEventListener('storage', handleStorage)
  return () => {
    window.removeEventListener(UPDATED_EVENT, callback)
    window.removeEventListener('storage', handleStorage)
  }
}
