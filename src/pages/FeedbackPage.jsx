import { useState } from 'react'
import { submitFeedback } from '../services/submissionsApi'
import { useLanguage } from '../i18n/useLanguage'

const EMPTY_FORM = { fullName: '', email: '', rating: '', message: '' }

export function FeedbackPage() {
  const { language, t } = useLanguage()
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState({ type: '', text: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus({ type: '', text: '' })

    try {
      await submitFeedback(form)
      setForm(EMPTY_FORM)
      setStatus({ type: 'success', text: t('forms.feedbackSuccess') })
    } catch (error) {
      setStatus({ type: 'error', text: language === 'ta' ? t('forms.submitError') : error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="submission-page submission-page--feedback section-padding" aria-labelledby="feedback-title">
      <div className="submission-page__layout">
        <div className="submission-page__intro">
          <p className="section-kicker">{t('forms.feedbackKicker')}</p>
          <h1 id="feedback-title">{t('forms.feedbackTitle')}</h1>
          <p>{t('forms.feedbackIntro')}</p>
          <span className="submission-page__motif" aria-hidden="true">✦</span>
        </div>

        <div className="submission-page__card">
          <h2>{t('forms.feedbackForm')}</h2>
          <p>{t('forms.feedbackNote')}</p>
          <form className="submission-form" onSubmit={handleSubmit}>
            <label>
              <span>{t('forms.yourName')}</span>
              <input name="fullName" value={form.fullName} maxLength="120" autoComplete="name" required onChange={updateField} />
            </label>
            <label>
              <span>{t('forms.email')} <small>({t('forms.optional')})</small></span>
              <input name="email" type="email" value={form.email} maxLength="254" autoComplete="email" onChange={updateField} />
            </label>
            <label className="submission-form__full">
              <span>{t('forms.rating')} <small>({t('forms.optional')})</small></span>
              <select name="rating" value={form.rating} onChange={updateField}>
                <option value="">{t('forms.chooseRating')}</option>
                <option value="5">5 — {t('forms.excellent')}</option>
                <option value="4">4 — {t('forms.good')}</option>
                <option value="3">3 — {t('forms.okay')}</option>
                <option value="2">2 — {t('forms.better')}</option>
                <option value="1">1 — {t('forms.improvement')}</option>
              </select>
            </label>
            <label className="submission-form__full">
              <span>{t('forms.yourFeedback')}</span>
              <textarea name="message" value={form.message} minLength="5" maxLength="2000" rows="6" required onChange={updateField} />
            </label>
            {status.text && <p className={`submission-status submission-status--${status.type} submission-form__full`} role={status.type === 'error' ? 'alert' : 'status'}>{status.text}</p>}
            <button className="submission-form__submit submission-form__full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('forms.sendingFeedback') : t('forms.sendFeedback')}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
