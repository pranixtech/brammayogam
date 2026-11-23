import crypto from 'node:crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { pool } from '../db.js'
import { USER_COOKIE_NAME } from '../middleware/authenticateUser.js'

const router = Router()
const OTP_TTL_MINUTES = 5
const OTP_MAX_ATTEMPTS = 5
const isProduction = process.env.NODE_ENV === 'production'

function isBlackSmsWhatsAppConfigured() {
  return Boolean(config.blackSmsApiKey && config.blackSmsSenderId)
}

function isBlackSmsEmailConfigured() {
  return Boolean(config.blackSmsApiKey)
}

const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 6,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many OTP requests. Please wait and try again.' },
})

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many OTP verification attempts. Please wait and try again.' },
})

const passwordLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please wait and try again.' },
})

function normalizePhone(value) {
  let digits = String(value ?? '').replace(/\D/g, '')
  if (digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length === 10) digits = `91${digits}`
  return digits.length >= 8 && digits.length <= 15 ? digits : null
}

function cleanName(value) {
  const name = String(value ?? '').trim().replace(/\s+/g, ' ')
  return name.length >= 2 && name.length <= 120 ? name : null
}

function cleanEmail(value) {
  const email = String(value ?? '').trim().toLowerCase()
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

function cleanPassword(value) {
  const password = typeof value === 'string' ? value : ''
  return password.length >= 8 && password.length <= 128 ? password : null
}

function derivePasswordHash(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) reject(error)
      else resolve(derivedKey.toString('hex'))
    })
  })
}

function cleanCity(value) {
  const city = String(value ?? '').trim().replace(/\s+/g, ' ')
  return city.length >= 1 && city.length <= 100 ? city : null
}

function otpHash(challengeId, otp) {
  return crypto.createHmac('sha256', config.jwtSecret).update(`${challengeId}:${otp}`).digest('hex')
}

function safeEqual(first, second) {
  const firstBuffer = Buffer.from(String(first))
  const secondBuffer = Buffer.from(String(second))
  return firstBuffer.length === secondBuffer.length && crypto.timingSafeEqual(firstBuffer, secondBuffer)
}

function blackSmsRecipient(phone) {
  return phone.startsWith('91') && phone.length === 12 ? phone.slice(2) : null
}

async function sendOtpByWhatsApp(phone, otp) {
  if (!isBlackSmsWhatsAppConfigured()) {
    if (!isProduction) return { delivered: false }
    throw Object.assign(new Error('WhatsApp OTP delivery is not configured. Contact the site administrator.'), { statusCode: 503 })
  }

  const recipient = blackSmsRecipient(phone)
  if (!recipient) {
    throw Object.assign(new Error('WhatsApp verification is currently available for Indian mobile numbers only.'), { statusCode: 400 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)
  try {
    const response = await fetch('https://blacksms.in/wasms', {
      method: 'POST',
      headers: {
        Authorization: config.blackSmsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_id: config.blackSmsSenderId,
        variables_values: otp,
        numbers: recipient,
        route: config.blackSmsWhatsAppRoute,
      }),
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || Number(payload.status) !== 1) {
      throw Object.assign(new Error(payload.message || 'WhatsApp OTP could not be sent. Please try again.'), { statusCode: 502 })
    }
    return { delivered: true }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw Object.assign(new Error('WhatsApp OTP delivery timed out. Please try again.'), { statusCode: 504 })
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function sendOtpByEmail(email, otp) {
  if (!isBlackSmsEmailConfigured()) {
    if (!isProduction) return { delivered: false }
    throw Object.assign(new Error('Email OTP delivery is not configured. Contact the site administrator.'), { statusCode: 503 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)
  try {
    const response = await fetch('https://blacksms.in/endpoints/v1/email-otp', {
      method: 'POST',
      headers: {
        Authorization: config.blackSmsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        template_id: config.blackSmsEmailTemplateId,
        ...(config.blackSmsEmailSenderId ? { sender_id: config.blackSmsEmailSenderId } : {}),
        variables: { otp },
      }),
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload.success !== true) {
      throw Object.assign(new Error(payload.message || 'Email OTP could not be sent. Please try again.'), { statusCode: 502 })
    }
    return { delivered: true }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw Object.assign(new Error('Email OTP delivery timed out. Please try again.'), { statusCode: 504 })
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function setUserCookie(response, user) {
  const token = jwt.sign({ id: String(user.id), phone: user.phone, name: user.full_name, role: 'user' }, config.jwtSecret, {
    algorithm: 'HS256',
    issuer: 'brahmam-foundation',
    audience: 'brahmam-user',
    expiresIn: '30d',
  })
  response.cookie(USER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

router.post('/auth/otp/request', otpRequestLimiter, async (request, response, next) => {
  const phone = normalizePhone(request.body?.phone)
  const verificationMethod = String(request.body?.verificationMethod ?? 'WHATSAPP').trim().toUpperCase()
  const purpose = String(request.body?.purpose ?? '').trim().toUpperCase()
  const fullName = purpose === 'REGISTER' ? cleanName(request.body?.fullName) : ''
  const password = ['REGISTER', 'LOGIN'].includes(purpose) ? cleanPassword(request.body?.password) : ''
  const city = purpose === 'REGISTER' ? cleanCity(request.body?.city) : ''
  const country = purpose === 'REGISTER' ? String(request.body?.country ?? '').trim().toUpperCase() : ''
  const emailInput = String(request.body?.email ?? '').trim()
  const requestedEmail = cleanEmail(emailInput)
  if (!['REGISTER', 'LOGIN'].includes(purpose)) return response.status(400).json({ message: 'Choose registration or password reset.' })
  if (!['WHATSAPP', 'EMAIL'].includes(verificationMethod)) return response.status(400).json({ message: 'Choose a valid verification method.' })
  if (purpose === 'REGISTER' && !fullName) return response.status(400).json({ message: 'Enter your full name.' })
  if (!password) return response.status(400).json({ message: 'Choose a password with at least 8 characters.' })
  if (purpose === 'REGISTER' && (!city || !/^[A-Z]{2}$/.test(country))) return response.status(400).json({ message: 'Select your city and country.' })
  if (purpose === 'REGISTER' && !requestedEmail) return response.status(400).json({ message: 'Enter a valid email address.' })
  if (verificationMethod === 'WHATSAPP' && !phone) return response.status(400).json({ message: 'Enter a valid Indian mobile number with country code.' })
  if (verificationMethod === 'WHATSAPP' && !blackSmsRecipient(phone)) return response.status(400).json({ message: 'WhatsApp OTP is available for Indian numbers. Use email verification outside India.' })
  if (verificationMethod === 'EMAIL' && !requestedEmail) return response.status(400).json({ message: 'Enter a valid email address for verification.' })
  if (purpose === 'REGISTER' && verificationMethod === 'EMAIL' && !phone) return response.status(400).json({ message: 'Enter a valid international phone number with country code.' })

  try {
    const lookup = verificationMethod === 'WHATSAPP'
      ? await pool.query('SELECT id, phone, email FROM user_accounts WHERE phone = $1', [phone])
      : await pool.query('SELECT id, phone, email FROM user_accounts WHERE lower(email) = lower($1)', [requestedEmail])
    const existing = lookup.rows[0]
    if (purpose === 'REGISTER') {
      const duplicate = await pool.query('SELECT id FROM user_accounts WHERE phone = $1 OR lower(email) = lower($2)', [phone, requestedEmail])
      if (duplicate.rows[0]) return response.status(409).json({ message: 'An account already exists for these details. Please log in or reset your password.' })
    } else if (!existing) return response.status(404).json({ message: 'No account was found for this contact. Please register first.' })

    const deliveryChannel = verificationMethod
    const accountPhone = purpose === 'REGISTER' ? phone : existing.phone
    const email = purpose === 'REGISTER' ? requestedEmail : existing.email

    const challengeId = crypto.randomUUID()
    const otp = String(crypto.randomInt(100000, 1000000))
    const passwordSalt = crypto.randomBytes(16).toString('hex')
    const passwordHash = passwordSalt ? await derivePasswordHash(password, passwordSalt) : null
    await pool.query(
      `INSERT INTO user_otp_challenges (id, phone, email, city, country, delivery_channel, purpose, full_name, password_hash, password_salt, otp_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() + INTERVAL '${OTP_TTL_MINUTES} minutes')`,
      [challengeId, accountPhone, email, city || null, country || null, deliveryChannel, purpose, fullName || '', passwordHash, passwordSalt, otpHash(challengeId, otp)],
    )
    try {
      if (deliveryChannel === 'WHATSAPP') await sendOtpByWhatsApp(accountPhone, otp)
      else await sendOtpByEmail(email, otp)
    } catch (error) {
      await pool.query('DELETE FROM user_otp_challenges WHERE id = $1', [challengeId]).catch(() => undefined)
      throw error
    }
    await pool.query(
      `DELETE FROM user_otp_challenges
       WHERE (expires_at < NOW() - INTERVAL '1 day' OR consumed_at IS NOT NULL)
         AND id <> $1`,
      [challengeId],
    ).catch(() => undefined)
    return response.status(201).json({
      challengeId,
      destination: deliveryChannel === 'EMAIL' ? email : `+${accountPhone}`,
      expiresInSeconds: OTP_TTL_MINUTES * 60,
      deliveryChannel,
      ...(!isProduction && ((deliveryChannel === 'WHATSAPP' && !isBlackSmsWhatsAppConfigured()) || (deliveryChannel === 'EMAIL' && !isBlackSmsEmailConfigured())) ? { devOtp: otp } : {}),
    })
  } catch (error) {
    if (error.statusCode) return response.status(error.statusCode).json({ message: error.message })
    return next(error)
  }
})

router.post('/auth/otp/verify', otpVerifyLimiter, async (request, response, next) => {
  const challengeId = String(request.body?.challengeId ?? '').trim()
  const otp = String(request.body?.otp ?? '').trim()
  if (!/^[0-9a-f-]{36}$/i.test(challengeId) || !/^\d{6}$/.test(otp)) {
    return response.status(400).json({ message: 'Enter the six-digit OTP.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query('SELECT * FROM user_otp_challenges WHERE id = $1 FOR UPDATE', [challengeId])
    const challenge = rows[0]
    if (!challenge || challenge.consumed_at) {
      await client.query('ROLLBACK')
      return response.status(400).json({ message: 'This OTP request is no longer valid. Request a new code.' })
    }
    if (new Date(challenge.expires_at).getTime() <= Date.now()) {
      await client.query('ROLLBACK')
      return response.status(400).json({ message: 'This OTP has expired. Request a new code.' })
    }
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      await client.query('ROLLBACK')
      return response.status(429).json({ message: 'Too many incorrect attempts. Request a new OTP.' })
    }
    if (!safeEqual(challenge.otp_hash, otpHash(challengeId, otp))) {
      await client.query('UPDATE user_otp_challenges SET attempts = attempts + 1 WHERE id = $1', [challengeId])
      await client.query('COMMIT')
      return response.status(400).json({ message: 'The OTP is incorrect.' })
    }

    let user
    if (challenge.purpose === 'REGISTER') {
      if (!challenge.password_hash || !challenge.password_salt) {
        await client.query('ROLLBACK')
        return response.status(400).json({ message: 'This registration request is incomplete. Please register again.' })
      }
      const result = await client.query(
        `INSERT INTO user_accounts (full_name, phone, email, city, country, password_hash, password_salt, phone_verified_at, email_verified_at)
         VALUES (
           $1, $2, $3, $4, $5, $6, $7,
           CASE WHEN $8 = 'WHATSAPP' THEN NOW() ELSE NULL END,
           CASE WHEN $8 = 'EMAIL' THEN NOW() ELSE NULL END
         )
         RETURNING id, full_name, phone, email, created_at`,
        [challenge.full_name, challenge.phone, challenge.email, challenge.city, challenge.country, challenge.password_hash, challenge.password_salt, challenge.delivery_channel],
      )
      user = result.rows[0]
    } else {
      if (!challenge.password_hash || !challenge.password_salt) {
        await client.query('ROLLBACK')
        return response.status(400).json({ message: 'This password reset request is incomplete. Please try again.' })
      }
      const result = challenge.delivery_channel === 'WHATSAPP'
        ? await client.query('UPDATE user_accounts SET password_hash = $1, password_salt = $2, updated_at = NOW() WHERE phone = $3 RETURNING id, full_name, phone, email, created_at', [challenge.password_hash, challenge.password_salt, challenge.phone])
        : await client.query('UPDATE user_accounts SET password_hash = $1, password_salt = $2, updated_at = NOW() WHERE lower(email) = lower($3) RETURNING id, full_name, phone, email, created_at', [challenge.password_hash, challenge.password_salt, challenge.email])
      user = result.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return response.status(404).json({ message: 'Account not found. Please register first.' })
      }
    }
    await client.query('UPDATE user_otp_challenges SET consumed_at = NOW() WHERE id = $1', [challengeId])
    await client.query('COMMIT')
    setUserCookie(response, user)
    return response.json({ user: { id: String(user.id), fullName: user.full_name, phone: user.phone ? `+${user.phone}` : null, email: user.email ?? null } })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    return next(error)
  } finally {
    client.release()
  }
})

router.post('/auth/login', passwordLoginLimiter, async (request, response, next) => {
  const identifier = String(request.body?.identifier ?? '').trim()
  const password = cleanPassword(request.body?.password)
  const email = cleanEmail(identifier)
  const phone = normalizePhone(identifier)
  if (!password || (!email && !phone)) {
    return response.status(400).json({ message: 'Enter your mobile number or email address and password.' })
  }

  try {
    const result = email
      ? await pool.query('SELECT id, full_name, phone, email, password_hash, password_salt, created_at FROM user_accounts WHERE lower(email) = lower($1)', [email])
      : await pool.query('SELECT id, full_name, phone, email, password_hash, password_salt, created_at FROM user_accounts WHERE phone = $1', [phone])
    const user = result.rows[0]
    if (!user?.password_hash || !user.password_salt) {
      return response.status(401).json({ message: 'Invalid mobile number, email address or password.' })
    }
    const candidateHash = await derivePasswordHash(password, user.password_salt)
    if (!safeEqual(candidateHash, user.password_hash)) {
      return response.status(401).json({ message: 'Invalid mobile number, email address or password.' })
    }
    setUserCookie(response, user)
    return response.json({ user: { id: String(user.id), fullName: user.full_name, phone: user.phone ? `+${user.phone}` : null, email: user.email ?? null } })
  } catch (error) {
    return next(error)
  }
})

router.get('/auth/session', async (request, response, next) => {
  const token = request.cookies[USER_COOKIE_NAME]
  if (!token) return response.status(401).json({ message: 'User authentication required.' })
  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'], issuer: 'brahmam-foundation', audience: 'brahmam-user',
    })
    const { rows } = await pool.query('SELECT id, full_name, phone, email FROM user_accounts WHERE id = $1', [payload.id])
    if (!rows[0]) return response.status(401).json({ message: 'User account not found.' })
    return response.json({ user: { id: String(rows[0].id), fullName: rows[0].full_name, phone: rows[0].phone ? `+${rows[0].phone}` : null, email: rows[0].email ?? null } })
  } catch (error) {
    if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') return next(error)
    return response.status(401).json({ message: 'Your login session has expired.' })
  }
})

router.post('/auth/logout', (_request, response) => {
  response.clearCookie(USER_COOKIE_NAME, { path: '/', sameSite: 'lax', secure: config.cookieSecure })
  return response.status(204).end()
})

export { router as userAuthRouter }
