import { useEffect, useState } from 'react'
import { getActivities, subscribeToActivities } from '../services/activitiesApi'
import { useLanguage } from '../i18n/useLanguage'

export function UpcomingActivitiesSection() {
  const { t } = useLanguage()
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const load = () => {
      getActivities(controller.signal)
        .then(({ activities: items }) => {
          setActivities(items)
          setError('')
        })
        .catch((requestError) => {
          if (requestError.name !== 'AbortError') setError('unavailable')
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false)
        })
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') load()
    }

    load()
    const unsubscribe = subscribeToActivities(load)
    window.addEventListener('focus', load)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      controller.abort()
      unsubscribe()
      window.removeEventListener('focus', load)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  if (isLoading || activities.length === 0) return null

  return (
    <section className="upcoming-activities section-padding" aria-labelledby="upcoming-activities-title">
      <div className="upcoming-activities__inner">
        <header className="upcoming-activities__header">
          <p className="section-kicker">{t('activities.kicker')}</p>
          <h2 id="upcoming-activities-title">{t('activities.title')} <em>{t('activities.titleEmphasis')}</em></h2>
          <p>{t('activities.description')}</p>
        </header>

        {error && <p className="upcoming-activities__notice" role="status">{t('activities.error')}</p>}
        <div className="upcoming-activities__grid" aria-live="polite">
          {activities.map((activity) => (
            <article className="upcoming-activity" key={activity.id}>
              <div className="upcoming-activity__media">
                {activity.mediaType === 'image' && <img src={activity.src} alt={activity.title} loading="lazy" />}
                {activity.mediaType === 'video' && <video src={activity.src} controls preload="metadata" playsInline aria-label={activity.title} />}
              </div>
              <div className="upcoming-activity__copy">
                <span className="section-kicker">{t('activities.item')}</span>
                <h3>{activity.title}</h3>
                {activity.description && <p>{activity.description}</p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
