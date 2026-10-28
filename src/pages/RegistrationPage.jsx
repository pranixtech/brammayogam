import { useState } from 'react'
import { submitRegistration } from '../services/submissionsApi'

const EMPTY_FORM = { fullName: '', email: '', phone: '', country: '', message: '', consent: false }

export function RegistrationPage() {
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
      const result = await submitRegistration(form)
      setForm(EMPTY_FORM)
      setStatus({ type: 'success', text: result.message })
    } catch (error) {
      setStatus({ type: 'error', text: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="submission-page section-padding" aria-labelledby="registration-title">
      <div className="submission-page__layout">
        <div className="submission-page__intro">
          <p className="section-kicker">Online classes</p>
          <h1 id="registration-title">Begin your practice with us.</h1>
          <p>Share your details to register your interest in Brahmam Foundation’s online classes. Our team will contact you with the next steps.</p>
          <span className="submission-page__motif" aria-hidden="true">✦</span>
        </div>

        <div className="submission-page__card">
          <h2>Registration form</h2>
          <p>Fields marked with * are required.</p>
          <form className="submission-form" onSubmit={handleSubmit}>
            <label>
              <span>Full name *</span>
              <input name="fullName" value={form.fullName} maxLength="120" autoComplete="name" required onChange={updateField} />
            </label>
            <label>
              <span>Email address *</span>
              <input name="email" type="email" value={form.email} maxLength="254" autoComplete="email" required onChange={updateField} />
            </label>
            <label>
              <span>Phone / WhatsApp *</span>
              <input name="phone" type="tel" value={form.phone} maxLength="30" autoComplete="tel" required onChange={updateField} />
            </label>
            <label>
              <span>Country *</span>
              <input name="country" value={form.country} maxLength="80" autoComplete="country-name" required onChange={updateField} />
            </label>
            <label className="submission-form__full">
              <span>Questions or notes <small>(optional)</small></span>
              <textarea name="message" value={form.message} maxLength="1000" rows="5" onChange={updateField} />
            </label>
            <label className="submission-form__consent submission-form__full">
              <input name="consent" type="checkbox" checked={form.consent} required onChange={updateField} />
              <span>I agree to be contacted about online classes using the details above.</span>
            </label>
            {status.text && <p className={`submission-status submission-status--${status.type} submission-form__full`} role={status.type === 'error' ? 'alert' : 'status'}>{status.text}</p>}
            <button className="submission-form__submit submission-form__full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending registration…' : 'Submit registration'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
