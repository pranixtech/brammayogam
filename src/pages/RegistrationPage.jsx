import { useEffect, useMemo, useRef, useState } from 'react'
import registrationPaymentQr from '../assets/class-registration-upi-qr.png'
import { CITY_OPTIONS, findCityOption } from '../data/cities'
import { getCountryName, getCountryOptions } from '../data/countries'
import { submitRegistration } from '../services/submissionsApi'
import { getUpcomingClasses, subscribeToUpcomingClasses } from '../services/classesApi'
import { useLanguage } from '../i18n/useLanguage'

const EMPTY_FORM = { fullName: '', email: '', phone: '', city: '', country: '', message: '', classId: '', consent: false, paymentMethod: 'UPI' }

export function RegistrationPage() {
  const { language, t } = useLanguage()
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState({ type: '', text: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [classes, setClasses] = useState([])
  const [classesError, setClassesError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [previewClass, setPreviewClass] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentScreenshot, setPaymentScreenshot] = useState(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const paymentSectionRef = useRef(null)
  const cameraVideoRef = useRef(null)
  const paymentPreviewUrl = useMemo(
    () => (paymentScreenshot ? URL.createObjectURL(paymentScreenshot) : ''),
    [paymentScreenshot],
  )
  const countryOptions = useMemo(() => getCountryOptions(language), [language])

  useEffect(() => () => {
    if (paymentPreviewUrl) URL.revokeObjectURL(paymentPreviewUrl)
  }, [paymentPreviewUrl])

  useEffect(() => {
    if (!cameraOpen) return undefined
    let stream
    let cancelled = false
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera is not supported')
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        const video = cameraVideoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        setCameraReady(true)
      } catch {
        setCameraError(t('forms.cameraPermissionError'))
      }
    }

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setCameraOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    startCamera()

    return () => {
      cancelled = true
      stream?.getTracks().forEach((track) => track.stop())
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [cameraOpen, t])

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

  const updateCity = (event) => {
    const city = event.target.value
    const selectedCity = findCityOption(city)
    setForm((current) => ({
      ...current,
      city: selectedCity?.name ?? city,
      country: selectedCity?.countryCode ?? current.country,
    }))
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

    if (!showPayment) {
      setStatus({ type: '', text: '' })
      setShowPayment(true)
      setIsSubmitting(false)
      window.requestAnimationFrame(() => paymentSectionRef.current?.scrollIntoView({ block: 'center' }))
      return
    }

    if (!paymentScreenshot) {
      setStatus({ type: 'error', text: t('forms.paymentScreenshotRequired') })
      setIsSubmitting(false)
      return
    }

    try {
      await submitRegistration({ ...form, paymentScreenshot })
      setForm(EMPTY_FORM)
      setPaymentScreenshot(null)
      setShowPayment(false)
      setShowSuccess(true)
    } catch (error) {
      setStatus({ type: 'error', text: language === 'ta' ? t('forms.submitError') : error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openPaymentStep = (event) => {
    const registrationForm = event.currentTarget.form
    if (classes.length > 0 && !form.classId) {
      setStatus({ type: 'error', text: t('forms.chooseClassError') })
      return
    }
    if (!registrationForm?.reportValidity()) return
    setStatus({ type: '', text: '' })
    setShowPayment(true)
    window.requestAnimationFrame(() => paymentSectionRef.current?.scrollIntoView({ block: 'center' }))
  }

  const openCamera = () => {
    setCameraError('')
    setCameraReady(false)
    setCameraOpen(true)
  }

  const capturePhoto = () => {
    const video = cameraVideoRef.current
    if (!video?.videoWidth || !video.videoHeight) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError(t('forms.cameraCaptureError'))
        return
      }
      setPaymentScreenshot(new File([blob], `payment-photo-${Date.now()}.jpg`, { type: 'image/jpeg' }))
      setCameraOpen(false)
    }, 'image/jpeg', 0.9)
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
              <input
                name="city"
                value={form.city}
                list="registration-city-options"
                maxLength="80"
                autoComplete="address-level2"
                placeholder={t('forms.selectCity')}
                required
                onChange={updateCity}
              />
              <datalist id="registration-city-options">
                {CITY_OPTIONS.map(({ name, countryCode }) => (
                  <option value={name} label={getCountryName(countryCode, language)} key={`${countryCode}-${name}`} />
                ))}
              </datalist>
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
            {!showPayment && (
              <button className="submission-form__submit submission-form__full" type="button" onClick={openPaymentStep}>
                {t('forms.continueToPayment')}
              </button>
            )}
            {showPayment && (
              <section className="registration-payment submission-form__full" ref={paymentSectionRef} aria-labelledby="registration-payment-title">
                <div className="registration-payment__heading">
                  <p className="section-kicker">{t('forms.paymentKicker')}</p>
                  <h3 id="registration-payment-title">{t('forms.paymentTitle')}</h3>
                  <p>{t('forms.paymentIntro')}</p>
                </div>
                <div className="registration-payment__method">
                  <span className="registration-payment__method-check" aria-hidden="true">✓</span>
                  <span><strong>{t('forms.upiPayment')}</strong><small>{t('forms.scanQr')}</small></span>
                </div>
                <figure className="registration-payment__qr">
                  <img src={registrationPaymentQr} alt={t('forms.paymentQrAlt')} />
                </figure>
                <p className="registration-payment__notice">{t('forms.paymentVerificationNotice')}</p>
                <div className="registration-payment__proof">
                  <strong>{t('forms.paymentScreenshot')}</strong>
                  <div className="registration-payment__proof-actions">
                    <label className="registration-payment__source">
                      <span aria-hidden="true">↑</span>
                      {t('forms.uploadFromDevice')}
                      <input
                        name="paymentScreenshotUpload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => setPaymentScreenshot(event.target.files?.[0] ?? null)}
                      />
                    </label>
                    <button className="registration-payment__source" type="button" onClick={openCamera}>
                      <span aria-hidden="true">◉</span>
                      {t('forms.takePhoto')}
                    </button>
                  </div>
                  <small>{t('forms.paymentScreenshotHelp')}</small>
                </div>
                {paymentPreviewUrl && (
                  <figure className="registration-payment__preview">
                    <img src={paymentPreviewUrl} alt={t('forms.paymentScreenshotPreview')} />
                    <figcaption>{paymentScreenshot.name}</figcaption>
                  </figure>
                )}
              </section>
            )}
            {status.text && <p className={`submission-status submission-status--${status.type} submission-form__full`} role={status.type === 'error' ? 'alert' : 'status'}>{status.text}</p>}
            {showPayment && (
              <button className="submission-form__submit submission-form__full" type="submit" disabled={isSubmitting || !paymentScreenshot || (classes.length > 0 && !form.classId)}>
                {isSubmitting ? t('forms.sendingRegistration') : t('forms.submitRegistration')}
              </button>
            )}
            </form>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="registration-success" role="dialog" aria-modal="true" aria-labelledby="registration-success-title">
          <div className="registration-success__card">
            <span aria-hidden="true">✓</span>
            <h2 id="registration-success-title">{t('forms.thankYou')}</h2>
            <p>{t('forms.registrationPaymentSuccess')}</p>
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

      {cameraOpen && (
        <div className="registration-camera" role="dialog" aria-modal="true" aria-labelledby="registration-camera-title">
          <div className="registration-camera__card">
            <div className="registration-camera__heading">
              <h2 id="registration-camera-title">{t('forms.cameraTitle')}</h2>
              <button type="button" aria-label={t('forms.closeCamera')} onClick={() => setCameraOpen(false)}>×</button>
            </div>
            <div className="registration-camera__viewport">
              <video ref={cameraVideoRef} muted playsInline aria-label={t('forms.cameraPreview')} />
              {!cameraReady && !cameraError && <p>{t('forms.openingCamera')}</p>}
              {cameraError && <p className="registration-camera__error" role="alert">{cameraError}</p>}
            </div>
            <div className="registration-camera__actions">
              <button type="button" onClick={() => setCameraOpen(false)}>{t('forms.cancelCamera')}</button>
              <button type="button" disabled={!cameraReady} onClick={capturePhoto}>{t('forms.capturePhoto')}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
