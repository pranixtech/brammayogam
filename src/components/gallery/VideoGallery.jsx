import { useEffect, useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'

export function VideoGallery({ videos, ariaLabel = 'YouTube video gallery' }) {
  const [activeVideo, setActiveVideo] = useState(null)
  const { t } = useLanguage()

  useEffect(() => {
    if (!activeVideo) return undefined
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setActiveVideo(null)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [activeVideo])

  return (
    <>
      <div className="video-gallery-grid" aria-label={ariaLabel}>
        {videos.map((video) => (
          <article className="video-gallery-card" key={video.id}>
            <button type="button" onClick={() => setActiveVideo(video)} aria-label={`${t('videos.play')} ${video.title}`}>
              <span className="video-gallery-card__image">
                <img src={video.thumbnail} alt="" loading="lazy" />
                <span className="video-gallery-card__play" aria-hidden="true">▶</span>
              </span>
              <strong>{video.title}</strong>
            </button>
          </article>
        ))}
      </div>

      {activeVideo && (
        <div className="video-modal" role="presentation" onMouseDown={() => setActiveVideo(null)}>
          <div
            className="video-modal__content"
            role="dialog"
            aria-modal="true"
            aria-label={activeVideo.title}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="video-modal__close" type="button" aria-label={t('videos.close')} onClick={() => setActiveVideo(null)}>×</button>
            <div className="video-modal__frame">
              <iframe
                src={`${activeVideo.embedUrl}?autoplay=1&rel=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <h2>{activeVideo.title}</h2>
          </div>
        </div>
      )}
    </>
  )
}
