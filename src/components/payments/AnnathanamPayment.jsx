import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../i18n/useLanguage'
import { createPaymentOrder, getPaymentOrder } from '../../services/paymentsApi'

const CASHFREE_SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js'
const EMPTY_FORM = { amount: '', name: '', phone: '', email: '' }
let sdkPromise

function loadCashfreeSdk() {
  if (window.Cashfree) return Promise.resolve(window.Cashfree)
  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${CASHFREE_SDK_URL}"]`)
    const script = existingScript ?? document.createElement('script')
    script.addEventListener('load', () => resolve(window.Cashfree), { once: true })
    script.addEventListener('error', () => reject(new Error('Unable to load Cashfree checkout.')), { once: true })
    if (!existingScript) {
      script.src = CASHFREE_SDK_URL
      script.async = true
      document.head.appendChild(script)
    }
  })
  return sdkPromise
}

export function AnnathanamPayment() {
  const { language, t } = useLanguage()
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState({ type: '', text: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(() => new URL(window.location.href).searchParams.has('cashfree_order_id'))

  const verifyOrder = async (orderId) => {
    setIsSubmitting(true)
    setStatus({ type: 'pending', text: t('payment.verifying') })
    try {
      const order = await getPaymentOrder(orderId)
      if (order.status === 'PAID') {
        setStatus({ type: 'success', text: t('payment.success') })
        setForm(EMPTY_FORM)
      } else {
        setStatus({ type: 'pending', text: t('payment.pending') })
      }
    } catch {
      setStatus({ type: 'error', text: t('payment.verifyError') })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const url = new URL(window.location.href)
    const orderId = url.searchParams.get('cashfree_order_id')
    if (!orderId) return undefined
    url.searchParams.delete('cashfree_order_id')
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
    let isActive = true
    getPaymentOrder(orderId)
      .then((order) => {
        if (!isActive) return
        if (order.status === 'PAID') {
          setStatus({ type: 'success', text: t('payment.success') })
          setForm(EMPTY_FORM)
        } else {
          setStatus({ type: 'pending', text: t('payment.pending') })
        }
      })
      .catch(() => {
        if (isActive) setStatus({ type: 'error', text: t('payment.verifyError') })
      })
    return () => { isActive = false }
  }, [t])

  useEffect(() => {
    document.body.style.removeProperty('overflow')
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

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus({ type: 'pending', text: t('payment.creating') })

    try {
      const [Cashfree, order] = await Promise.all([
        loadCashfreeSdk(),
        createPaymentOrder({ ...form, amount: Number(form.amount) }),
      ])
      if (!Cashfree) throw new Error('Cashfree checkout is unavailable.')

      const cashfree = Cashfree({ mode: order.mode })
      const result = await cashfree.checkout({
        paymentSessionId: order.paymentSessionId,
        redirectTarget: '_modal',
      })

      if (result?.redirect) {
        setStatus({ type: 'pending', text: t('payment.redirecting') })
        return
      }
      await verifyOrder(order.orderId)
    } catch (error) {
      const isNotConfigured = /not configured/i.test(error.message)
      setStatus({ type: 'error', text: isNotConfigured ? t('payment.notConfigured') : t('payment.error') })
      setIsSubmitting(false)
    }
  }

  return (
    <section className="annathanam-payment" aria-label={t('payment.title')}>
      <button className="annathanam-payment__trigger" type="button" onClick={() => setIsOpen(true)}>
        {t('payment.donate')}
      </button>

      {isOpen && createPortal(
        <div className="annathanam-payment__backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSubmitting) setIsOpen(false)
        }}>
          <div className="annathanam-payment__dialog" role="dialog" aria-modal="true" aria-labelledby="annathanam-payment-title">
            <button className="annathanam-payment__close" type="button" aria-label={t('payment.close')} disabled={isSubmitting} onClick={() => setIsOpen(false)}>×</button>
            <div className="annathanam-payment__intro">
              <p className="section-kicker">{t('payment.kicker')}</p>
              <h3 id="annathanam-payment-title">{t('payment.title')}</h3>
              <p>{t('payment.description')}</p>
            </div>

            <form className="annathanam-payment__form" onSubmit={handleSubmit}>
              <label>
                <span>{t('payment.amount')}</span>
                <div className="annathanam-payment__amount"><b aria-hidden="true">₹</b><input name="amount" type="number" min="1" max="500000" step="0.01" inputMode="decimal" value={form.amount} required autoFocus onChange={updateField} /></div>
              </label>
              <label>
                <span>{t('payment.name')}</span>
                <input name="name" value={form.name} maxLength="100" autoComplete="name" required onChange={updateField} />
              </label>
              <label>
                <span>{t('payment.phone')}</span>
                <input name="phone" type="tel" value={form.phone} maxLength="18" autoComplete="tel" placeholder={language === 'ta' ? '+91 98765 43210' : '+91 98765 43210'} required onChange={updateField} />
              </label>
              <label>
                <span>{t('payment.email')} <small>({t('forms.optional')})</small></span>
                <input name="email" type="email" value={form.email} maxLength="254" autoComplete="email" onChange={updateField} />
              </label>
              <button type="submit" disabled={isSubmitting}>{isSubmitting ? t('payment.processing') : t('payment.pay')}</button>
              <small className="annathanam-payment__secure">{t('payment.secure')}</small>
              {status.text && <p className={`annathanam-payment__status is-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.text}</p>}
            </form>
          </div>
        </div>,
        document.body,
      )}
    </section>
  )
}
