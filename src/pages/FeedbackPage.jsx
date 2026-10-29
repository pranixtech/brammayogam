import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/useLanguage'
import { getFeedback } from '../services/submissionsApi'

export function FeedbackPage() {
  const { t } = useLanguage()
  const [feedback, setFeedback] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getFeedback(controller.signal)
      .then((payload) => {
        setFeedback(payload.feedback)
        setError('')
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(t('forms.feedbackError'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [t])

  return (
    <section className="feedback-page section-padding" aria-labelledby="feedback-title">
      <header className="feedback-page__header">
        <p className="section-kicker">{t('forms.feedbackKicker')}</p>
        <h1 id="feedback-title">{t('forms.feedbackTitle')}</h1>
        <p>{t('forms.feedbackIntro')}</p>
      </header>

      {isLoading ? (
        <p className="feedback-page__state" role="status">{t('forms.feedbackLoading')}</p>
      ) : error ? (
        <p className="feedback-page__state feedback-page__state--error" role="alert">{error}</p>
      ) : feedback.length > 0 ? (
        <div className="feedback-list">
          {feedback.map((item) => (
            <article className="feedback-card" key={item.id}>
              <div className="feedback-card__rating" aria-label={`${item.rating} / 5`}>
                <span aria-hidden="true">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span>
              </div>
              <blockquote>“{item.message}”</blockquote>
              <footer>
                <strong>{item.fullName}</strong>
                {item.roleOrLocation && <span>{item.roleOrLocation}</span>}
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <p className="feedback-page__state">{t('forms.feedbackEmpty')}</p>
      )}
    </section>
  )
}
