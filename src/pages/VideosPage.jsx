import { VideoGallery } from '../components/gallery/VideoGallery'
import { useVideos } from '../hooks/useVideos'

export function VideosPage() {
  const { videos, isLoading, loadError } = useVideos()

  return (
    <section className="videos-page section-padding" aria-labelledby="videos-title">
      <header className="videos-page__header">
        <p className="section-kicker">Watch and reflect</p>
        <h1 id="videos-title">Video <em>gallery.</em></h1>
        <p>Explore teachings, meditation guidance and moments from the Brahmam Foundation journey.</p>
      </header>

      {loadError && <p className="video-gallery__notice" role="status">{loadError}</p>}

      {videos.length > 0 ? (
        <VideoGallery videos={videos} />
      ) : isLoading ? (
        <p className="video-gallery__empty">Loading videos…</p>
      ) : (
        <p className="video-gallery__empty">Videos will appear here after they are added from the Admin page.</p>
      )}
    </section>
  )
}
