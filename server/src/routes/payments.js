import crypto from 'node:crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { config } from '../config.js'
import { pool } from '../db.js'

const router = Router()
const createPaymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many payment attempts. Please try again later.' },
})

function cashfreeHeaders(requestId = crypto.randomUUID()) {
  return {
    accept: 'application/json',
    'content-type': 'application/json',
    'x-api-version': config.cashfreeApiVersion,
    'x-client-id': config.cashfreeClientId,
    'x-client-secret': config.cashfreeClientSecret,
    'x-request-id': requestId,
  }
}

async function cashfreeRequest(path, options = {}) {
  if (!config.cashfreeEnabled) {
    const error = new Error('Cashfree payments are not configured yet.')
    error.statusCode = 503
    throw error
  }

  const response = await fetch(`${config.cashfreeApiUrl}${path}`, {
    ...options,
    headers: { ...cashfreeHeaders(), ...options.headers },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.message || 'Cashfree could not complete the request.')
    error.statusCode = response.status >= 500 ? 502 : response.status
    throw error
  }
  return payload
}

function cleanPhone(value) {
  const phone = String(value ?? '').trim().replace(/[\s()-]/g, '')
  return /^\+?[0-9]{8,15}$/.test(phone) ? phone : null
}

function cleanEmail(value) {
  const email = String(value ?? '').trim().toLowerCase()
  if (!email) return ''
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : null
}

function safeEqual(first, second) {
  const firstBuffer = Buffer.from(String(first))
  const secondBuffer = Buffer.from(String(second))
  return firstBuffer.length === secondBuffer.length && crypto.timingSafeEqual(firstBuffer, secondBuffer)
}

async function updateOrderStatus(orderId, status, cfOrderId = null) {
  if (!orderId || !status) return
  await pool.query(
    `UPDATE annathanam_payments
     SET status = $2, cf_order_id = COALESCE($3, cf_order_id), updated_at = NOW()
     WHERE order_id = $1`,
    [orderId, status, cfOrderId],
  )
}

router.post('/payments/orders', createPaymentLimiter, async (request, response, next) => {
  const amount = Number(request.body?.amount)
  const donorName = String(request.body?.name ?? '').trim().replace(/\s+/g, ' ').slice(0, 100)
  const donorPhone = cleanPhone(request.body?.phone)
  const donorEmail = cleanEmail(request.body?.email)

  const amountInPaise = amount * 100
  if (!Number.isFinite(amount) || amount < 1 || amount > 500000 || Math.abs(Math.round(amountInPaise) - amountInPaise) > 1e-8) {
    return response.status(400).json({ message: 'Enter an amount between ₹1 and ₹5,00,000 with no more than two decimal places.' })
  }
  if (donorName.length < 2) return response.status(400).json({ message: 'Enter your full name.' })
  if (!donorPhone) return response.status(400).json({ message: 'Enter a valid phone number with country code.' })
  if (donorEmail === null) return response.status(400).json({ message: 'Enter a valid email address.' })

  const orderId = `annathanam_${Date.now()}_${crypto.randomBytes(5).toString('hex')}`
  const customerId = `donor_${crypto.randomBytes(8).toString('hex')}`
  const returnUrl = `${config.publicAppUrl}/?cashfree_order_id=${encodeURIComponent(orderId)}#contribution`
  const notifyUrl = `${config.publicAppUrl}/api/payments/webhook`

  try {
    await pool.query(
      `INSERT INTO annathanam_payments
       (order_id, amount, currency, donor_name, donor_email, donor_phone, status)
       VALUES ($1, $2, 'INR', $3, $4, $5, 'CREATED')`,
      [orderId, amount.toFixed(2), donorName, donorEmail, donorPhone],
    )

    const order = await cashfreeRequest('/orders', {
      method: 'POST',
      headers: { 'x-idempotency-key': crypto.randomUUID() },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: customerId,
          customer_name: donorName,
          customer_phone: donorPhone,
          ...(donorEmail ? { customer_email: donorEmail } : {}),
        },
        order_meta: { return_url: returnUrl, notify_url: notifyUrl },
        order_note: 'Annathanam contribution',
        order_tags: { purpose: 'annathanam' },
      }),
    })

    await updateOrderStatus(orderId, order.order_status ?? 'ACTIVE', String(order.cf_order_id ?? ''))
    return response.status(201).json({
      orderId,
      paymentSessionId: order.payment_session_id,
      mode: config.cashfreeEnvironment,
    })
  } catch (error) {
    await updateOrderStatus(orderId, 'CREATE_FAILED').catch(() => undefined)
    return next(error)
  }
})

router.get('/payments/orders/:orderId', async (request, response, next) => {
  const orderId = String(request.params.orderId ?? '')
  if (!/^annathanam_[A-Za-z0-9_-]{10,40}$/.test(orderId)) {
    return response.status(400).json({ message: 'Invalid payment order.' })
  }

  try {
    const localOrder = await pool.query('SELECT order_id FROM annathanam_payments WHERE order_id = $1', [orderId])
    if (!localOrder.rowCount) return response.status(404).json({ message: 'Payment order not found.' })

    const order = await cashfreeRequest(`/orders/${encodeURIComponent(orderId)}`, { method: 'GET' })
    await updateOrderStatus(orderId, order.order_status, String(order.cf_order_id ?? ''))
    return response.json({ orderId, status: order.order_status })
  } catch (error) {
    return next(error)
  }
})

router.post('/payments/webhook', async (request, response) => {
  if (!config.cashfreeEnabled || !request.rawBody) return response.status(400).json({ message: 'Invalid webhook.' })

  const signature = request.get('x-webhook-signature') ?? ''
  const timestamp = request.get('x-webhook-timestamp') ?? ''
  const expectedSignature = crypto
    .createHmac('sha256', config.cashfreeClientSecret)
    .update(`${timestamp}${request.rawBody.toString('utf8')}`)
    .digest('base64')

  if (!timestamp || !signature || !safeEqual(signature, expectedSignature)) {
    return response.status(401).json({ message: 'Invalid webhook signature.' })
  }

  const order = request.body?.data?.order
  const payment = request.body?.data?.payment
  const status = order?.order_status || (payment?.payment_status === 'SUCCESS' ? 'PAID' : payment?.payment_status)
  await updateOrderStatus(order?.order_id, status, order?.cf_order_id ? String(order.cf_order_id) : null)
  return response.status(200).json({ received: true })
})

export { router as paymentsRouter }
