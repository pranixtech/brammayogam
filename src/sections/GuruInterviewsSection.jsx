import { useEffect, useState } from 'react'
import { VideoGallery } from '../components/gallery/VideoGallery'
import { useLanguage } from '../i18n/useLanguage'
import { getGuruInterviews, subscribeToGuruInterviews } from '../services/guruContentApi'

export function GuruInterviewsSection() {
  const [videos, setVideos] = useState([])
  const { t } = useLanguage()

  useEffect(() => {
    let controller
    const loadVideos = () => {
      controller?.abort()
      controller = new AbortController()
      getGuruInterviews(controller.signal)
        .then((payload) => setVideos(payload.videos))
        .catch((error) => {
          if (error.name !== 'AbortError') setVideos([])
        })
    }
    loadVideos()
    const unsubscribe = subscribeToGuruInterviews(loadVideos)
    return () => {
      controller?.abort()
      unsubscribe()
    }
  }, [])

  if (!videos.length) return null
  return (
    <section className="guru-interviews-section section-padding" aria-labelledby="guru-interviews-title">
      <header className="home-videos-section__header">
        <p className="section-kicker">{t('guruContent.interviewsKicker')}</p>
        <h2 id="guru-interviews-title">{t('guruContent.interviewsTitle')}</h2>
      </header>
      <VideoGallery videos={videos} ariaLabel={t('guruContent.interviewsLabel')} />
    </section>
  )
}
