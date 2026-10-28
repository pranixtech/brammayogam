import { useEffect, useRef, useState } from 'react'
import yogiEncounterImage from '../assets/yogi-encounter.jpeg'
import indoorGatheringImage from '../assets/yogi-encounter/gathering-indoors.jpeg'
import forestGatheringImage from '../assets/yogi-encounter/gathering-forest.jpeg'
import { useLanguage } from '../i18n/useLanguage'

const SLIDES = [
  {
    src: yogiEncounterImage,
    alt: 'An elderly yogi with a long white beard standing beside a man in white',
  },
  {
    src: indoorGatheringImage,
    alt: 'A group of yogis seated together indoors',
  },
  {
    src: forestGatheringImage,
    alt: 'A group of yogis gathered on rocks in a forest',
  },
]

const LOOPED_SLIDES = [SLIDES[SLIDES.length - 1], ...SLIDES, SLIDES[0]]

export function YogiEncounterSection() {
  const { t } = useLanguage()
  const localizedAlts = t('yogi.alts')
  const [slidePosition, setSlidePosition] = useState(1)
  const [animate, setAnimate] = useState(true)
  const [isMoving, setIsMoving] = useState(false)
  const movingRef = useRef(false)
  const touchStartRef = useRef(null)
  const reducedMotionRef = useRef(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )
  const activeIndex = (slidePosition - 1 + SLIDES.length) % SLIDES.length

  function moveSlide(step) {
    if (movingRef.current) return
    if (reducedMotionRef.current) {
      setSlidePosition((current) => ((current - 1 + step + SLIDES.length) % SLIDES.length) + 1)
      return
    }
    movingRef.current = true
    setIsMoving(true)
    setAnimate(true)
    setSlidePosition((current) => current + step)
  }

  function selectSlide(index) {
    if (movingRef.current || index === activeIndex) return
    if (!reducedMotionRef.current) {
      movingRef.current = true
      setIsMoving(true)
      setAnimate(true)
    }
    setSlidePosition(index + 1)
  }

  function handleTransitionEnd(event) {
    if (event.target !== event.currentTarget) return
    if (slidePosition === 0 || slidePosition === SLIDES.length + 1) {
      setAnimate(false)
      setSlidePosition(slidePosition === 0 ? SLIDES.length : 1)
    }
    movingRef.current = false
    setIsMoving(false)
  }

  function handleTouchStart(event) {
    const touch = event.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  function handleTouchEnd(event) {
    const start = touchStartRef.current
    touchStartRef.current = null
    if (!start) return
    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      moveSlide(deltaX < 0 ? 1 : -1)
    }
  }

  useEffect(() => {
    if (reducedMotionRef.current) return undefined
    const intervalId = window.setInterval(() => {
      if (movingRef.current) return
      movingRef.current = true
      setIsMoving(true)
      setAnimate(true)
      setSlidePosition((current) => current + 1)
    }, 5000)
    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <section className="yogi-encounter-section section-padding" aria-labelledby="yogi-encounter-title">
      <div className="yogi-encounter-section__layout">
        <div className="yogi-encounter-carousel" role="region" aria-roledescription="carousel" aria-label={t('yogi.carousel')}>
          <div className="yogi-encounter-carousel__viewport" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div
              className="yogi-encounter-carousel__track"
              style={{ transform: `translateX(-${slidePosition * 100}%)`, transition: animate ? undefined : 'none' }}
              onTransitionEnd={handleTransitionEnd}
            >
              {LOOPED_SLIDES.map((slide, index) => (
                <figure className="yogi-encounter-carousel__slide" key={`${slide.src}-${index}`} aria-hidden={index !== slidePosition}>
                  <img src={slide.src} alt={index === slidePosition ? localizedAlts[(index - 1 + SLIDES.length) % SLIDES.length] : ''} loading="lazy" />
                </figure>
              ))}
            </div>
          </div>
          <div className="yogi-encounter-carousel__controls">
            <button type="button" onClick={() => moveSlide(-1)} disabled={isMoving} aria-label={t('yogi.previous')}>←</button>
            <div className="yogi-encounter-carousel__dots" aria-label={t('yogi.choose')}>
              {SLIDES.map((slide, index) => (
                <button
                  type="button"
                  key={slide.src}
                  className={index === activeIndex ? 'is-active' : ''}
                  aria-label={`${t('yogi.show')} ${index + 1} ${t('yogi.of')} ${SLIDES.length}`}
                  aria-current={index === activeIndex ? 'true' : undefined}
                  onClick={() => selectSlide(index)}
                  disabled={isMoving}
                />
              ))}
            </div>
            <button type="button" onClick={() => moveSlide(1)} disabled={isMoving} aria-label={t('yogi.next')}>→</button>
          </div>
        </div>

        <div className="yogi-encounter-section__words">
          <p className="section-kicker">{t('yogi.kicker')}</p>
          <h2 id="yogi-encounter-title">{t('yogi.title')}</h2>
          <blockquote>
            {t('yogi.quote')}
          </blockquote>
        </div>
      </div>
    </section>
  )
}
