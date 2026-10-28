import { useEffect, useState } from 'react'
import siddharIllustration from '../assets/slider/siddhar-illustration.jpeg'
import yogiArchivalPortrait from '../assets/slider/yogi-archival-portrait.jpeg'
import yogiPrayer from '../assets/slider/yogi-prayer.jpeg'
import { useLanguage } from '../i18n/LanguageContext'

const SLIDES = [
  {
    src: siddharIllustration,
    alt: 'Illustration of Siva Prabhakara Siddha Yogi seated in meditation',
  },
  {
    src: yogiArchivalPortrait,
    alt: 'Archival photograph of the yogi seated indoors',
  },
  {
    src: yogiPrayer,
    alt: 'Photograph of the yogi seated with hands joined in prayer',
  },
]

export function ImageSliderSection() {
  const [activeSlide, setActiveSlide] = useState(0)
  const { t } = useLanguage()
  const localizedAlts = t('slider.alts')

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    const intervalId = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % SLIDES.length)
    }, 3500)
    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <section className="image-slider-section section-padding" id="full-story" aria-label={t('slider.gallery')}>
      <div
        className="image-slider"
        role="region"
        aria-roledescription="carousel"
        aria-label={t('slider.portraits')}
      >
        <div className="image-slider__viewport">
          {SLIDES.map(({ src, alt }, index) => (
            <figure
              className={`image-slider__slide${index === activeSlide ? ' image-slider__slide--active' : ''}`}
              aria-hidden={index !== activeSlide}
              key={src}
            >
              <img src={src} alt={index === activeSlide ? localizedAlts[index] : ''} loading="lazy" />
            </figure>
          ))}
        </div>

      </div>
    </section>
  )
}
