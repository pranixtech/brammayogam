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
  credentialSyncSecret: process.env.CREDENTIAL_SYNC_SECRET ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'change-this-jwt-secret-before-production',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  uploadDirectory: process.env.UPLOAD_DIR ?? path.join(serverRoot, 'uploads'),
  registrationPaymentDirectory: process.env.REGISTRATION_PAYMENT_DIR
    ?? path.join(process.env.UPLOAD_DIR ?? path.join(serverRoot, 'uploads'), 'registration-payments'),
  maxUploadBytes: numberFromEnvironment('MAX_UPLOAD_BYTES', 10 * 1024 * 1024),
  maxActivityUploadBytes: numberFromEnvironment('MAX_ACTIVITY_UPLOAD_BYTES', 100 * 1024 * 1024),
  blackSmsApiKey: process.env.BLACKSMS_API_KEY ?? '',
  blackSmsSenderId: process.env.BLACKSMS_SENDER_ID ?? '',
  blackSmsWhatsAppRoute: numberFromEnvironment('BLACKSMS_WHATSAPP_ROUTE', 1),
  blackSmsEmailSenderId: process.env.BLACKSMS_EMAIL_SENDER_ID ?? '',
  blackSmsEmailTemplateId: numberFromEnvironment('BLACKSMS_EMAIL_TEMPLATE_ID', 0),
}

export function assertProductionConfiguration() {
  if (process.env.NODE_ENV !== 'production') return

  const unsafeValues = ['change-this-password', 'change-this-jwt-secret-before-production']
  if (unsafeValues.includes(config.adminPassword) || unsafeValues.includes(config.jwtSecret)) {
    throw new Error('ADMIN_PASSWORD and JWT_SECRET must be changed in production')
  }
  if (config.credentialSyncSecret.length < 32) {
    throw new Error('CREDENTIAL_SYNC_SECRET must contain at least 32 characters in production')
  }
}
