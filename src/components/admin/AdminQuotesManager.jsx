import { useEffect, useMemo, useRef, useState } from 'react'
import {
  deleteQuoteImage,
  getQuoteImage,
  notifyQuoteImageUpdated,
  uploadQuoteImage,
} from '../../services/guruContentApi'

const MAX_QUOTE_IMAGES = 10

export function AdminQuotesManager() {
  const [quoteImages, setQuoteImages] = useState([])
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const fileInput = useRef(null)
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])
  const isAtLimit = quoteImages.length >= MAX_QUOTE_IMAGES

  useEffect(() => {
    const controller = new AbortController()
    getQuoteImage(controller.signal)
      .then((payload) => setQuoteImages(payload.quoteImages ?? (payload.quoteImage ? [payload.quoteImage] : [])))
      .catch((error) => {
        if (error.name !== 'AbortError') setMessage({ type: 'error', text: error.message })
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const handleUpload = async (event) => {
    event.preventDefault()
    if (!file || isAtLimit) return
    const formData = new FormData()
    formData.append('image', file)
    setIsUploading(true)
    setMessage({ type: '', text: '' })
    try {
      const payload = await uploadQuoteImage(formData)
      setQuoteImages((current) => [...current, payload.quoteImage])
      setFile(null)
      if (fileInput.current) fileInput.current.value = ''
      notifyQuoteImageUpdated()
      setMessage({ type: 'success', text: 'Quote image added to the homepage carousel.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (quoteImage) => {
    if (!window.confirm('Delete this published quote image permanently?')) return
    setMessage({ type: '', text: '' })
    try {
      await deleteQuoteImage(quoteImage.id)
      setQuoteImages((current) => current.filter((item) => item.id !== quoteImage.id))
      notifyQuoteImageUpdated()
      setMessage({ type: 'success', text: 'Quote image deleted.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  return (
    <div className="admin-quotes">
      <form className="admin-upload" onSubmit={handleUpload}>
        <div className="admin-upload__heading">
          <div><p className="section-kicker">Homepage image</p><h2>Quotes</h2></div>
          <p>Upload up to ten quote images for the homepage carousel.</p>
        </div>
        {isAtLimit ? (
          <p className="admin-capacity-note">All ten quote carousel slots are filled. Delete an image before uploading another.</p>
        ) : (
          <>
            <div className="admin-upload__fields">
              <label className="admin-file-picker">
                <span>{file ? file.name : 'Choose quote image'}</span>
                <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              </label>
              <p className="admin-ads__guidance">JPG, PNG or WebP · up to 10 MB · {MAX_QUOTE_IMAGES - quoteImages.length} slot{MAX_QUOTE_IMAGES - quoteImages.length === 1 ? '' : 's'} remaining</p>
              <button className="admin-button admin-button--primary" type="submit" disabled={isUploading || !file}>
                {isUploading ? 'Uploading…' : 'Add to carousel'}
              </button>
            </div>
            {previewUrl && <figure className="admin-class-preview admin-quote-preview"><img src={previewUrl} alt="Selected quote preview" /><figcaption><strong>Preview</strong><span>{file.name}</span></figcaption></figure>}
          </>
        )}
      </form>

      {message.text && <p className={`admin-message admin-message--${message.type}`} role="status">{message.text}</p>}

      <section className="admin-photo-list" aria-live="polite">
        <div className="admin-photo-list__heading"><h2>Published quote images</h2><span>{quoteImages.length} / {MAX_QUOTE_IMAGES}</span></div>
        {isLoading ? <p className="admin-empty-state">Loading quote images…</p> : quoteImages.length ? (
          <div className="admin-quotes__grid">
            {quoteImages.map((quoteImage, index) => (
              <article className="admin-classes__card admin-quote-card" key={quoteImage.id}>
                <img src={quoteImage.image} alt={`Published quote ${index + 1}`} />
                <div><strong>Quote {index + 1}</strong><button type="button" onClick={() => handleDelete(quoteImage)}>Delete</button></div>
              </article>
            ))}
          </div>
        ) : <p className="admin-empty-state">No quote images are published. The public Quotes section stays hidden.</p>}
      </section>
    </div>
  )
}
