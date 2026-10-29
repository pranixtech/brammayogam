import { useEffect, useMemo, useRef, useState } from 'react'
import {
  deleteUpcomingClass,
  getUpcomingClasses,
  notifyUpcomingClassesUpdated,
  uploadUpcomingClass,
} from '../../services/classesApi'

export function AdminClassesManager() {
  const [classes, setClasses] = useState([])
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const fileInput = useRef(null)
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])

  useEffect(() => {
    const controller = new AbortController()
    getUpcomingClasses(controller.signal)
      .then((payload) => setClasses(payload.classes))
      .catch((error) => {
        if (error.name !== 'AbortError') setMessage({ type: 'error', text: error.message })
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleUpload = async (event) => {
    event.preventDefault()
    if (!file || !title.trim() || classes.length >= 10) return
    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('image', file)
    setIsUploading(true)
    setMessage({ type: '', text: '' })
    try {
      const { upcomingClass } = await uploadUpcomingClass(formData)
      setClasses((current) => [upcomingClass, ...current])
      setTitle('')
      setFile(null)
      if (fileInput.current) fileInput.current.value = ''
      notifyUpcomingClassesUpdated()
      setMessage({ type: 'success', text: 'Upcoming class added.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete “${item.title}” permanently?`)) return
    setMessage({ type: '', text: '' })
    try {
      await deleteUpcomingClass(item.id)
      setClasses((current) => current.filter(({ id }) => id !== item.id))
      notifyUpcomingClassesUpdated()
      setMessage({ type: 'success', text: 'Upcoming class deleted.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const limitReached = classes.length >= 10
  return (
    <div className="admin-classes">
      <form className="admin-upload" onSubmit={handleUpload}>
        <div className="admin-upload__heading">
          <div>
            <p className="section-kicker">Registration choices</p>
            <h2>Upcoming Classes</h2>
          </div>
          <p>Add a category title and image. Up to 10 classes can be shown in the swipe selector.</p>
        </div>
        {limitReached && <p className="admin-capacity-note">All 10 class slots are filled. Delete one before adding another.</p>}
        <div className="admin-activities__fields">
          <label className="admin-activities__field">
            <span>Class title</span>
            <input value={title} maxLength={120} required placeholder="e.g. Online meditation class" onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="admin-activities__field admin-activities__file">
            <span>Class image</span>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <small>JPG, PNG or WebP · up to 10 MB</small>
          </label>
        </div>
        {previewUrl && (
          <figure className="admin-class-preview">
            <img src={previewUrl} alt="Selected class preview" />
            <figcaption>
              <strong>Image preview</strong>
              <span>{file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB</span>
            </figcaption>
          </figure>
        )}
        <button className="admin-button admin-button--primary" type="submit" disabled={isUploading || limitReached || !file || !title.trim()}>
          {isUploading ? 'Uploading…' : 'Add class'}
        </button>
      </form>

      {message.text && <p className={`admin-message admin-message--${message.type}`} role="status">{message.text}</p>}

      <section className="admin-photo-list" aria-live="polite">
        <div className="admin-photo-list__heading"><h2>Published classes</h2><span>{classes.length} / 10</span></div>
        {isLoading ? <p className="admin-empty-state">Loading classes…</p> : classes.length ? (
          <div className="admin-classes__grid">
            {classes.map((item) => (
              <article className="admin-classes__card" key={item.id}>
                <img src={item.image} alt="" loading="lazy" />
                <div><strong>{item.title}</strong><button type="button" onClick={() => handleDelete(item)}>Delete</button></div>
              </article>
            ))}
          </div>
        ) : <p className="admin-empty-state">No upcoming classes yet.</p>}
      </section>
    </div>
  )
}
