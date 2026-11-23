import { request } from './apiClient'

export function getUserDashboard(signal) {
  return request('/api/account/dashboard', { signal, cache: 'no-store' })
}
