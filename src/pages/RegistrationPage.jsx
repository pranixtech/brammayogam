import { useEffect, useMemo, useState } from 'react'
import { getCountryOptions } from '../data/countries'
import { submitRegistration } from '../services/submissionsApi'
import { getUpcomingClasses, subscribeToUpcomingClasses } from '../services/classesApi'
import { useLanguage } from '../i18n/useLanguage'

const EMPTY_FORM = { fullName: '', email: '', phone: '', city: '', country: '', message: '', classId: '', consent: false }

export function RegistrationPage() {
  const { language, t } = useLanguage()
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState({ type: '', text: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [classes, setClasses] = useState([])
  const [classesError, setClassesError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [previewClass, setPreviewClass] = useState(null)
  const countryOptions = useMemo(() => getCountryOptions(language), [language])

  useEffect(() => {
    let controller
    const loadClasses = () => {
      controller?.abort()
      controller = new AbortController()
      getUpcomingClasses(controller.signal)
        .then((payload) => {
          setClasses(payload.classes)
          setClassesError('')
        })
        .catch((error) => {
          if (error.name !== 'AbortError') setClassesError(t('forms.classesError'))
        })
    }
    loadClasses()
    const unsubscribe = subscribeToUpcomingClasses(loadClasses)
    return () => {
      controller?.abort()
      unsubscribe()
    }
  }, [t])

  useEffect(() => {
    if (!previewClass) return undefined
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setPreviewClass(null)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [previewClass])

  const updateField = (event) => {
    const { name, type, value, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus({ type: '', text: '' })

    if (classes.length > 0 && !form.classId) {
      setStatus({ type: 'error', text: t('forms.chooseClassError') })
      setIsSubmitting(false)
      return
    }

    try {
      await submitRegistration(form)
      setForm(EMPTY_FORM)
      setShowSuccess(true)
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

        <div className="submission-page__form-column">
          <section className="class-selector" aria-labelledby="class-selector-title">
            <div className="class-selector__heading">
              <p className="section-kicker">{t('forms.upcomingClasses')}</p>
              <h2 id="class-selector-title">{t('forms.selectClass')}</h2>
              <p>{t('forms.swipeClasses')}</p>
            </div>
            {classesError ? <p className="class-selector__state" role="alert">{classesError}</p> : classes.length ? (
              <div className="class-selector__track" role="list" aria-label={t('forms.selectClass')}>
                {classes.map((item) => (
                  <article
                    className={`class-selector__card${form.classId === item.id ? ' is-selected' : ''}`}
                    role="listitem"
                    key={item.id}
                  >
                    <button className="class-selector__media" type="button" aria-label={`${t('forms.previewClass')}: ${item.title}`} onClick={() => setPreviewClass(item)}>
                      <img src={item.image} alt={item.title} loading="lazy" />
                      <span className="class-selector__preview-label"><span aria-hidden="true">↗</span>{t('forms.previewClass')}</span>
                    </button>
                    <div className="class-selector__details">
                      <h3>{item.title}</h3>
                      <button
                        className="class-selector__select"
                        type="button"
                        aria-pressed={form.classId === item.id}
                        onClick={() => setForm((current) => ({ ...current, classId: item.id }))}
                      >
                        {form.classId === item.id ? t('forms.selectedClass') : t('forms.selectThisClass')}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : <p className="class-selector__state">{t('forms.classesEmpty')}</p>}
          </section>

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
              <span>{t('forms.city')}</span>
              <input name="city" value={form.city} maxLength="80" autoComplete="address-level2" required onChange={updateField} />
            </label>
            <label>
              <span>{t('forms.country')}</span>
              <select name="country" value={form.country} autoComplete="country" required onChange={updateField}>
                <option value="">{t('forms.selectCountry')}</option>
                {countryOptions.map(({ code, label }) => <option value={code} key={code}>{label}</option>)}
              </select>
            </label>
            <label className="submission-form__full">
              <span>{t('forms.joiningPurpose')}</span>
              <textarea name="message" value={form.message} maxLength="100" rows="4" required onChange={updateField} />
            </label>
            <label className="submission-form__consent submission-form__full">
              <input name="consent" type="checkbox" checked={form.consent} required onChange={updateField} />
              <span>{t('forms.consent')}</span>
            </label>
            {status.text && <p className={`submission-status submission-status--${status.type} submission-form__full`} role={status.type === 'error' ? 'alert' : 'status'}>{status.text}</p>}
            <button className="submission-form__submit submission-form__full" type="submit" disabled={isSubmitting || (classes.length > 0 && !form.classId)}>
              {isSubmitting ? t('forms.sendingRegistration') : t('forms.submitRegistration')}
            </button>
            </form>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="registration-success" role="dialog" aria-modal="true" aria-labelledby="registration-success-title">
          <div className="registration-success__card">
            <span aria-hidden="true">✓</span>
            <h2 id="registration-success-title">{t('forms.thankYou')}</h2>
            <p>{t('forms.contactShortly')}</p>
            <button type="button" onClick={() => setShowSuccess(false)}>{t('forms.close')}</button>
          </div>
        </div>
      )}

      {previewClass && (
        <div
          className="class-preview-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="class-preview-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewClass(null)
          }}
        >
          <div className="class-preview-modal__card">
            <button className="class-preview-modal__close" type="button" aria-label={t('forms.closePreview')} onClick={() => setPreviewClass(null)}>×</button>
            <div className="class-preview-modal__media">
              <img src={previewClass.image} alt={previewClass.title} />
            </div>
            <div className="class-preview-modal__footer">
              <div>
                <p>{t('forms.classPreview')}</p>
                <h2 id="class-preview-title">{previewClass.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setForm((current) => ({ ...current, classId: previewClass.id }))
                  setPreviewClass(null)
                }}
              >
                {form.classId === previewClass.id ? t('forms.selectedClass') : t('forms.selectThisClass')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
