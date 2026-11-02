import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { pool } from '../db.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'

const router = Router()
const PAYMENT_METHODS = new Set(['UPI', 'BANK_TRANSFER'])
const DONATION_STATUSES = new Set(['PENDING', 'VERIFIED', 'REJECTED'])

const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many donation submissions. Please try again later.' },
})

function cleanText(value, maxLength) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength)
}

function cleanPhone(value) {
  const phone = String(value ?? '').trim().replace(/[\s()-]/g, '')
  return /^\+?[0-9]{8,15}$/.test(phone) ? phone : null
}

function cleanEmail(value) {
  const email = String(value ?? '').trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : null
}

function cleanUtr(value) {
  const utr = String(value ?? '').trim().toUpperCase()
  return /^[A-Z0-9][A-Z0-9/-]{5,49}$/.test(utr) ? utr : null
}

function cleanAmount(value) {
  const amount = Number(value)
  const amountInPaise = amount * 100
  if (!Number.isFinite(amount) || amount < 1 || amount > 500000) return null
  if (Math.abs(Math.round(amountInPaise) - amountInPaise) > 1e-8) return null
  return amount.toFixed(2)
}

function toSettings(row) {
  return {
    organizationName: row.organization_name,
    upiId: row.upi_id,
    bankName: row.bank_name,
    accountName: row.account_name,
    accountNumber: row.account_number,
    ifsc: row.ifsc,
    branch: row.branch,
    accountType: row.account_type,
  }
}

function toDonation(row) {
  return {
    id: String(row.id),
    donorName: row.donor_name,
    email: row.email,
    phone: row.phone,
    amount: Number(row.amount),
    paymentMethod: row.payment_method,
    utrNumber: row.utr_number,
    message: row.message,
    status: row.status,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

router.get('/donation-settings', async (_request, response, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT organization_name, upi_id, bank_name, account_name, account_number, ifsc, branch, account_type
       FROM donation_settings WHERE id = 1`,
    )
    response.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return response.json({ settings: toSettings(rows[0]) })
  } catch (error) {
    return next(error)
  }
})

router.post('/donations', submissionLimiter, async (request, response, next) => {
  const donorName = cleanText(request.body?.donorName, 100)
  const email = cleanEmail(request.body?.email)
  const phone = cleanPhone(request.body?.phone)
  const amount = cleanAmount(request.body?.amount)
  const paymentMethod = String(request.body?.paymentMethod ?? '').trim().toUpperCase()
  const utrNumber = cleanUtr(request.body?.utrNumber)
  const message = cleanText(request.body?.message, 1000)
  const consent = request.body?.consent === true

  if (donorName.length < 2) return response.status(400).json({ message: 'Enter the donor name.' })
  if (!email) return response.status(400).json({ message: 'Enter a valid email address.' })
  if (!phone) return response.status(400).json({ message: 'Enter a valid phone number with country code.' })
  if (!amount) return response.status(400).json({ message: 'Enter an amount between ₹1 and ₹5,00,000 with no more than two decimal places.' })
  if (!PAYMENT_METHODS.has(paymentMethod)) return response.status(400).json({ message: 'Choose UPI or Bank Transfer.' })
  if (!utrNumber) return response.status(400).json({ message: 'Enter a valid UTR or transaction reference number.' })
  if (!consent) return response.status(400).json({ message: 'Consent is required before submitting donation details.' })

  try {
    const { rows } = await pool.query(
      `INSERT INTO donations
       (donor_name, email, phone, amount, payment_method, utr_number, message, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
       RETURNING id, donor_name, email, phone, amount, payment_method, utr_number, message,
                 status, verified_by, verified_at, created_at, updated_at`,
      [donorName, email, phone, amount, paymentMethod, utrNumber, message],
    )
    return response.status(201).json({ donation: toDonation(rows[0]) })
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ message: 'This UTR or transaction reference number has already been submitted.' })
    return next(error)
  }
})

router.get('/admin/donation-settings', authenticateAdmin, async (_request, response, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT organization_name, upi_id, bank_name, account_name, account_number, ifsc, branch, account_type
       FROM donation_settings WHERE id = 1`,
    )
    return response.json({ settings: toSettings(rows[0]) })
  } catch (error) {
    return next(error)
  }
})

router.put('/admin/donation-settings', authenticateAdmin, async (request, response, next) => {
  const organizationName = cleanText(request.body?.organizationName, 160)
  const upiId = String(request.body?.upiId ?? '').trim().toLowerCase().slice(0, 160)
  const bankName = cleanText(request.body?.bankName, 160)
  const accountName = cleanText(request.body?.accountName, 160)
  const accountNumber = String(request.body?.accountNumber ?? '').trim().replace(/\s+/g, '').slice(0, 34)
  const ifsc = String(request.body?.ifsc ?? '').trim().toUpperCase().slice(0, 20)
  const branch = cleanText(request.body?.branch, 160)
  const accountType = cleanText(request.body?.accountType, 80)

  if (organizationName.length < 2) return response.status(400).json({ message: 'Enter the organization name.' })
  if (!/^[a-z0-9._-]{2,100}@[a-z0-9.-]{2,60}$/.test(upiId)) return response.status(400).json({ message: 'Enter a valid UPI ID.' })
  if (bankName.length < 2 || accountName.length < 2) return response.status(400).json({ message: 'Enter the bank and account names.' })
  if (!/^[A-Z0-9]{6,34}$/i.test(accountNumber)) return response.status(400).json({ message: 'Enter a valid account number.' })
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return response.status(400).json({ message: 'Enter a valid IFSC code.' })
  if (branch.length < 2) return response.status(400).json({ message: 'Enter the bank branch.' })

  try {
    const { rows } = await pool.query(
      `UPDATE donation_settings
       SET organization_name = $1, upi_id = $2, bank_name = $3, account_name = $4,
           account_number = $5, ifsc = $6, branch = $7, account_type = $8,
           updated_by = $9, updated_at = NOW()
       WHERE id = 1
       RETURNING organization_name, upi_id, bank_name, account_name, account_number, ifsc, branch, account_type`,
      [organizationName, upiId, bankName, accountName, accountNumber, ifsc, branch, accountType, request.admin.username],
    )
    return response.json({ settings: toSettings(rows[0]) })
  } catch (error) {
    return next(error)
  }
})

router.get('/admin/donations', authenticateAdmin, async (request, response, next) => {
  const status = String(request.query.status ?? '').trim().toUpperCase()
  const paymentMethod = String(request.query.paymentMethod ?? '').trim().toUpperCase()
  const search = String(request.query.search ?? '').trim().slice(0, 120)
  if (status && !DONATION_STATUSES.has(status)) return response.status(400).json({ message: 'Invalid donation status filter.' })
  if (paymentMethod && !PAYMENT_METHODS.has(paymentMethod)) return response.status(400).json({ message: 'Invalid payment method filter.' })

  const values = []
  const clauses = []
  if (status) {
    values.push(status)
    clauses.push(`status = $${values.length}`)
  }
  if (paymentMethod) {
    values.push(paymentMethod)
    clauses.push(`payment_method = $${values.length}`)
  }
  if (search) {
    values.push(`%${search}%`)
    const index = values.length
    clauses.push(`(donor_name ILIKE $${index} OR email ILIKE $${index} OR phone ILIKE $${index} OR utr_number ILIKE $${index} OR id::text ILIKE $${index})`)
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, donor_name, email, phone, amount, payment_method, utr_number, message,
              status, verified_by, verified_at, created_at, updated_at
       FROM donations
       ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
       ORDER BY created_at DESC, id DESC
       LIMIT 500`,
      values,
    )
    return response.json({ donations: rows.map(toDonation) })
  } catch (error) {
    return next(error)
  }
})

router.patch('/admin/donations/:id/status', authenticateAdmin, async (request, response, next) => {
  const status = String(request.body?.status ?? '').trim().toUpperCase()
  if (!['VERIFIED', 'REJECTED'].includes(status)) return response.status(400).json({ message: 'Choose VERIFIED or REJECTED.' })
  try {
    const { rows } = await pool.query(
      `UPDATE donations
       SET status = $2, verified_by = $3, verified_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'PENDING'
       RETURNING id, donor_name, email, phone, amount, payment_method, utr_number, message,
                 status, verified_by, verified_at, created_at, updated_at`,
      [request.params.id, status, request.admin.username],
    )
    if (!rows.length) return response.status(409).json({ message: 'Only pending donations can be verified or rejected.' })
    return response.json({ donation: toDonation(rows[0]) })
  } catch (error) {
    return next(error)
  }
})

export { router as donationsRouter }
