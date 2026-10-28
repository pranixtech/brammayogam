import { useEffect, useMemo, useState } from 'react'
import { getGalleryPhotos, subscribeToGalleryUpdates } from '../services/galleryApi'

const PHOTO_CATEGORIES = [
  {
    id: 'guru',
    label: 'Guru',
    description: 'Moments of guidance and spiritual presence.',
  },
  {
    id: 'online-classes',
    label: 'Online Classes',
    description: 'Shared learning and online spiritual practice.',
  },
  {
    id: 'annathanam',
    label: 'Annathanam',
    description: 'Service through food, care and compassion.',
  },
  {
    id: 'others',
    label: 'Others',
    description: 'Gatherings, journeys and community moments.',
  },
]

const PHOTOS_PER_PAGE = 12

export function PhotosPage() {
  const [activeCategoryId, setActiveCategoryId] = useState(PHOTO_CATEGORIES[0].id)
  const [uploadedPhotos, setUploadedPhotos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [previewPhoto, setPreviewPhoto] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const activeCategory = PHOTO_CATEGORIES.find(({ id }) => id === activeCategoryId)
  const visiblePhotos = uploadedPhotos
  const totalPages = Math.max(1, Math.ceil(visiblePhotos.length / PHOTOS_PER_PAGE))
  const paginatedPhotos = useMemo(() => {
    const startIndex = (currentPage - 1) * PHOTOS_PER_PAGE
    return visiblePhotos.slice(startIndex, startIndex + PHOTOS_PER_PAGE)
  }, [currentPage, visiblePhotos])

  const changePage = (pageNumber) => {
    setCurrentPage(pageNumber)
    setPreviewPhoto(null)
    window.requestAnimationFrame(() => {
      document.getElementById(`photo-panel-${activeCategoryId}`)?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  useEffect(() => {
    const controller = new AbortController()
    const loadPhotos = () => {
      getGalleryPhotos(activeCategoryId, controller.signal)
        .then(({ photos }) => {
          setUploadedPhotos(photos)
          setLoadError('')
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            setUploadedPhotos([])
            setLoadError('Photos are temporarily unavailable. Please try again shortly.')
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false)
        })
    }

    const handleGalleryUpdate = ({ categoryId } = {}) => {
      if (!categoryId || categoryId === activeCategoryId) loadPhotos()
    }

    const handleWindowFocus = () => loadPhotos()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadPhotos()
    }

    loadPhotos()
    const unsubscribe = subscribeToGalleryUpdates(handleGalleryUpdate)
    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      controller.abort()
      unsubscribe()
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [activeCategoryId])

  useEffect(() => {
    if (!previewPhoto) return undefined

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setPreviewPhoto(null)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [previewPhoto])

  return (
    <section className="photos-page section-padding" aria-labelledby="photos-title">
      <header className="photos-page__header">
        <p className="section-kicker">Moments along the path</p>
        <h1 id="photos-title">Photo <em>gallery.</em></h1>
        <p>Explore moments from the Brahmam Foundation journey through spiritual practice, learning and service.</p>
      </header>

      <div className="photo-tabs" role="tablist" aria-label="Photo categories">
        {PHOTO_CATEGORIES.map(({ id, label }) => {
          const isActive = id === activeCategoryId

          return (
            <button
              className={`photo-tabs__button${isActive ? ' photo-tabs__button--active' : ''}`}
              id={`photo-tab-${id}`}
              type="button"
              role="tab"
              aria-controls={`photo-panel-${id}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              key={id}
              onClick={() => {
                setIsLoading(true)
                setLoadError('')
                setPreviewPhoto(null)
                setCurrentPage(1)
                setActiveCategoryId(id)
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div
        className="photo-panel"
        id={`photo-panel-${activeCategory.id}`}
        role="tabpanel"
        aria-labelledby={`photo-tab-${activeCategory.id}`}
      >
        <div className="photo-panel__heading">
          <p className="section-kicker">Selected collection</p>
          <h2>{activeCategory.label}</h2>
          <p>{activeCategory.description}</p>
        </div>

        {loadError && <p className="photo-panel__notice" role="status">{loadError}</p>}

        {visiblePhotos.length > 0 ? (
          <>
            <div className="photo-gallery-grid" aria-label={`${activeCategory.label} photo gallery`}>
              {paginatedPhotos.map((photo) => (
                <figure className="photo-gallery-card" key={photo.id}>
                  <button
                    className="photo-gallery-card__button"
                    type="button"
                    aria-label={`Preview ${photo.alt}`}
                    onClick={() => setPreviewPhoto(photo)}
                  >
                    <img src={photo.src} alt={photo.alt} loading="lazy" />
                  </button>
                </figure>
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="photo-pagination" aria-label={`${activeCategory.label} gallery pages`}>
                <button
                  className="photo-pagination__direction"
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => changePage(currentPage - 1)}
                >
                  <span aria-hidden="true">←</span> Previous
                </button>

                <div className="photo-pagination__pages">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                    <button
                      className={pageNumber === currentPage ? 'is-active' : undefined}
                      type="button"
                      aria-label={`Go to page ${pageNumber}`}
                      aria-current={pageNumber === currentPage ? 'page' : undefined}
                      key={pageNumber}
                      onClick={() => changePage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>

                <button
                  className="photo-pagination__direction"
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => changePage(currentPage + 1)}
                >
                  Next <span aria-hidden="true">→</span>
                </button>
              </nav>
            )}
          </>
        ) : isLoading ? (
          <p className="photo-panel__loading">Loading photos…</p>
        ) : (
          <div className="photo-placeholder-grid" aria-label={`${activeCategory.label} photos coming soon`}>
            {Array.from({ length: 6 }, (_, index) => (
              <div className="photo-placeholder" key={`${activeCategory.id}-${index}`}>
                <span aria-hidden="true">✦</span>
                <p>Photo coming soon</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewPhoto && (
        <div
          className="photo-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Photo preview"
          onClick={(event) => {
            if (event.target === event.currentTarget) setPreviewPhoto(null)
          }}
        >
          <div className="photo-modal__content">
            <button
              className="photo-modal__close"
              type="button"
              aria-label="Close photo preview"
              autoFocus
              onClick={() => setPreviewPhoto(null)}
            >
              <span aria-hidden="true">×</span>
            </button>
            <img src={previewPhoto.src} alt={previewPhoto.alt} />
            <p>{previewPhoto.alt}</p>
          </div>
        </div>
      )}
    </section>
  )
}
