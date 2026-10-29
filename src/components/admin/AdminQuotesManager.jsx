import { useEffect, useMemo, useRef, useState } from 'react'
import {
  deleteQuoteImage,
  getQuoteImage,
  notifyQuoteImageUpdated,
  uploadQuoteImage,
} from '../../services/guruContentApi'

export function AdminQuotesManager() {
  const [quoteImage, setQuoteImage] = useState(null)
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const fileInput = useRef(null)
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])

  useEffect(() => {
    const controller = new AbortController()
    getQuoteImage(controller.signal)
      .then((payload) => setQuoteImage(payload.quoteImage))
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
    if (!file) return
    const formData = new FormData()
    formData.append('image', file)
    setIsUploading(true)
    setMessage({ type: '', text: '' })
    try {
      const payload = await uploadQuoteImage(formData)
      setQuoteImage(payload.quoteImage)
      setFile(null)
      if (fileInput.current) fileInput.current.value = ''
      notifyQuoteImageUpdated()
      setMessage({ type: 'success', text: quoteImage ? 'Quote image replaced.' : 'Quote image published.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!quoteImage || !window.confirm('Delete the published quote image permanently?')) return
    setMessage({ type: '', text: '' })
    try {
      await deleteQuoteImage(quoteImage.id)
      setQuoteImage(null)
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
          <p>Upload one quote image. A new upload replaces the currently published image.</p>
        </div>
        <div className="admin-upload__fields">
          <label className="admin-file-picker">
            <span>{file ? file.name : quoteImage ? 'Choose replacement image' : 'Choose quote image'}</span>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </label>
          <p className="admin-ads__guidance">JPG, PNG or WebP · up to 10 MB</p>
          <button className="admin-button admin-button--primary" type="submit" disabled={isUploading || !file}>
            {isUploading ? 'Uploading…' : quoteImage ? 'Replace image' : 'Publish image'}
          </button>
        </div>
        {previewUrl && <figure className="admin-class-preview admin-quote-preview"><img src={previewUrl} alt="Selected quote preview" /><figcaption><strong>Preview</strong><span>{file.name}</span></figcaption></figure>}
      </form>

      {message.text && <p className={`admin-message admin-message--${message.type}`} role="status">{message.text}</p>}

      <section className="admin-photo-list" aria-live="polite">
        <div className="admin-photo-list__heading"><h2>Published quote image</h2><span>{quoteImage ? '1 / 1' : '0 / 1'}</span></div>
        {isLoading ? <p className="admin-empty-state">Loading quote image…</p> : quoteImage ? (
          <article className="admin-classes__card admin-quote-card">
            <img src={quoteImage.image} alt="Published quote" />
            <div><strong>Quotes</strong><button type="button" onClick={handleDelete}>Delete</button></div>
          </article>
        ) : <p className="admin-empty-state">No quote image is published. The public Quotes section stays hidden.</p>}
      </section>
    </div>
  )
}
