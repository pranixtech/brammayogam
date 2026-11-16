import { useEffect, useMemo, useState } from 'react'
import { CITY_OPTIONS, findCityOption } from '../data/cities'
import { getCountryName, getCountryOptions } from '../data/countries'
import { getDeekshaPrograms, submitDeekshaSelection } from '../services/deekshaApi'
import { useLanguage } from '../i18n/useLanguage'

const EMPTY_FORM = {
  fullName: '', email: '', phone: '', city: '', country: '', message: '', consent: false,
}

export function DeekshaPage() {
  const { language } = useLanguage()
  const [programs, setPrograms] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState({ type: '', text: '' })
  const countryOptions = useMemo(() => getCountryOptions(language), [language])

  useEffect(() => {
    const controller = new AbortController()
    getDeekshaPrograms(controller.signal)
      .then(({ programs: items }) => {
        setPrograms(items)
        setStatus({ type: '', text: '' })
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setStatus({ type: 'error', text: 'Deeksha programs could not be loaded. Please try again.' })
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [])

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

  const toggleProgram = (id) => {
    const value = String(id)
    setSelectedIds((current) => current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value])
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedIds.length) {
      setStatus({ type: 'error', text: 'Choose at least one Deeksha program.' })
      document.getElementById('deeksha-programs')?.scrollIntoView({ block: 'start' })
      return
    }
    setIsSubmitting(true)
    setStatus({ type: '', text: '' })
    try {
      await submitDeekshaSelection({ ...form, programIds: selectedIds })
      setForm(EMPTY_FORM)
      setSelectedIds([])
      setStatus({ type: 'success', text: 'Thank you. Your Deeksha selection has been submitted successfully. Our team will contact you shortly.' })
    } catch (error) {
      setStatus({ type: 'error', text: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="deeksha-page section-padding" aria-labelledby="deeksha-title">
      <header className="deeksha-hero">
        <p className="section-kicker">Sacred paths of transformation</p>
        <h1 id="deeksha-title">Deeksha Programs</h1>
        <p>Transform your inner journey through the sacred path of Deeksha.</p>
        <p>Choose the Deeksha that resonates with your spiritual aspirations and begin your journey under the guidance of the Guru.</p>
      </header>

      {isLoading ? <p className="deeksha-state" role="status">Loading Deeksha programs…</p> : (
        <form className="deeksha-selection" onSubmit={handleSubmit}>
          <section id="deeksha-programs" className="deeksha-programs" aria-labelledby="deeksha-programs-title">
            <div className="deeksha-section-heading">
              <p className="section-kicker">Choose your path</p>
              <h2 id="deeksha-programs-title">Select one or more Deeksha programs</h2>
              <p>{selectedIds.length} selected</p>
            </div>
            <div className="deeksha-program-grid">
              {programs.map((program, index) => {
                const isSelected = selectedIds.includes(String(program.id))
                return (
                  <article className={`deeksha-program-card${isSelected ? ' is-selected' : ''}`} key={program.id}>
                    <label className="deeksha-program-card__select">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleProgram(program.id)} />
                      <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                      <strong>{isSelected ? 'Selected' : 'Select Deeksha'}</strong>
                    </label>
                    <h3>{program.title}</h3>
                    {program.subtitle && <h4>{program.subtitle}</h4>}
                    {program.description && <p>{program.description}</p>}
                    {program.benefits?.length > 0 && (
                      <details>
                        <summary>Spiritual Benefits &amp; Areas of Focus</summary>
                        <ul>{program.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
                      </details>
                    )}
                  </article>
                )
              })}
            </div>
          </section>

          <section className="deeksha-contact" aria-labelledby="deeksha-contact-title">
            <div className="deeksha-section-heading">
              <p className="section-kicker">Begin your journey</p>
              <h2 id="deeksha-contact-title">Share your details</h2>
              <p>Our team will contact you regarding your selected Deeksha programs.</p>
            </div>
            <div className="deeksha-contact__fields">
              <label><span>Full name *</span><input name="fullName" value={form.fullName} maxLength="120" required onChange={updateField} /></label>
              <label><span>Email address</span><input type="email" name="email" value={form.email} maxLength="254" onChange={updateField} /></label>
              <label><span>Phone / WhatsApp *</span><input type="tel" name="phone" value={form.phone} maxLength="30" required onChange={updateField} /></label>
              <label>
                <span>City</span>
                <input name="city" value={form.city} list="deeksha-city-options" maxLength="100" onChange={updateCity} />
                <datalist id="deeksha-city-options">
                  {CITY_OPTIONS.map(({ name, countryCode }) => <option value={name} label={getCountryName(countryCode, language)} key={`${countryCode}-${name}`} />)}
                </datalist>
              </label>
              <label>
                <span>Country</span>
                <select name="country" value={form.country} onChange={updateField}>
                  <option value="">Select country</option>
                  {countryOptions.map(({ code, label }) => <option value={code} key={code}>{label}</option>)}
                </select>
              </label>
              <label className="deeksha-contact__message"><span>Message <small>(optional)</small></span><textarea name="message" value={form.message} maxLength="1000" rows="4" onChange={updateField} /></label>
              <label className="deeksha-contact__consent">
                <input type="checkbox" name="consent" checked={form.consent} required onChange={updateField} />
                <span>I agree to be contacted by Brahmam Foundation about my Deeksha selection.</span>
              </label>
            </div>
            {status.text && <p className={`deeksha-status deeksha-status--${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.text}</p>}
            <button className="deeksha-submit" type="submit" disabled={isSubmitting || !programs.length}>{isSubmitting ? 'Submitting…' : 'Submit Deeksha Selection'}</button>
          </section>
        </form>
      )}
    </section>
  )
}
