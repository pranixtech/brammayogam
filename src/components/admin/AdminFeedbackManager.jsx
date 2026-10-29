import { useEffect, useState } from 'react'
import {
  createAdminFeedback,
  deleteAdminFeedback,
  getAdminFeedback,
  updateAdminFeedback,
} from '../../services/submissionsApi'

const EMPTY_FORM = { fullName: '', roleOrLocation: '', rating: '5', message: '' }

export function AdminFeedbackManager() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState({ type: '', text: '' })

  useEffect(() => {
    const controller = new AbortController()
    getAdminFeedback(controller.signal)
      .then((payload) => setItems(payload.feedback))
      .catch((error) => {
        if (error.name !== 'AbortError') setStatus({ type: 'error', text: error.message })
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [])

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setStatus({ type: '', text: '' })
    try {
      const payload = editingId
        ? await updateAdminFeedback(editingId, form)
        : await createAdminFeedback(form)
      setItems((current) => editingId
        ? current.map((item) => item.id === editingId ? payload.feedback : item)
        : [payload.feedback, ...current])
      setStatus({ type: 'success', text: editingId ? 'Feedback updated.' : 'Feedback published.' })
      resetForm()
    } catch (error) {
      setStatus({ type: 'error', text: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  const startEditing = (item) => {
    setEditingId(item.id)
    setForm({
      fullName: item.fullName,
      roleOrLocation: item.roleOrLocation,
      rating: String(item.rating),
      message: item.message,
    })
    setStatus({ type: '', text: '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete feedback from ${item.fullName}?`)) return
    setStatus({ type: '', text: '' })
    try {
      await deleteAdminFeedback(item.id)
      setItems((current) => current.filter(({ id }) => id !== item.id))
      if (editingId === item.id) resetForm()
      setStatus({ type: 'success', text: 'Feedback deleted.' })
    } catch (error) {
      setStatus({ type: 'error', text: error.message })
    }
  }

  return (
    <section className="admin-feedback" aria-labelledby="admin-feedback-title">
      <form className="admin-feedback__form" onSubmit={handleSubmit}>
        <div className="admin-submissions__heading">
          <div>
            <p className="section-kicker">Public feedback</p>
            <h2 id="admin-feedback-title">{editingId ? 'Edit feedback' : 'Publish feedback'}</h2>
            <p>Only feedback added here appears on the public Feedback page.</p>
          </div>
          {editingId && <button className="admin-button admin-button--quiet" type="button" onClick={resetForm}>Cancel edit</button>}
        </div>

        <div className="admin-feedback__fields">
          <label>
            <span>Name *</span>
            <input name="fullName" value={form.fullName} maxLength="120" required onChange={updateField} />
          </label>
          <label>
            <span>Role or location <small>(optional)</small></span>
            <input name="roleOrLocation" value={form.roleOrLocation} maxLength="160" placeholder="Chennai, India" onChange={updateField} />
          </label>
          <label>
            <span>Rating *</span>
            <select name="rating" value={form.rating} required onChange={updateField}>
              {[5, 4, 3, 2, 1].map((rating) => <option value={rating} key={rating}>{rating} / 5</option>)}
            </select>
          </label>
          <label className="admin-feedback__message">
            <span>Feedback *</span>
            <textarea name="message" value={form.message} minLength="5" maxLength="2000" rows="5" required onChange={updateField} />
          </label>
        </div>

        {status.text && <p className={`admin-message admin-message--${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.text}</p>}
        <button className="admin-button admin-button--primary" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : editingId ? 'Save changes' : 'Publish feedback'}
        </button>
      </form>

      <div className="admin-feedback__published">
        <div className="admin-photo-list__heading">
          <h2>Published feedback</h2>
          <span>{items.length} total</span>
        </div>
        {isLoading ? (
          <p className="admin-empty-state" role="status">Loading feedback…</p>
        ) : items.length > 0 ? (
          <div className="admin-submissions__list">
            {items.map((item) => (
              <article className="admin-submission-card" key={item.id}>
                <header>
                  <div>
                    <h3>{item.fullName}</h3>
                    {item.roleOrLocation && <p className="admin-feedback__byline">{item.roleOrLocation}</p>}
                  </div>
                  <span className="admin-submission-card__rating">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span>
                </header>
                <p className="admin-submission-card__message">{item.message}</p>
                <div className="admin-feedback__actions">
                  <button type="button" onClick={() => startEditing(item)}>Edit</button>
                  <button type="button" onClick={() => handleDelete(item)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-empty-state">No public feedback has been added yet.</p>
        )}
      </div>
    </section>
  )
}
