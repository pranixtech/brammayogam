import { useEffect, useRef, useState } from 'react'
import { AdminVideoManager } from '../components/admin/AdminVideoManager'
import { AdminSubmissionsPanel } from '../components/admin/AdminSubmissionsPanel'
import { MainLogo } from '../components/common/MainLogo'
import {
  createHomeVideo,
  createVideo,
  deleteGalleryPhoto,
  deleteHomeVideo,
  deleteVideo,
  getAdminSession,
  getGalleryPhotos,
  getHomeVideos,
  getVideos,
  loginAdmin,
  logoutAdmin,
  notifyGalleryUpdated,
  notifyHomeVideosUpdated,
  notifyVideosUpdated,
  uploadGalleryPhotos,
} from '../services/galleryApi'

const CATEGORIES = [
  { id: 'guru', label: 'Guru' },
  { id: 'online-classes', label: 'Online Classes' },
  { id: 'annathanam', label: 'Annathanam' },
  { id: 'others', label: 'Others' },
]

function LoginForm({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const payload = await loginAdmin(form)
      onLogin(payload.admin)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="admin-login">
      <section className="admin-login__card" aria-labelledby="admin-login-title">
        <MainLogo className="admin-login__logo" />
        <p className="section-kicker">Brahmam Foundation</p>
        <h1 id="admin-login-title">Site admin</h1>
        <p>Sign in to manage media, class registrations and feedback.</p>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            <span>Username</span>
            <input
              name="username"
              value={form.username}
              autoComplete="username"
              required
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              autoComplete="current-password"
              required
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>
          {error && <p className="admin-message admin-message--error" role="alert">{error}</p>}
          <button className="admin-button admin-button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </div>
  )
}

function AdminDashboard({ admin, onLogout }) {
  const [activeManager, setActiveManager] = useState('photos')
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id)
  const [photos, setPhotos] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [altText, setAltText] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    getGalleryPhotos(activeCategory, controller.signal)
      .then((payload) => setPhotos(payload.photos))
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setMessage({ type: 'error', text: requestError.message })
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [activeCategory])

  const handleUpload = async (event) => {
    event.preventDefault()
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    setMessage({ type: '', text: '' })
    const formData = new FormData()
    formData.append('categoryId', activeCategory)
    formData.append('altText', altText)
    selectedFiles.forEach((file) => formData.append('images', file))

    try {
      const payload = await uploadGalleryPhotos(formData)
      setPhotos((current) => [...payload.photos, ...current])
      notifyGalleryUpdated(activeCategory)
      setSelectedFiles([])
      setAltText('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setMessage({ type: 'success', text: `${payload.photos.length} photo${payload.photos.length === 1 ? '' : 's'} uploaded successfully.` })
    } catch (requestError) {
      setMessage({ type: 'error', text: requestError.message })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (photo) => {
    if (!window.confirm('Delete this photo permanently?')) return
    setMessage({ type: '', text: '' })
    try {
      await deleteGalleryPhoto(photo.id)
      setPhotos((current) => current.filter(({ id }) => id !== photo.id))
      notifyGalleryUpdated(activeCategory)
      setMessage({ type: 'success', text: 'Photo deleted.' })
    } catch (requestError) {
      setMessage({ type: 'error', text: requestError.message })
    }
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <a href="/" className="admin-dashboard__brand" aria-label="Return to Brahmam Foundation">
          <MainLogo />
          <span><strong>Brahmam Foundation</strong><small>Site administration</small></span>
        </a>
        <div className="admin-dashboard__account">
          <span>Signed in as {admin.username}</span>
          <button type="button" className="admin-button admin-button--quiet" onClick={onLogout}>Log out</button>
        </div>
      </header>

      <section className="admin-dashboard__content">
        <div className="admin-dashboard__intro">
          <div>
            <p className="section-kicker">Site administration</p>
            <h1>Manage the site</h1>
          </div>
        </div>

        <nav className="admin-main-tabs" aria-label="Site management">
          <button
            type="button"
            className={activeManager === 'photos' ? 'is-active' : ''}
            aria-pressed={activeManager === 'photos'}
            onClick={() => setActiveManager('photos')}
          >
            Photos
          </button>
          <button
            type="button"
            className={activeManager === 'youtube' ? 'is-active' : ''}
            aria-pressed={activeManager === 'youtube'}
            onClick={() => setActiveManager('youtube')}
          >
            Gallery Videos
          </button>
          <button
            type="button"
            className={activeManager === 'home-videos' ? 'is-active' : ''}
            aria-pressed={activeManager === 'home-videos'}
            onClick={() => setActiveManager('home-videos')}
          >
            Home Videos
          </button>
          <button
            type="button"
            className={activeManager === 'registrations' ? 'is-active' : ''}
            aria-pressed={activeManager === 'registrations'}
            onClick={() => setActiveManager('registrations')}
          >
            Registrations
          </button>
          <button
            type="button"
            className={activeManager === 'feedback' ? 'is-active' : ''}
            aria-pressed={activeManager === 'feedback'}
            onClick={() => setActiveManager('feedback')}
          >
            Feedback
          </button>
        </nav>

        {activeManager === 'photos' && <>
        <nav className="admin-category-tabs" aria-label="Photo categories">
          {CATEGORIES.map((category) => (
            <button
              type="button"
              className={category.id === activeCategory ? 'is-active' : ''}
              aria-pressed={category.id === activeCategory}
              key={category.id}
              onClick={() => {
                setIsLoading(true)
                setActiveCategory(category.id)
                setSelectedFiles([])
                setMessage({ type: '', text: '' })
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
            >
              {category.label}
            </button>
          ))}
        </nav>

        <form className="admin-upload" onSubmit={handleUpload}>
          <div className="admin-upload__heading">
            <div>
              <p className="section-kicker">Add new photos</p>
              <h2>{CATEGORIES.find(({ id }) => id === activeCategory)?.label}</h2>
            </div>
            <p>JPG, PNG or WebP. Up to 20 images at once, 10 MB each.</p>
          </div>
          <div className="admin-upload__fields">
            <label className="admin-file-picker">
              <span>{selectedFiles.length > 0 ? `${selectedFiles.length} image${selectedFiles.length === 1 ? '' : 's'} selected` : 'Choose images'}</span>
              <input
                ref={fileInputRef}
                type="file"
                name="images"
                accept="image/jpeg,image/png,image/webp"
                multiple
                required
                onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
              />
            </label>
            <label className="admin-alt-field">
              <span>Image description <small>(optional)</small></span>
              <input
                value={altText}
                maxLength="240"
                placeholder="Describe the moment for accessibility"
                onChange={(event) => setAltText(event.target.value)}
              />
            </label>
            <button className="admin-button admin-button--primary" type="submit" disabled={isUploading || selectedFiles.length === 0}>
              {isUploading ? 'Uploading…' : 'Upload photos'}
            </button>
          </div>
        </form>

        {message.text && <p className={`admin-message admin-message--${message.type}`} role="status">{message.text}</p>}

        <section className="admin-photo-list" aria-live="polite">
          <div className="admin-photo-list__heading">
            <h2>Uploaded photos</h2>
            <span>{photos.length} total</span>
          </div>
          {isLoading ? (
            <p className="admin-empty-state">Loading photos…</p>
          ) : photos.length > 0 ? (
            <div className="admin-photo-grid">
              {photos.map((photo) => (
                <article className="admin-photo-card" key={photo.id}>
                  <img src={photo.src} alt={photo.alt} loading="lazy" />
                  <div>
                    <p>{photo.alt}</p>
                    <button type="button" onClick={() => handleDelete(photo)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="admin-empty-state">No admin-uploaded photos in this category yet.</p>
          )}
        </section>
        </>}

        {activeManager === 'youtube' && (
          <AdminVideoManager
            sectionId="admin-videos-title"
            kicker="Video gallery"
            heading="Add gallery video"
            description="Paste an individual YouTube video, Short, Live or youtu.be link. These videos appear only in the public video gallery."
            emptyMessage="No gallery videos have been added yet."
            loadVideos={getVideos}
            addVideo={createVideo}
            removeVideo={deleteVideo}
            notifyUpdated={notifyVideosUpdated}
            deleteConfirmation="Remove this video from the gallery?"
          />
        )}

        {activeManager === 'home-videos' && (
          <AdminVideoManager
            sectionId="admin-home-videos-title"
            kicker="Homepage feature"
            heading="Add homepage video"
            description="Add up to four YouTube videos shown directly below the homepage quote. This list is separate from the video gallery."
            emptyMessage="No homepage videos have been added yet."
            limit={4}
            loadVideos={getHomeVideos}
            addVideo={createHomeVideo}
            removeVideo={deleteHomeVideo}
            notifyUpdated={notifyHomeVideosUpdated}
            deleteConfirmation="Remove this video from the homepage?"
          />
        )}

        {activeManager === 'registrations' && <AdminSubmissionsPanel kind="registrations" />}
        {activeManager === 'feedback' && <AdminSubmissionsPanel kind="feedback" />}
      </section>
    </div>
  )
}

export function AdminPage() {
  const [admin, setAdmin] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    getAdminSession()
      .then((payload) => setAdmin(payload.admin))
      .catch(() => setAdmin(null))
      .finally(() => setIsCheckingSession(false))
  }, [])

  const handleLogout = async () => {
    await logoutAdmin().catch(() => undefined)
    setAdmin(null)
  }

  if (isCheckingSession) return <div className="admin-loading">Loading administration…</div>
  if (!admin) return <LoginForm onLogin={setAdmin} />
  return <AdminDashboard admin={admin} onLogout={handleLogout} />
}
