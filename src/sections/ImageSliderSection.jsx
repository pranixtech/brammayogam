import { useEffect, useState } from 'react'
import guruImage from '../assets/slider-guru.png'
import siddharImage from '../assets/slider-siddhar.jpeg'

const SLIDES = [
  {
    src: guruImage,
    alt: 'Guru Brahmashri Harish seated in meditation with a radiant halo',
  },
  {
    src: siddharImage,
    alt: 'A Siddhar seated in meditation with a radiant halo',
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
