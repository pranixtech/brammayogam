import { request } from './apiClient'

const SETTINGS_UPDATED_EVENT = 'brahmam:donation-settings-updated'

export function getDonationSettings(signal) {
  return request('/api/donation-settings', { signal, cache: 'no-store' })
}

export function submitDonation(details) {
  return request('/api/donations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  })
}

export function getAdminDonationSettings(signal) {
  return request('/api/admin/donation-settings', { signal, cache: 'no-store' })
}

export function updateDonationSettings(settings) {
  return request('/api/admin/donation-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  })
}

export function notifyDonationSettingsUpdated() {
  window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT))
}

export function subscribeToDonationSettings(callback) {
  window.addEventListener(SETTINGS_UPDATED_EVENT, callback)
  return () => window.removeEventListener(SETTINGS_UPDATED_EVENT, callback)
}

export function getAdminDonations(filters, signal) {
  const query = new URLSearchParams()
  if (filters.status) query.set('status', filters.status)
  if (filters.paymentMethod) query.set('paymentMethod', filters.paymentMethod)
  if (filters.search) query.set('search', filters.search)
  const suffix = query.size ? `?${query}` : ''
  return request(`/api/admin/donations${suffix}`, { signal, cache: 'no-store' })
}

export function updateDonationStatus(id, status) {
  return request(`/api/admin/donations/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}
