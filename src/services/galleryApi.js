import { request } from './apiClient'

const GALLERY_UPDATED_KEY = 'brahmam-gallery-updated'
const GALLERY_UPDATED_EVENT = 'brahmam:gallery-updated'
const VIDEOS_UPDATED_KEY = 'brahmam-videos-updated'
const VIDEOS_UPDATED_EVENT = 'brahmam:videos-updated'
const HOME_VIDEOS_UPDATED_KEY = 'brahmam-home-videos-updated'
const HOME_VIDEOS_UPDATED_EVENT = 'brahmam:home-videos-updated'

export function getGalleryPhotos(categoryId, signal) {
  const query = categoryId ? `?category=${encodeURIComponent(categoryId)}` : ''
  return request(`/api/photos${query}`, { signal, cache: 'no-store' })
}

export function notifyGalleryUpdated(categoryId) {
  const detail = { categoryId, updatedAt: Date.now() }
  window.dispatchEvent(new CustomEvent(GALLERY_UPDATED_EVENT, { detail }))
  try {
    window.localStorage.setItem(GALLERY_UPDATED_KEY, JSON.stringify(detail))
  } catch {
    // The current tab still receives the custom event if storage is unavailable.
  }
}

export function subscribeToGalleryUpdates(callback) {
  const handleUpdate = (event) => callback(event.detail)
  const handleStorage = (event) => {
    if (event.key !== GALLERY_UPDATED_KEY || !event.newValue) return
    try {
      callback(JSON.parse(event.newValue))
    } catch {
      // Ignore malformed data from unrelated manual storage edits.
    }
  }

  window.addEventListener(GALLERY_UPDATED_EVENT, handleUpdate)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(GALLERY_UPDATED_EVENT, handleUpdate)
    window.removeEventListener('storage', handleStorage)
  }
}

export function getVideos(signal) {
  return request('/api/videos', { signal, cache: 'no-store' })
}

export function createVideo(video) {
  return request('/api/admin/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(video),
  })
}

export function deleteVideo(videoId) {
  return request(`/api/admin/videos/${encodeURIComponent(videoId)}`, { method: 'DELETE' })
}

export function notifyVideosUpdated() {
  const detail = { updatedAt: Date.now() }
  window.dispatchEvent(new CustomEvent(VIDEOS_UPDATED_EVENT, { detail }))
  try {
    window.localStorage.setItem(VIDEOS_UPDATED_KEY, JSON.stringify(detail))
  } catch {
    // The current tab still receives the custom event if storage is unavailable.
  }
}

export function subscribeToVideoUpdates(callback) {
  const handleUpdate = () => callback()
  const handleStorage = (event) => {
    if (event.key === VIDEOS_UPDATED_KEY && event.newValue) callback()
  }

  window.addEventListener(VIDEOS_UPDATED_EVENT, handleUpdate)
  window.addEventListener('storage', handleStorage)
  return () => {
    window.removeEventListener(VIDEOS_UPDATED_EVENT, handleUpdate)
    window.removeEventListener('storage', handleStorage)
  }
}

export function getHomeVideos(signal) {
  return request('/api/home-videos', { signal, cache: 'no-store' })
}

export function createHomeVideo(video) {
  return request('/api/admin/home-videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(video),
  })
}

export function deleteHomeVideo(videoId) {
  return request(`/api/admin/home-videos/${encodeURIComponent(videoId)}`, { method: 'DELETE' })
}

export function notifyHomeVideosUpdated() {
  const detail = { updatedAt: Date.now() }
  window.dispatchEvent(new CustomEvent(HOME_VIDEOS_UPDATED_EVENT, { detail }))
  try {
    window.localStorage.setItem(HOME_VIDEOS_UPDATED_KEY, JSON.stringify(detail))
  } catch {
    // The current tab still receives the custom event if storage is unavailable.
  }
}

export function subscribeToHomeVideoUpdates(callback) {
  const handleUpdate = () => callback()
  const handleStorage = (event) => {
    if (event.key === HOME_VIDEOS_UPDATED_KEY && event.newValue) callback()
  }

  window.addEventListener(HOME_VIDEOS_UPDATED_EVENT, handleUpdate)
  window.addEventListener('storage', handleStorage)
  return () => {
    window.removeEventListener(HOME_VIDEOS_UPDATED_EVENT, handleUpdate)
    window.removeEventListener('storage', handleStorage)
  }
}

export function getAdminSession() {
  return request('/api/admin/session')
}

export function loginAdmin(credentials) {
  return request('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
}

export function logoutAdmin() {
  return request('/api/admin/logout', { method: 'POST' })
}

export function uploadGalleryPhotos(formData) {
  return request('/api/admin/photos', { method: 'POST', body: formData })
}

export function deleteGalleryPhoto(photoId) {
  return request(`/api/admin/photos/${encodeURIComponent(photoId)}`, { method: 'DELETE' })
}
