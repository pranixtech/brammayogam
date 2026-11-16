import { useEffect, useMemo, useState } from 'react'
import {
  getAdminDonationSettings,
  notifyDonationSettingsUpdated,
  updateDonationSettings,
  uploadDonationQr,
} from '../../services/donationsApi'

const EMPTY_SETTINGS = {
  organizationName: '', upiId: '', bankName: '', accountName: '',
  accountNumber: '', ifsc: '', branch: '', accountType: '', qrImage: null,
}

export function AdminBankDetailsManager() {
  const [settings, setSettings] = useState(EMPTY_SETTINGS)
  const [qrFile, setQrFile] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingQr, setIsUploadingQr] = useState(false)
  const qrPreview = useMemo(() => (qrFile ? URL.createObjectURL(qrFile) : ''), [qrFile])

  useEffect(() => {
    const controller = new AbortController()
    getAdminDonationSettings(controller.signal)
      .then(({ settings: nextSettings }) => setSettings(nextSettings))
      .catch((error) => {
        if (error.name !== 'AbortError') setMessage({ type: 'error', text: error.message })
      })
    return () => controller.abort()
  }, [])

  useEffect(() => () => {
    if (qrPreview) URL.revokeObjectURL(qrPreview)
  }, [qrPreview])

  const updateSetting = (event) => {
    const { name, value } = event.target
    setSettings((current) => ({ ...current, [name]: value }))
  }

  const saveSettings = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const payload = await updateDonationSettings(settings)
      setSettings(payload.settings)
      notifyDonationSettingsUpdated()
      setMessage({ type: 'success', text: 'Bank and UPI details saved.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  const uploadQr = async (event) => {
    event.preventDefault()
    if (!qrFile) return
    const formElement = event.currentTarget
    setIsUploadingQr(true)
    setMessage({ type: '', text: '' })
    try {
      const payload = await uploadDonationQr(qrFile)
      setSettings(payload.settings)
      setQrFile(null)
      formElement.reset()
      notifyDonationSettingsUpdated()
      setMessage({ type: 'success', text: 'Payment QR image updated. Donation and class registration now use this QR.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsUploadingQr(false)
    }
  }

  return (
    <div className="admin-bank-details">
      <form className="admin-upload admin-payment-qr" onSubmit={uploadQr}>
        <div className="admin-upload__heading">
          <div><p className="section-kicker">Shared payment image</p><h2>Payment QR Code</h2></div>
          <p>This QR is shown in both Annathanam donations and upcoming-class registration.</p>
        </div>
        <div className="admin-payment-qr__layout">
          <div className="admin-payment-qr__preview">
            {qrPreview || settings.qrImage
              ? <img src={qrPreview || settings.qrImage} alt="Current payment QR" />
              : <span>No custom QR uploaded. The built-in QR remains active.</span>}
          </div>
          <div className="admin-payment-qr__controls">
            <label className="admin-file-picker">
              <span>{qrFile ? qrFile.name : 'Choose QR image'}</span>
              <input type="file" name="qrImage" accept="image/jpeg,image/png,image/webp" required onChange={(event) => setQrFile(event.target.files?.[0] ?? null)} />
            </label>
            <small>JPG, PNG or WebP · maximum 10 MB. The selected image preview appears before upload.</small>
            <button className="admin-button admin-button--primary" type="submit" disabled={!qrFile || isUploadingQr}>{isUploadingQr ? 'Uploading…' : 'Upload payment QR'}</button>
          </div>
        </div>
      </form>

      <form className="admin-upload admin-donation-settings" onSubmit={saveSettings}>
        <div className="admin-upload__heading">
          <div><p className="section-kicker">Direct payment configuration</p><h2>Bank Details</h2></div>
          <p>These details are shared by the donation and class-registration payment screens.</p>
        </div>
        <div className="admin-donation-settings__grid">
          <label><span>Organization name</span><input name="organizationName" value={settings.organizationName} maxLength={160} required onChange={updateSetting} /></label>
          <label><span>UPI ID</span><input name="upiId" value={settings.upiId} maxLength={160} required onChange={updateSetting} /></label>
          <label><span>Account name</span><input name="accountName" value={settings.accountName} maxLength={160} required onChange={updateSetting} /></label>
          <label><span>Bank name</span><input name="bankName" value={settings.bankName} maxLength={160} required onChange={updateSetting} /></label>
          <label><span>Account number</span><input name="accountNumber" value={settings.accountNumber} maxLength={34} required onChange={updateSetting} /></label>
          <label><span>IFSC</span><input name="ifsc" value={settings.ifsc} maxLength={20} required onChange={updateSetting} /></label>
          <label><span>Branch</span><input name="branch" value={settings.branch} maxLength={160} required onChange={updateSetting} /></label>
          <label><span>Account type</span><input name="accountType" value={settings.accountType} maxLength={80} placeholder="Savings / Current" onChange={updateSetting} /></label>
        </div>
        <button className="admin-button admin-button--primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save bank details'}</button>
      </form>

      {message.text && <p className={`admin-message admin-message--${message.type}`} role="status">{message.text}</p>}
    </div>
  )
}
