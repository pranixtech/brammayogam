import { VideoGallery } from '../components/gallery/VideoGallery'
import { useHomeVideos } from '../hooks/useHomeVideos'

export function HomeVideosSection() {
  const { videos, isLoading, loadError } = useHomeVideos()

  return (
    <section className="home-videos-section section-padding" aria-labelledby="home-videos-title">
      <header className="home-videos-section__header">
        <p className="section-kicker">Watch and reflect</p>
        <h2 id="home-videos-title">Latest <em>videos.</em></h2>
      </header>

      {loadError && <p className="video-gallery__notice" role="status">{loadError}</p>}

      {videos.length > 0 ? (
        <VideoGallery videos={videos} ariaLabel="Latest YouTube videos" />
      ) : isLoading ? (
        <p className="video-gallery__empty">Loading videos…</p>
      ) : (
        <p className="video-gallery__empty">Homepage videos will appear here after they are added from the separate Home Videos manager.</p>
      )}
    </section>
  )
}
