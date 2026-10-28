import { useEffect, useState } from 'react'
import { getHomeVideos, subscribeToHomeVideoUpdates } from '../services/galleryApi'

export function useHomeVideos() {
  const [videos, setVideos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const loadVideos = () => {
      getHomeVideos(controller.signal)
        .then((payload) => {
          setVideos(payload.videos)
          setLoadError('')
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            setLoadError('Homepage videos are temporarily unavailable. Please try again shortly.')
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false)
        })
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadVideos()
    }

    loadVideos()
    const unsubscribe = subscribeToHomeVideoUpdates(loadVideos)
    window.addEventListener('focus', loadVideos)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      controller.abort()
      unsubscribe()
      window.removeEventListener('focus', loadVideos)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return { videos, isLoading, loadError }
}
