import { useEffect, useRef, useState } from 'react'
import { deleteActivity, getActivities, notifyActivitiesUpdated, uploadActivity } from '../../services/activitiesApi'

export function AdminActivitiesManager() {
  const [activities, setActivities] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const fileInput = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    getActivities(controller.signal)
      .then((payload) => setActivities(payload.activities))
      .catch((error) => {
        if (error.name !== 'AbortError') setMessage({ type: 'error', text: error.message })
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [])

  const handleUpload = async (event) => {
    event.preventDefault()
    if (!file || !title.trim()) return
    if (file.size > 100 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Choose a file that is 100 MB or smaller.' })
      return
    }

    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('description', description.trim())
    formData.append('media', file)
    setIsUploading(true)
    setMessage({ type: '', text: '' })
    try {
      const { activity } = await uploadActivity(formData)
      setActivities((current) => [activity, ...current])
      setTitle('')
      setDescription('')
      setFile(null)
      if (fileInput.current) fileInput.current.value = ''
      notifyActivitiesUpdated()
      setMessage({ type: 'success', text: 'Activity added to the homepage.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (activity) => {
    if (!window.confirm(`Delete “${activity.title}” and its media file permanently?`)) return
    setMessage({ type: '', text: '' })
    try {
      await deleteActivity(activity.id)
      setActivities((current) => current.filter((item) => item.id !== activity.id))
      notifyActivitiesUpdated()
      setMessage({ type: 'success', text: 'Activity deleted.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  return (
    <div className="admin-activities">
      <form className="admin-upload" onSubmit={handleUpload}>
        <div className="admin-upload__heading">
          <div>
            <p className="section-kicker">Homepage feature</p>
            <h2>Upcoming Activities</h2>
          </div>
          <p>Upload an image or video file for each activity. The homepage section appears after the first upload.</p>
        </div>
        <div className="admin-activities__fields">
          <label className="admin-activities__field">
            <span>Activity title</span>
            <input value={title} maxLength={160} required placeholder="e.g. Meditation gathering" onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="admin-activities__field">
            <span>Details <small>(optional)</small></span>
            <textarea value={description} maxLength={500} rows={3} placeholder="Date, place or a short description" onChange={(event) => setDescription(event.target.value)} />
          </label>
          <label className="admin-activities__field admin-activities__file">
            <span>Image or video file</span>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" required onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <small>JPG, PNG, WebP, MP4 or WebM · up to 100 MB · no YouTube link</small>
          </label>
        </div>
        <button className="admin-button admin-button--primary" type="submit" disabled={isUploading || !file || !title.trim()}>
          {isUploading ? 'Uploading…' : 'Add activity'}
        </button>
      </form>

      {message.text && <p className={`admin-message admin-message--${message.type}`} role="status">{message.text}</p>}

      <section className="admin-photo-list" aria-live="polite">
        <div className="admin-photo-list__heading">
          <h2>Published activities</h2>
          <span>{activities.length} total</span>
        </div>
        {isLoading ? <p className="admin-empty-state">Loading activities…</p> : activities.length ? (
          <div className="admin-activities__grid">
            {activities.map((activity) => (
              <article className="admin-activities__card" key={activity.id}>
                <div className="admin-activities__preview">
                  {activity.mediaType === 'image' ? <img src={activity.src} alt={activity.title} loading="lazy" /> : <video src={activity.src} controls preload="metadata" playsInline aria-label={activity.title} />}
                </div>
                <div className="admin-activities__card-copy">
                  <div><strong>{activity.title}</strong><p>{activity.description || 'No description'}</p></div>
                  <button type="button" onClick={() => handleDelete(activity)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="admin-empty-state">No activities yet. This homepage section stays hidden until you upload the first image or video.</p>}
      </section>
    </div>
  )
}
