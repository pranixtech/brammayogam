import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/useLanguage'
import { getUpcomingClasses, subscribeToUpcomingClasses } from '../services/classesApi'

export function UpcomingClassesSliderSection() {
  const { t } = useLanguage()
  const [classes, setClasses] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    let controller
    const loadClasses = () => {
      controller?.abort()
      controller = new AbortController()
      getUpcomingClasses(controller.signal)
        .then(({ classes: items }) => {
          setClasses(items)
          setActiveIndex((current) => (items.length ? Math.min(current, items.length - 1) : 0))
        })
        .catch((error) => {
          if (error.name !== 'AbortError') setClasses([])
        })
    }

    loadClasses()
    const unsubscribe = subscribeToUpcomingClasses(loadClasses)
    return () => {
      controller?.abort()
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (classes.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % classes.length)
    }, 5000)
    return () => window.clearInterval(intervalId)
  }, [classes.length])

  if (!classes.length) return null

  return (
    <section className="classes-promo section-padding" aria-labelledby="classes-promo-title">
      <div className="classes-promo__inner">
        <header className="classes-promo__header">
          <p className="section-kicker">{t('classesPromo.kicker')}</p>
          <h2 id="classes-promo-title">{t('classesPromo.title')}</h2>
          <p>{t('classesPromo.description')}</p>
        </header>

        <div
          className="classes-promo__carousel"
          role="region"
          aria-roledescription="carousel"
          aria-label={t('classesPromo.carousel')}
        >
          <div className="classes-promo__viewport">
            {classes.map((item, index) => (
              <figure
                className={`classes-promo__slide${index === activeIndex ? ' is-active' : ''}`}
                aria-hidden={index !== activeIndex}
                key={item.id}
              >
                <img src={item.image} alt={index === activeIndex ? item.title : ''} loading={index === 0 ? 'eager' : 'lazy'} />
              </figure>
            ))}
          </div>

          <div className="classes-promo__caption" aria-live="polite">
            <strong>{classes[activeIndex]?.title}</strong>
          </div>
        </div>

        <Link className="classes-promo__register" to="/registration">{t('classesPromo.register')}</Link>
      </div>
    </section>
  )
}
