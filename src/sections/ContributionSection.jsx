import { useEffect, useState } from 'react'
import { getContributions, subscribeToContributions } from '../services/contributionsApi'
import { useLanguage } from '../i18n/useLanguage'
import { AnnathanamPayment } from '../components/payments/AnnathanamPayment'

export function ContributionSection() {
  const { t } = useLanguage()
  const [contributions, setContributions] = useState([])
  const [isLoading, setIsLoading] = useState(true)

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

  return (
    <section className="contribution-section section-padding" id="contribution" aria-labelledby="contribution-title">
      <div className="contribution-section__inner">
        <header className="contribution-section__header">
          <p className="section-kicker">{t('contribution.kicker')}</p>
          <h2 id="contribution-title">{t('contribution.title')}</h2>
          <p>{t('contribution.description')}</p>
        </header>

        <div className="contribution-section__grid">
          {contributions.map((contribution, index) => (
            <article className="contribution-card" key={contribution.id}>
              <blockquote>{contribution.quote}</blockquote>
              <div className="contribution-card__media">
                {contribution.mediaType === 'image' && (
                  <img src={contribution.src} alt={t('contribution.mediaAlt')} loading="lazy" />
                )}
                {contribution.mediaType === 'video' && (
                  <video src={contribution.src} controls preload="metadata" playsInline aria-label={t('contribution.mediaAlt')} />
                )}
              </div>
              {index === 0 && <AnnathanamPayment />}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
