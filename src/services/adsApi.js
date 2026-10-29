import { request } from './apiClient'

const UPDATED_KEY = 'brahmam-homepage-ads-updated'
const UPDATED_EVENT = 'brahmam:homepage-ads-updated'

export function getAds(signal) {
  return request('/api/ads', { signal, cache: 'no-store' })
}

export function uploadAds(formData) {
  return request('/api/admin/ads', { method: 'POST', body: formData })
}

export function deleteAd(id) {
  return request(`/api/admin/ads/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function notifyAdsUpdated() {
  window.dispatchEvent(new Event(UPDATED_EVENT))
  try {
    window.localStorage.setItem(UPDATED_KEY, String(Date.now()))
  } catch {
    // The current tab still receives the event.
  }
}

export function subscribeToAds(callback) {
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
