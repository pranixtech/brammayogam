import { request } from './apiClient'

const UPDATED_KEY = 'brahmam-activities-updated'
const UPDATED_EVENT = 'brahmam:activities-updated'

export function getActivities(signal) {
  return request('/api/activities', { signal, cache: 'no-store' })
}

export function uploadActivity(formData) {
  return request('/api/admin/activities', { method: 'POST', body: formData })
}

export function deleteActivity(id) {
  return request(`/api/admin/activities/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function notifyActivitiesUpdated() {
  window.dispatchEvent(new Event(UPDATED_EVENT))
  try {
    window.localStorage.setItem(UPDATED_KEY, String(Date.now()))
  } catch {
    // The current tab still receives the event.
  }
}

export function subscribeToActivities(callback) {
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
