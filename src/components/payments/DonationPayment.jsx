import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../i18n/useLanguage'
import {
  getDonationSettings,
  submitDonation,
  subscribeToDonationSettings,
} from '../../services/donationsApi'

const SUGGESTED_AMOUNTS = [100, 500, 1000, 5000]
const EMPTY_FORM = {
  donorName: '', email: '', phone: '', amount: '', paymentMethod: 'UPI',
  utrNumber: '', message: '', consent: false,
}

export function DonationPayment() {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState(null)
  const [method, setMethod] = useState('UPI')
  const [amount, setAmount] = useState('500')
  const [customAmount, setCustomAmount] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState({ type: '', text: '' })
  const [copyMessage, setCopyMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const numericAmount = Number(amount)
  const validAmount = Number.isFinite(numericAmount) && numericAmount >= 1 && numericAmount <= 500000
  const upiLink = useMemo(() => {
    if (!settings) return ''
    const parameters = new URLSearchParams({ pa: settings.upiId, pn: settings.organizationName, cu: 'INR' })
    if (validAmount) parameters.set('am', numericAmount.toFixed(2))
    return `upi://pay?${parameters.toString()}`
  }, [numericAmount, settings, validAmount])

  useEffect(() => {
    let controller
    const loadSettings = () => {
      controller?.abort()
      controller = new AbortController()
      getDonationSettings(controller.signal)
        .then(({ settings: nextSettings }) => setSettings(nextSettings))
        .catch((error) => {
          if (error.name !== 'AbortError') setStatus({ type: 'error', text: t('donation.settingsError') })
        })
    }
    loadSettings()
    const unsubscribe = subscribeToDonationSettings(loadSettings)
    return () => { controller?.abort(); unsubscribe() }
  }, [t])

  useEffect(() => {
    let active = true
    if (!upiLink) return undefined
    import('qrcode')
      .then(({ default: QRCode }) => QRCode.toDataURL(upiLink, { width: 360, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#3b211b', light: '#fffdf8' } }))
      .then((url) => { if (active) setQrDataUrl(url) })
      .catch(() => { if (active) setQrDataUrl('') })
    return () => { active = false }
  }, [upiLink])

  useEffect(() => {
    if (!isOpen) {
      document.body.classList.remove('payment-modal-open')
      return undefined
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) setIsOpen(false)
    }
    document.body.classList.add('payment-modal-open')
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.classList.remove('payment-modal-open')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isSubmitting])

  const selectAmount = (value) => {
    setCustomAmount(value === 'custom')
    if (value !== 'custom') setAmount(String(value))
  }

  const copyValue = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopyMessage(`${label} ${t('donation.copied')}`)
    } catch {
      setCopyMessage(t('donation.copyError'))
    }
    window.setTimeout(() => setCopyMessage(''), 1800)
  }

  const openConfirmation = () => {
    if (!validAmount) {
      setStatus({ type: 'error', text: t('donation.amountError') })
      return
    }
    setStatus({ type: '', text: '' })
    setForm((current) => ({ ...current, amount: numericAmount, paymentMethod: method }))
    setShowConfirmation(true)
  }

  const updateField = (event) => {
    const { name, type, checked, value } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus({ type: '', text: '' })
    try {
      await submitDonation({ ...form, amount: Number(form.amount), consent: form.consent })
      setForm(EMPTY_FORM)
      setShowConfirmation(false)
      setStatus({ type: 'success', text: t('donation.success') })
    } catch (error) {
      setStatus({ type: 'error', text: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeDialog = () => {
    if (isSubmitting) return
    setIsOpen(false)
    setShowConfirmation(false)
    setStatus({ type: '', text: '' })
  }

  return (
    <section className="donation-payment" aria-label={t('donation.title')}>
      <button className="annathanam-payment__trigger" type="button" onClick={() => setIsOpen(true)}>{t('donation.donateNow')}</button>

      {isOpen && createPortal(
        <div className="donation-payment__backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog() }}>
          <div className="donation-payment__dialog" role="dialog" aria-modal="true" aria-labelledby="donation-payment-title">
            <button className="donation-payment__close" type="button" aria-label={t('donation.close')} onClick={closeDialog}>×</button>
            <header className="donation-payment__intro">
              <p className="section-kicker">{t('donation.kicker')}</p>
              <h3 id="donation-payment-title">{t('donation.title')}</h3>
              <p>{t('donation.description')}</p>
            </header>

            {!showConfirmation ? (
              <div className="donation-payment__content">
                <section className="donation-amount" aria-labelledby="donation-amount-title">
                  <h4 id="donation-amount-title">{t('donation.selectAmount')}</h4>
                  <div className="donation-amount__options">
                    {SUGGESTED_AMOUNTS.map((value) => <button className={!customAmount && numericAmount === value ? 'is-active' : ''} type="button" key={value} onClick={() => selectAmount(value)}>₹{value.toLocaleString('en-IN')}</button>)}
                    <button className={customAmount ? 'is-active' : ''} type="button" onClick={() => selectAmount('custom')}>{t('donation.customAmount')}</button>
                  </div>
                  {customAmount && <label className="donation-amount__custom"><span>{t('donation.amount')}</span><div><b>₹</b><input type="number" min="1" max="500000" step="0.01" inputMode="decimal" value={amount} autoFocus onChange={(event) => setAmount(event.target.value)} /></div></label>}
                </section>

                <div className="donation-method-tabs" role="tablist" aria-label={t('donation.chooseMethod')}>
                  <button className={method === 'UPI' ? 'is-active' : ''} type="button" role="tab" aria-selected={method === 'UPI'} onClick={() => setMethod('UPI')}>{t('donation.upi')}</button>
                  <button className={method === 'BANK_TRANSFER' ? 'is-active' : ''} type="button" role="tab" aria-selected={method === 'BANK_TRANSFER'} onClick={() => setMethod('BANK_TRANSFER')}>{t('donation.bankTransfer')}</button>
                </div>

                {!settings ? <p className="donation-payment__notice">{t('donation.loading')}</p> : method === 'UPI' ? (
                  <section className="donation-upi" role="tabpanel">
                    <div className="donation-upi__qr">{upiLink && qrDataUrl ? <img src={qrDataUrl} alt={t('donation.qrAlt')} /> : <div className="donation-upi__qr-placeholder">QR</div>}</div>
                    <div className="donation-upi__details">
                      <h4>{settings.organizationName}</h4>
                      <p>{t('donation.scanQr')}</p>
                      <div className="donation-copy-row"><code>{settings.upiId}</code><button type="button" onClick={() => copyValue(settings.upiId, 'UPI ID')}>{t('donation.copyUpi')}</button></div>
                      <a className="donation-upi__open" href={upiLink}>{t('donation.openUpi')}</a>
                      <small>{t('donation.noAutoVerification')}</small>
                    </div>
                  </section>
                ) : (
                  <section className="donation-bank" role="tabpanel">
                    <h4>{t('donation.bankDetails')}</h4>
                    <dl>
                      <div><dt>{t('donation.accountName')}</dt><dd>{settings.accountName}</dd></div>
                      <div><dt>{t('donation.bankName')}</dt><dd>{settings.bankName}</dd></div>
                      <div><dt>{t('donation.accountNumber')}</dt><dd><span>{settings.accountNumber}</span><button type="button" onClick={() => copyValue(settings.accountNumber, t('donation.accountNumber'))}>{t('donation.copy')}</button></dd></div>
                      <div><dt>{t('donation.ifsc')}</dt><dd><span>{settings.ifsc}</span><button type="button" onClick={() => copyValue(settings.ifsc, 'IFSC')}>{t('donation.copy')}</button></dd></div>
                      <div><dt>{t('donation.branch')}</dt><dd>{settings.branch}</dd></div>
                      {settings.accountType && <div><dt>{t('donation.accountType')}</dt><dd>{settings.accountType}</dd></div>}
                    </dl>
                  </section>
                )}

                {copyMessage && <p className="donation-payment__copy-status" role="status">{copyMessage}</p>}
                <button className="donation-payment__completed" type="button" disabled={!settings} onClick={openConfirmation}>{method === 'UPI' ? t('donation.completedUpi') : t('donation.completedBank')}</button>
                <p className="donation-payment__pending-note">{t('donation.pendingNote')}</p>
              </div>
            ) : (
              <form className="donation-confirmation" onSubmit={handleSubmit}>
                <div className="donation-confirmation__summary"><strong>₹{Number(form.amount).toLocaleString('en-IN')}</strong><span>{form.paymentMethod === 'UPI' ? t('donation.upi') : t('donation.bankTransfer')}</span></div>
                <label><span>{t('donation.donorName')} *</span><input name="donorName" value={form.donorName} maxLength={100} autoComplete="name" required onChange={updateField} /></label>
                <label><span>{t('donation.email')} *</span><input name="email" type="email" value={form.email} maxLength={254} autoComplete="email" required onChange={updateField} /></label>
                <label><span>{t('donation.phone')} *</span><input name="phone" type="tel" value={form.phone} maxLength={18} autoComplete="tel" placeholder="+91 98765 43210" required onChange={updateField} /></label>
                <label><span>{t('donation.utr')} *</span><input name="utrNumber" value={form.utrNumber} minLength={6} maxLength={50} autoComplete="off" required onChange={updateField} /><small>{t('donation.utrHelp')}</small></label>
                <label className="is-wide"><span>{t('donation.message')}</span><textarea name="message" value={form.message} maxLength={1000} rows={4} onChange={updateField} /></label>
                <label className="donation-confirmation__consent is-wide"><input name="consent" type="checkbox" checked={form.consent} required onChange={updateField} /><span>{t('donation.consent')}</span></label>
                <div className="donation-confirmation__actions is-wide"><button className="is-back" type="button" disabled={isSubmitting} onClick={() => setShowConfirmation(false)}>{t('donation.back')}</button><button type="submit" disabled={isSubmitting}>{isSubmitting ? t('donation.submitting') : t('donation.submit')}</button></div>
              </form>
            )}

            {status.text && <p className={`donation-payment__status is-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.text}</p>}
          </div>
        </div>,
        document.body,
      )}
    </section>
  )
}
