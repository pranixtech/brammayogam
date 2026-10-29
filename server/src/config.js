import path from 'node:path'
import { fileURLToPath } from 'node:url'

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function numberFromEnvironment(name, fallback) {
  const value = Number(process.env[name] ?? fallback)
  if (!Number.isFinite(value)) throw new Error(`${name} must be a number`)
  return value
}

export const config = {
  port: numberFromEnvironment('PORT', 4000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://brahmam:brahmam@localhost:5432/brahmam',
  adminUsername: process.env.ADMIN_USERNAME ?? 'admin',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'change-this-password',
  jwtSecret: process.env.JWT_SECRET ?? 'change-this-jwt-secret-before-production',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  uploadDirectory: process.env.UPLOAD_DIR ?? path.join(serverRoot, 'uploads'),
  maxUploadBytes: numberFromEnvironment('MAX_UPLOAD_BYTES', 10 * 1024 * 1024),
  maxActivityUploadBytes: numberFromEnvironment('MAX_ACTIVITY_UPLOAD_BYTES', 100 * 1024 * 1024),
  publicAppUrl: (process.env.PUBLIC_APP_URL ?? 'http://localhost:5173').replace(/\/$/, ''),
  cashfreeClientId: process.env.CASHFREE_CLIENT_ID ?? '',
  cashfreeClientSecret: process.env.CASHFREE_CLIENT_SECRET ?? '',
  cashfreeEnvironment: process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
  cashfreeApiVersion: process.env.CASHFREE_API_VERSION ?? '2026-01-01',
  get cashfreeEnabled() {
    return Boolean(this.cashfreeClientId && this.cashfreeClientSecret)
  },
  get cashfreeApiUrl() {
    return this.cashfreeEnvironment === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg'
  },
}

export function assertProductionConfiguration() {
  if (process.env.NODE_ENV !== 'production') return

  const unsafeValues = ['change-this-password', 'change-this-jwt-secret-before-production']
  if (unsafeValues.includes(config.adminPassword) || unsafeValues.includes(config.jwtSecret)) {
    throw new Error('ADMIN_PASSWORD and JWT_SECRET must be changed in production')
  }
}
