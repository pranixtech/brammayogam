import { request } from './apiClient'

const UPDATED_KEY = 'brahmam-upcoming-classes-updated'
const UPDATED_EVENT = 'brahmam:upcoming-classes-updated'

export function getUpcomingClasses(signal) {
  return request('/api/upcoming-classes', { signal, cache: 'no-store' })
}

export function uploadUpcomingClass(formData) {
  return request('/api/admin/upcoming-classes', { method: 'POST', body: formData })
}

export function deleteUpcomingClass(id) {
  return request(`/api/admin/upcoming-classes/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function notifyUpcomingClassesUpdated() {
  window.dispatchEvent(new Event(UPDATED_EVENT))
  try {
    window.localStorage.setItem(UPDATED_KEY, String(Date.now()))
  } catch {
    // The current tab still receives the event.
  }
}

export function subscribeToUpcomingClasses(callback) {
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
