import { VideoGallery } from '../components/gallery/VideoGallery'
import { useVideos } from '../hooks/useVideos'
import { useLanguage } from '../i18n/useLanguage'

export function VideosPage() {
  const { videos, isLoading, loadError } = useVideos()
  const { t } = useLanguage()

  return (
    <section className="videos-page section-padding" aria-labelledby="videos-title">
      <header className="videos-page__header">
        <p className="section-kicker">{t('videos.kicker')}</p>
        <h1 id="videos-title">{t('videos.galleryTitle')} <em>{t('videos.galleryEmphasis')}</em></h1>
        <p>{t('videos.galleryDescription')}</p>
      </header>

      {loadError && <p className="video-gallery__notice" role="status">{t('videos.unavailable')}</p>}

      {videos.length > 0 ? (
        <VideoGallery videos={videos} />
      ) : isLoading ? (
        <p className="video-gallery__empty">{t('videos.loading')}</p>
      ) : (
        <p className="video-gallery__empty">{t('videos.galleryEmpty')}</p>
      )}
    </section>
  )
}
