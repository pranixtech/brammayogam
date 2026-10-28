export async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
  })

  if (response.status === 204) return null

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message ?? 'Unable to complete the request.')
  return payload
}
