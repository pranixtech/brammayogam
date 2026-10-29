import { request } from './apiClient'

const INTERVIEWS_KEY = 'brahmam-guru-interviews-updated'
const INTERVIEWS_EVENT = 'brahmam:guru-interviews-updated'
const QUOTE_KEY = 'brahmam-quote-image-updated'
const QUOTE_EVENT = 'brahmam:quote-image-updated'

export function getGuruInterviews(signal) {
  return request('/api/guru-interviews', { signal, cache: 'no-store' })
}

export function createGuruInterview(video) {
  return request('/api/admin/guru-interviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(video),
  })
}

export function deleteGuruInterview(id) {
  return request(`/api/admin/guru-interviews/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function notifyGuruInterviewsUpdated() {
  window.dispatchEvent(new Event(INTERVIEWS_EVENT))
  try { window.localStorage.setItem(INTERVIEWS_KEY, String(Date.now())) } catch { /* current tab still updates */ }
}

export function subscribeToGuruInterviews(callback) {
  const handleStorage = (event) => {
    if (event.key === INTERVIEWS_KEY && event.newValue) callback()
  }
  window.addEventListener(INTERVIEWS_EVENT, callback)
  window.addEventListener('storage', handleStorage)
  return () => {
    window.removeEventListener(INTERVIEWS_EVENT, callback)
    window.removeEventListener('storage', handleStorage)
  }
}

export function getQuoteImage(signal) {
  return request('/api/quote-image', { signal, cache: 'no-store' })
}

export function uploadQuoteImage(formData) {
  return request('/api/admin/quote-image', { method: 'POST', body: formData })
}

export function deleteQuoteImage(id) {
  return request(`/api/admin/quote-image/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function notifyQuoteImageUpdated() {
  window.dispatchEvent(new Event(QUOTE_EVENT))
  try { window.localStorage.setItem(QUOTE_KEY, String(Date.now())) } catch { /* current tab still updates */ }
}

export function subscribeToQuoteImage(callback) {
  const handleStorage = (event) => {
    if (event.key === QUOTE_KEY && event.newValue) callback()
  }
  window.addEventListener(QUOTE_EVENT, callback)
  window.addEventListener('storage', handleStorage)
  return () => {
    window.removeEventListener(QUOTE_EVENT, callback)
    window.removeEventListener('storage', handleStorage)
  }
}
