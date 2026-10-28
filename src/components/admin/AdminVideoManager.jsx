import { useEffect, useState } from 'react'

export function AdminVideoManager({
  addVideo,
  deleteConfirmation,
  description,
  emptyMessage,
  heading,
  kicker,
  limit,
  loadVideos,
  notifyUpdated,
  removeVideo,
  sectionId,
}) {
  const [videos, setVideos] = useState([])
  const [form, setForm] = useState({ title: '', url: '' })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isAtLimit = Number.isInteger(limit) && videos.length >= limit

  useEffect(() => {
    const controller = new AbortController()
    loadVideos(controller.signal)
      .then((payload) => setVideos(payload.videos))
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setMessage({ type: 'error', text: requestError.message })
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [loadVideos])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage({ type: '', text: '' })
    setIsSubmitting(true)
    try {
      const payload = await addVideo(form)
      setVideos((current) => [payload.video, ...current])
      setForm({ title: '', url: '' })
      notifyUpdated()
      setMessage({ type: 'success', text: 'YouTube video added successfully.' })
    } catch (requestError) {
      setMessage({ type: 'error', text: requestError.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (video) => {
    if (!window.confirm(deleteConfirmation)) return
    setMessage({ type: '', text: '' })
    try {
      await removeVideo(video.id)
      setVideos((current) => current.filter(({ id }) => id !== video.id))
      notifyUpdated()
      setMessage({ type: 'success', text: 'Video removed.' })
    } catch (requestError) {
      setMessage({ type: 'error', text: requestError.message })
    }
  }

  return (
    <section className="admin-video-manager" aria-labelledby={sectionId}>
      <form className="admin-upload" onSubmit={handleSubmit}>
        <div className="admin-upload__heading">
          <div>
            <p className="section-kicker">{kicker}</p>
            <h2 id={sectionId}>{heading}</h2>
          </div>
          <p>{description}</p>
        </div>
        <div className="admin-video-fields">
          <label className="admin-alt-field">
            <span>Video title</span>
            <input
              value={form.title}
              maxLength="160"
              placeholder="Enter the title shown with the video"
              required
              disabled={isAtLimit}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
          </label>
          <label className="admin-alt-field">
            <span>YouTube link</span>
            <input
              type="url"
              value={form.url}
              placeholder="https://www.youtube.com/watch?v=..."
              required
              disabled={isAtLimit}
              onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
            />
          </label>
          <button className="admin-button admin-button--primary" type="submit" disabled={isSubmitting || isAtLimit}>
            {isSubmitting ? 'Adding…' : isAtLimit ? 'Limit reached' : 'Add video'}
          </button>
        </div>
      </form>

      {message.text && <p className={`admin-message admin-message--${message.type}`} role="status">{message.text}</p>}

      <div className="admin-photo-list">
        <div className="admin-photo-list__heading">
          <h2>Uploaded videos</h2>
          <span>{videos.length}{Number.isInteger(limit) ? ` / ${limit}` : ''}</span>
        </div>
        {isLoading ? (
          <p className="admin-empty-state">Loading videos…</p>
        ) : videos.length > 0 ? (
          <div className="admin-video-grid">
            {videos.map((video) => (
              <article className="admin-video-card" key={video.id}>
                <img src={video.thumbnail} alt="" loading="lazy" />
                <div>
                  <p>{video.title}</p>
                  <button type="button" onClick={() => handleDelete(video)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-empty-state">{emptyMessage}</p>
        )}
      </div>
    </section>
  )
}
