import { useEffect, useState } from 'react'
import siddharIllustration from '../assets/slider/siddhar-illustration.jpeg'
import yogiArchivalPortrait from '../assets/slider/yogi-archival-portrait.jpeg'
import yogiPrayer from '../assets/slider/yogi-prayer.jpeg'

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

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    const intervalId = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % SLIDES.length)
    }, 3500)
    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <section className="image-slider-section section-padding" id="full-story" aria-label="Spiritual image gallery">
      <div
        className="image-slider"
        role="region"
        aria-roledescription="carousel"
        aria-label="Spiritual portraits"
      >
        <div className="image-slider__viewport">
          {SLIDES.map(({ src, alt }, index) => (
            <figure
              className={`image-slider__slide${index === activeSlide ? ' image-slider__slide--active' : ''}`}
              aria-hidden={index !== activeSlide}
              key={src}
            >
              <img src={src} alt={index === activeSlide ? alt : ''} loading="lazy" />
            </figure>
          ))}
        </div>

      </div>
    </section>
  )
}
