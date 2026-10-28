import { VideoGallery } from '../components/gallery/VideoGallery'
import { useHomeVideos } from '../hooks/useHomeVideos'
import { useLanguage } from '../i18n/LanguageContext'

export function HomeVideosSection() {
  const { videos, isLoading, loadError } = useHomeVideos()
  const { t } = useLanguage()

  return (
    <section className="home-videos-section section-padding" aria-labelledby="home-videos-title">
      <header className="home-videos-section__header">
        <p className="section-kicker">{t('videos.kicker')}</p>
        <h2 id="home-videos-title">{t('videos.latest')} <em>{t('videos.videos')}</em></h2>
      </header>

      {loadError && <p className="video-gallery__notice" role="status">{t('videos.homeUnavailable')}</p>}

      {videos.length > 0 ? (
        <VideoGallery videos={videos} ariaLabel={t('videos.latestLabel')} />
      ) : isLoading ? (
        <p className="video-gallery__empty">{t('videos.loading')}</p>
      ) : (
        <p className="video-gallery__empty">{t('videos.homeEmpty')}</p>
      )}
    </section>
  )
}
