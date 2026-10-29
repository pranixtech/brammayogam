import { request } from './apiClient'

export function createPaymentOrder(details) {
  return request('/api/payments/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  })
}

export function getPaymentOrder(orderId) {
  return request(`/api/payments/orders/${encodeURIComponent(orderId)}`, { cache: 'no-store' })
}
