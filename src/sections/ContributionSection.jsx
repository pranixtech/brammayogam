import { useEffect, useState } from 'react'
import { getContributions, subscribeToContributions } from '../services/contributionsApi'
import { useLanguage } from '../i18n/useLanguage'
import { DonationPayment } from '../components/payments/DonationPayment'

export function ContributionSection() {
  const { t } = useLanguage()
  const [contributions, setContributions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const load = () => {
      getContributions(controller.signal)
        .then(({ contributions: items }) => setContributions(items))
        .catch((error) => {
          if (error.name !== 'AbortError') setContributions([])
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false)
        })
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') load()
    }

    load()
    const unsubscribe = subscribeToContributions(load)
    window.addEventListener('focus', load)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      controller.abort()
      unsubscribe()
      window.removeEventListener('focus', load)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  if (isLoading || contributions.length === 0) return null

  const displayedSlide = Math.min(activeSlide, contributions.length - 1)
  const contribution = contributions[displayedSlide]
  const hasMultipleSlides = contributions.length > 1
  const showPrevious = () => setActiveSlide((displayedSlide - 1 + contributions.length) % contributions.length)
  const showNext = () => setActiveSlide((displayedSlide + 1) % contributions.length)

  return (
    <section className="contribution-section section-padding" id="contribution" aria-labelledby="contribution-title">
      <div className="contribution-section__inner">
        <header className="contribution-section__header">
          <p className="section-kicker">{t('contribution.kicker')}</p>
          <h2 id="contribution-title">{t('contribution.title')}</h2>
          <p>{t('contribution.description')}</p>
        </header>

        <div
          className="contribution-section__grid contribution-slider"
          role="region"
          aria-roledescription="carousel"
          aria-label={t('contribution.slider')}
        >
          <article className="contribution-card" key={contribution.id} aria-live="polite">
            <blockquote>{contribution.quote}</blockquote>
            <div className="contribution-card__media">
              {contribution.mediaType === 'image' && (
                <img src={contribution.src} alt={`${t('contribution.mediaAlt')} ${displayedSlide + 1}`} />
              )}
              {contribution.mediaType === 'video' && (
                <video src={contribution.src} controls preload="metadata" playsInline aria-label={`${t('contribution.mediaAlt')} ${displayedSlide + 1}`} />
              )}
              {hasMultipleSlides && (
                <>
                  <button className="contribution-slider__arrow is-previous" type="button" aria-label={t('contribution.previous')} onClick={showPrevious}>
                    <span aria-hidden="true">‹</span>
                  </button>
                  <button className="contribution-slider__arrow is-next" type="button" aria-label={t('contribution.next')} onClick={showNext}>
                    <span aria-hidden="true">›</span>
                  </button>
                </>
              )}
            </div>
          </article>

          {hasMultipleSlides && (
            <div className="contribution-slider__navigation">
              <div className="contribution-slider__dots" role="group" aria-label={t('contribution.slider')}>
                {contributions.map((item, index) => (
                  <button
                    className={index === displayedSlide ? 'is-active' : undefined}
                    type="button"
                    aria-label={`${t('contribution.show')} ${index + 1}`}
                    aria-current={index === displayedSlide ? 'true' : undefined}
                    key={item.id}
                    onClick={() => setActiveSlide(index)}
                  />
                ))}
              </div>
              <span>{displayedSlide + 1} {t('contribution.of')} {contributions.length}</span>
            </div>
          )}

          <div className="contribution-card__actions">
            <DonationPayment />
            <a
              className="contribution-card__gallery-link"
              href="/photos?category=annathanam#photo-panel-annathanam"
            >
              {t('contribution.gallery')}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
