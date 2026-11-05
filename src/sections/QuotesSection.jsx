import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/useLanguage'
import { getQuoteImage, subscribeToQuoteImage } from '../services/guruContentApi'

export function QuotesSection() {
  const [quoteImages, setQuoteImages] = useState([])
  const [activeSlide, setActiveSlide] = useState(0)
  const { t } = useLanguage()

  useEffect(() => {
    let controller
    const loadImage = () => {
      controller?.abort()
      controller = new AbortController()
      getQuoteImage(controller.signal)
        .then((payload) => setQuoteImages(payload.quoteImages ?? (payload.quoteImage ? [payload.quoteImage] : [])))
        .catch((error) => {
          if (error.name !== 'AbortError') setQuoteImages([])
        })
    }
    loadImage()
    const unsubscribe = subscribeToQuoteImage(loadImage)
    return () => {
      controller?.abort()
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (quoteImages.length > 0 && window.location.hash === '#quotes') {
      window.requestAnimationFrame(() => document.getElementById('quotes')?.scrollIntoView())
    }
  }, [quoteImages.length])

  if (quoteImages.length === 0) return null
  const displayedSlide = Math.min(activeSlide, quoteImages.length - 1)
  const quoteImage = quoteImages[displayedSlide]
  const hasMultipleSlides = quoteImages.length > 1
  const showPrevious = () => setActiveSlide((displayedSlide - 1 + quoteImages.length) % quoteImages.length)
  const showNext = () => setActiveSlide((displayedSlide + 1) % quoteImages.length)

  return (
    <section className="quotes-section section-padding" id="quotes" aria-labelledby="quotes-title">
      <header className="quotes-section__header">
        <p className="section-kicker">{t('guruContent.quotesKicker')}</p>
        <h2 id="quotes-title">{t('guruContent.quotesTitle')}</h2>
      </header>
      <div className="quotes-carousel" role="region" aria-roledescription="carousel" aria-label={t('guruContent.quotesCarousel')}>
        <figure className="quotes-section__image" key={quoteImage.id} aria-live="polite">
          <img src={quoteImage.image} alt={`${t('guruContent.quotesAlt')} ${displayedSlide + 1}`} />
          {hasMultipleSlides && (
            <>
              <button className="quotes-carousel__arrow quotes-carousel__arrow--previous" type="button" aria-label={t('guruContent.quotesPrevious')} onClick={showPrevious}><span aria-hidden="true">‹</span></button>
              <button className="quotes-carousel__arrow quotes-carousel__arrow--next" type="button" aria-label={t('guruContent.quotesNext')} onClick={showNext}><span aria-hidden="true">›</span></button>
            </>
          )}
        </figure>
        {hasMultipleSlides && (
          <div className="quotes-carousel__navigation">
            <div className="quotes-carousel__dots" role="group" aria-label={t('guruContent.quotesCarousel')}>
              {quoteImages.map((item, index) => (
                <button
                  className={`quotes-carousel__dot${index === displayedSlide ? ' is-active' : ''}`}
                  type="button"
                  aria-label={`${t('guruContent.quotesShow')} ${index + 1}`}
                  aria-current={index === displayedSlide ? 'true' : undefined}
                  key={item.id}
                  onClick={() => setActiveSlide(index)}
                />
              ))}
            </div>
            <span className="quotes-carousel__count">{displayedSlide + 1} {t('guruContent.quotesOf')} {quoteImages.length}</span>
          </div>
        )}
      </div>
    </section>
  )
}
