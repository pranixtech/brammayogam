import { useEffect, useMemo, useState } from 'react'
import { getGalleryPhotos, subscribeToGalleryUpdates } from '../services/galleryApi'
import { useLanguage } from '../i18n/LanguageContext'

const PHOTO_CATEGORIES = [
  {
    id: 'guru',
    labelKey: 'guru',
    descriptionKey: 'guruDescription',
  },
  {
    id: 'online-classes',
    labelKey: 'onlineClasses',
    descriptionKey: 'onlineClassesDescription',
  },
  {
    id: 'annathanam',
    labelKey: 'annathanam',
    descriptionKey: 'annathanamDescription',
  },
  {
    id: 'others',
    labelKey: 'others',
    descriptionKey: 'othersDescription',
  },
]

const PHOTOS_PER_PAGE = 12

export function PhotosPage() {
  const { t } = useLanguage()
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
            setLoadError('unavailable')
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
        <p className="section-kicker">{t('photos.kicker')}</p>
        <h1 id="photos-title">{t('photos.title')} <em>{t('photos.titleEmphasis')}</em></h1>
        <p>{t('photos.description')}</p>
      </header>

      <div className="photo-tabs" role="tablist" aria-label={t('photos.categories')}>
        {PHOTO_CATEGORIES.map(({ id, labelKey }) => {
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
              {t(`photos.category.${labelKey}`)}
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
          <p className="section-kicker">{t('photos.selected')}</p>
          <h2>{t(`photos.category.${activeCategory.labelKey}`)}</h2>
          <p>{t(`photos.category.${activeCategory.descriptionKey}`)}</p>
        </div>

        {loadError && <p className="photo-panel__notice" role="status">{t('photos.unavailable')}</p>}

        {visiblePhotos.length > 0 ? (
          <>
            <div className="photo-gallery-grid" aria-label={`${t(`photos.category.${activeCategory.labelKey}`)} ${t('photos.gallery')}`}>
              {paginatedPhotos.map((photo) => (
                <figure className="photo-gallery-card" key={photo.id}>
                  <button
                    className="photo-gallery-card__button"
                    type="button"
                    aria-label={`${t('photos.preview')} ${photo.alt}`}
                    onClick={() => setPreviewPhoto(photo)}
                  >
                    <img src={photo.src} alt={photo.alt} loading="lazy" />
                  </button>
                </figure>
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="photo-pagination" aria-label={`${t(`photos.category.${activeCategory.labelKey}`)} ${t('photos.pages')}`}>
                <button
                  className="photo-pagination__direction"
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => changePage(currentPage - 1)}
                >
                  <span aria-hidden="true">←</span> {t('photos.previous')}
                </button>

                <div className="photo-pagination__pages">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                    <button
                      className={pageNumber === currentPage ? 'is-active' : undefined}
                      type="button"
                      aria-label={`${t('photos.goToPage')} ${pageNumber}`}
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
                  {t('photos.next')} <span aria-hidden="true">→</span>
                </button>
              </nav>
            )}
          </>
        ) : isLoading ? (
          <p className="photo-panel__loading">{t('photos.loading')}</p>
        ) : (
          <div className="photo-placeholder-grid" aria-label={`${t(`photos.category.${activeCategory.labelKey}`)} ${t('photos.comingSoon')}`}>
            {Array.from({ length: 6 }, (_, index) => (
              <div className="photo-placeholder" key={`${activeCategory.id}-${index}`}>
                <span aria-hidden="true">✦</span>
                <p>{t('photos.comingSoon')}</p>
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
          aria-label={t('photos.previewDialog')}
          onClick={(event) => {
            if (event.target === event.currentTarget) setPreviewPhoto(null)
          }}
        >
          <div className="photo-modal__content">
            <button
              className="photo-modal__close"
              type="button"
              aria-label={t('photos.closePreview')}
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
