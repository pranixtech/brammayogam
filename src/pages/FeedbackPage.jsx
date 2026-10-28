import { useState } from 'react'
import { submitFeedback } from '../services/submissionsApi'

const EMPTY_FORM = { fullName: '', email: '', rating: '', message: '' }

export function FeedbackPage() {
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
      const result = await submitFeedback(form)
      setForm(EMPTY_FORM)
      setStatus({ type: 'success', text: result.message })
    } catch (error) {
      setStatus({ type: 'error', text: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="submission-page submission-page--feedback section-padding" aria-labelledby="feedback-title">
      <div className="submission-page__layout">
        <div className="submission-page__intro">
          <p className="section-kicker">Your voice matters</p>
          <h1 id="feedback-title">Share your experience.</h1>
          <p>Your feedback helps us understand your experience with the foundation and improve the way we serve the community.</p>
          <span className="submission-page__motif" aria-hidden="true">✦</span>
        </div>

        <div className="submission-page__card">
          <h2>Feedback form</h2>
          <p>Your message is shared with the Brahmam Foundation admin team.</p>
          <form className="submission-form" onSubmit={handleSubmit}>
            <label>
              <span>Your name *</span>
              <input name="fullName" value={form.fullName} maxLength="120" autoComplete="name" required onChange={updateField} />
            </label>
            <label>
              <span>Email address <small>(optional)</small></span>
              <input name="email" type="email" value={form.email} maxLength="254" autoComplete="email" onChange={updateField} />
            </label>
            <label className="submission-form__full">
              <span>Rating <small>(optional)</small></span>
              <select name="rating" value={form.rating} onChange={updateField}>
                <option value="">Choose a rating</option>
                <option value="5">5 — Excellent</option>
                <option value="4">4 — Good</option>
                <option value="3">3 — Okay</option>
                <option value="2">2 — Could be better</option>
                <option value="1">1 — Needs improvement</option>
              </select>
            </label>
            <label className="submission-form__full">
              <span>Your feedback *</span>
              <textarea name="message" value={form.message} minLength="5" maxLength="2000" rows="6" required onChange={updateField} />
            </label>
            {status.text && <p className={`submission-status submission-status--${status.type} submission-form__full`} role={status.type === 'error' ? 'alert' : 'status'}>{status.text}</p>}
            <button className="submission-form__submit submission-form__full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending feedback…' : 'Send feedback'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
