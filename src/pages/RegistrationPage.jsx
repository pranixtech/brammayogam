import { useState } from 'react'
import { submitRegistration } from '../services/submissionsApi'
import { useLanguage } from '../i18n/LanguageContext'

const EMPTY_FORM = { fullName: '', email: '', phone: '', country: '', message: '', consent: false }

export function RegistrationPage() {
  const { language, t } = useLanguage()
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState({ type: '', text: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (event) => {
    const { name, type, value, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus({ type: '', text: '' })

    try {
      await submitRegistration(form)
      setForm(EMPTY_FORM)
      setStatus({ type: 'success', text: t('forms.registrationSuccess') })
    } catch (error) {
      setStatus({ type: 'error', text: language === 'ta' ? t('forms.submitError') : error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="submission-page section-padding" aria-labelledby="registration-title">
      <div className="submission-page__layout">
        <div className="submission-page__intro">
          <p className="section-kicker">{t('forms.registrationKicker')}</p>
          <h1 id="registration-title">{t('forms.registrationTitle')}</h1>
          <p>{t('forms.registrationIntro')}</p>
          <span className="submission-page__motif" aria-hidden="true">✦</span>
        </div>

        <div className="submission-page__card">
          <h2>{t('forms.registrationForm')}</h2>
          <p>{t('forms.required')}</p>
          <form className="submission-form" onSubmit={handleSubmit}>
            <label>
              <span>{t('forms.fullName')}</span>
              <input name="fullName" value={form.fullName} maxLength="120" autoComplete="name" required onChange={updateField} />
            </label>
            <label>
              <span>{t('forms.email')} *</span>
              <input name="email" type="email" value={form.email} maxLength="254" autoComplete="email" required onChange={updateField} />
            </label>
            <label>
              <span>{t('forms.phone')}</span>
              <input name="phone" type="tel" value={form.phone} maxLength="30" autoComplete="tel" required onChange={updateField} />
            </label>
            <label>
              <span>{t('forms.country')}</span>
              <input name="country" value={form.country} maxLength="80" autoComplete="country-name" required onChange={updateField} />
            </label>
            <label className="submission-form__full">
              <span>{t('forms.notes')} <small>({t('forms.optional')})</small></span>
              <textarea name="message" value={form.message} maxLength="1000" rows="5" onChange={updateField} />
            </label>
            <label className="submission-form__consent submission-form__full">
              <input name="consent" type="checkbox" checked={form.consent} required onChange={updateField} />
              <span>{t('forms.consent')}</span>
            </label>
            {status.text && <p className={`submission-status submission-status--${status.type} submission-form__full`} role={status.type === 'error' ? 'alert' : 'status'}>{status.text}</p>}
            <button className="submission-form__submit submission-form__full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('forms.sendingRegistration') : t('forms.submitRegistration')}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
