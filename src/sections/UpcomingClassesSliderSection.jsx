import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/useLanguage'
import { getAds, subscribeToAds } from '../services/adsApi'

export function UpcomingClassesSliderSection() {
  const { t } = useLanguage()
  const [ads, setAds] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    let controller
    const loadAds = () => {
      controller?.abort()
      controller = new AbortController()
      getAds(controller.signal)
        .then(({ ads: items }) => {
          setAds(items)
          setActiveIndex((current) => (items.length ? Math.min(current, items.length - 1) : 0))
        })
        .catch((error) => {
          if (error.name !== 'AbortError') setAds([])
        })
    }

    loadAds()
    const unsubscribe = subscribeToAds(loadAds)
    return () => {
      controller?.abort()
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (ads.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % ads.length)
    }, 5000)
    return () => window.clearInterval(intervalId)
  }, [ads.length])

  if (!ads.length) return null

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
            {ads.map((item, index) => (
              <figure
                className={`classes-promo__slide${index === activeIndex ? ' is-active' : ''}`}
                aria-hidden={index !== activeIndex}
                key={item.id}
              >
                <img src={item.image} alt={index === activeIndex ? `${t('classesPromo.advertisement')} ${index + 1}` : ''} loading={index === 0 ? 'eager' : 'lazy'} />
              </figure>
            ))}
          </div>

        </div>

        <Link className="classes-promo__register" to="/registration">{t('classesPromo.register')}</Link>
      </div>
    </section>
  )
}
