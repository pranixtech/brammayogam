import { useEffect, useMemo, useRef, useState } from 'react'
import { deleteAd, getAds, notifyAdsUpdated, uploadAds } from '../../services/adsApi'

const MAX_ADS = 5

export function AdminAdsManager() {
  const [ads, setAds] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const fileInput = useRef(null)
  const previewItems = useMemo(
    () => selectedFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [selectedFiles],
  )

  useEffect(() => {
    const controller = new AbortController()
    getAds(controller.signal)
      .then((payload) => setAds(payload.ads))
      .catch((error) => {
        if (error.name !== 'AbortError') setMessage({ type: 'error', text: error.message })
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    return () => previewItems.forEach(({ url }) => URL.revokeObjectURL(url))
  }, [previewItems])

  const resetSelection = () => {
    setSelectedFiles([])
    if (fileInput.current) fileInput.current.value = ''
  }

  const handleFiles = (event) => {
    const files = Array.from(event.target.files ?? [])
    const availableSlots = MAX_ADS - ads.length
    if (files.length > availableSlots) {
      setMessage({
        type: 'error',
        text: availableSlots > 0
          ? `You can select only ${availableSlots} more ad image${availableSlots === 1 ? '' : 's'}.`
          : 'All 5 ad slots are filled. Delete one before uploading another.',
      })
      setSelectedFiles(files.slice(0, availableSlots))
      return
    }
    setMessage({ type: '', text: '' })
    setSelectedFiles(files)
  }

  const handleUpload = async (event) => {
    event.preventDefault()
    if (!selectedFiles.length || ads.length + selectedFiles.length > MAX_ADS) return
    const formData = new FormData()
    selectedFiles.forEach((file) => formData.append('images', file))
    setIsUploading(true)
    setMessage({ type: '', text: '' })
    try {
      const payload = await uploadAds(formData)
      setAds((current) => [...current, ...payload.ads])
      resetSelection()
      notifyAdsUpdated()
      setMessage({ type: 'success', text: `${payload.ads.length} ad image${payload.ads.length === 1 ? '' : 's'} uploaded.` })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (ad) => {
    if (!window.confirm('Delete this ad image permanently?')) return
    setMessage({ type: '', text: '' })
    try {
      await deleteAd(ad.id)
      setAds((current) => current.filter(({ id }) => id !== ad.id))
      notifyAdsUpdated()
      setMessage({ type: 'success', text: 'Ad image deleted.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const limitReached = ads.length >= MAX_ADS
  return (
    <div className="admin-ads">
      <form className="admin-upload" onSubmit={handleUpload}>
        <div className="admin-upload__heading">
          <div>
            <p className="section-kicker">Homepage promotion</p>
            <h2>Ads</h2>
          </div>
          <p>Upload up to 5 images. Only these images appear in the homepage ads slider.</p>
        </div>

        {limitReached && <p className="admin-capacity-note">All 5 ad slots are filled. Delete one before uploading another.</p>}

        <div className="admin-upload__fields">
          <label className="admin-file-picker">
            <span>{selectedFiles.length ? `${selectedFiles.length} image${selectedFiles.length === 1 ? '' : 's'} selected` : 'Choose ad images'}</span>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={limitReached}
              onChange={handleFiles}
            />
          </label>
          <p className="admin-ads__guidance">JPG, PNG or WebP · up to 10 MB each · 16:9 images work best</p>
          <button className="admin-button admin-button--primary" type="submit" disabled={isUploading || limitReached || !selectedFiles.length}>
            {isUploading ? 'Uploading…' : 'Upload ads'}
          </button>
        </div>

        {previewItems.length > 0 && (
          <div className="admin-ad-previews" aria-label="Selected ad previews">
            {previewItems.map(({ file, url }) => (
              <figure className="admin-class-preview" key={`${file.name}-${file.lastModified}`}>
                <img src={url} alt="Selected ad preview" />
                <figcaption>
                  <strong>Preview</strong>
                  <span>{file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </form>

      {message.text && <p className={`admin-message admin-message--${message.type}`} role="status">{message.text}</p>}

      <section className="admin-photo-list" aria-live="polite">
        <div className="admin-photo-list__heading"><h2>Published ads</h2><span>{ads.length} / {MAX_ADS}</span></div>
        {isLoading ? <p className="admin-empty-state">Loading ads…</p> : ads.length ? (
          <div className="admin-classes__grid">
            {ads.map((ad, index) => (
              <article className="admin-classes__card" key={ad.id}>
                <img src={ad.image} alt={`Homepage ad ${index + 1}`} loading="lazy" />
                <div><strong>Ad {index + 1}</strong><button type="button" onClick={() => handleDelete(ad)}>Delete</button></div>
              </article>
            ))}
          </div>
        ) : <p className="admin-empty-state">No ads yet. The homepage ads section stays hidden until an image is uploaded.</p>}
      </section>
    </div>
  )
}
