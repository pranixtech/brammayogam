import { useEffect, useRef, useState } from 'react'
import {
  deleteContribution,
  getContributions,
  notifyContributionsUpdated,
  uploadContribution,
} from '../../services/contributionsApi'

const MAX_CONTRIBUTIONS = 2

export function AdminContributionsManager() {
  const [contributions, setContributions] = useState([])
  const [quote, setQuote] = useState('')
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const fileInput = useRef(null)
  const isAtLimit = contributions.length >= MAX_CONTRIBUTIONS

  useEffect(() => {
    const controller = new AbortController()
    getContributions(controller.signal)
      .then((payload) => setContributions(payload.contributions))
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
    if (!file || !quote.trim() || isAtLimit) return
    if (file.size > 100 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Choose a file that is 100 MB or smaller.' })
      return
    }

    const formData = new FormData()
    formData.append('quote', quote.trim())
    formData.append('media', file)
    setIsUploading(true)
    setMessage({ type: '', text: '' })
    try {
      const { contribution } = await uploadContribution(formData)
      setContributions((current) => [...current, contribution])
      setQuote('')
      setFile(null)
      if (fileInput.current) fileInput.current.value = ''
      notifyContributionsUpdated()
      setMessage({ type: 'success', text: 'Annathanam contribution published on the homepage.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (contribution) => {
    if (!window.confirm('Delete this Annathanam contribution and its media file permanently?')) return
    setMessage({ type: '', text: '' })
    try {
      await deleteContribution(contribution.id)
      setContributions((current) => current.filter((item) => item.id !== contribution.id))
      notifyContributionsUpdated()
      setMessage({ type: 'success', text: 'Annathanam contribution deleted.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  return (
    <div className="admin-contributions">
      <form className="admin-upload" onSubmit={handleUpload}>
        <div className="admin-upload__heading">
          <div>
            <p className="section-kicker">Contribution section</p>
            <h2>Annathanam</h2>
          </div>
          <p>Publish up to two images or videos. Enter the quote that appears directly below each media item.</p>
        </div>

        {isAtLimit ? (
          <p className="admin-capacity-note">Both Annathanam slots are filled. Delete an existing item before uploading another.</p>
        ) : (
          <>
            <div className="admin-contributions__fields">
              <label className="admin-activities__field">
                <span>Quote below the media</span>
                <textarea
                  value={quote}
                  maxLength={1000}
                  rows={5}
                  required
                  placeholder="Enter the complete quote"
                  onChange={(event) => setQuote(event.target.value)}
                />
                <small>{quote.length}/1000 characters</small>
              </label>
              <label className="admin-activities__field admin-activities__file">
                <span>Image or video file</span>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  required
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                <small>JPG, PNG, WebP, MP4 or WebM · up to 100 MB · {MAX_CONTRIBUTIONS - contributions.length} slot{MAX_CONTRIBUTIONS - contributions.length === 1 ? '' : 's'} remaining</small>
              </label>
            </div>
            <button className="admin-button admin-button--primary" type="submit" disabled={isUploading || !file || !quote.trim()}>
              {isUploading ? 'Publishing…' : 'Publish contribution'}
            </button>
          </>
        )}
      </form>

      {message.text && <p className={`admin-message admin-message--${message.type}`} role="status">{message.text}</p>}

      <section className="admin-photo-list" aria-live="polite">
        <div className="admin-photo-list__heading">
          <h2>Published Annathanam items</h2>
          <span>{contributions.length} / {MAX_CONTRIBUTIONS}</span>
        </div>
        {isLoading ? <p className="admin-empty-state">Loading Annathanam contributions…</p> : contributions.length ? (
          <div className="admin-contributions__grid">
            {contributions.map((contribution) => (
              <article className="admin-contributions__card" key={contribution.id}>
                <div className="admin-contributions__preview">
                  {contribution.mediaType === 'image'
                    ? <img src={contribution.src} alt="Annathanam contribution" loading="lazy" />
                    : <video src={contribution.src} controls preload="metadata" playsInline aria-label="Annathanam contribution" />}
                </div>
                <div className="admin-contributions__card-copy">
                  <blockquote>{contribution.quote}</blockquote>
                  <button type="button" onClick={() => handleDelete(contribution)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="admin-empty-state">No Annathanam contribution has been published. The public section stays hidden until the first upload.</p>}
      </section>
    </div>
  )
}
