import { useLanguage } from '../../i18n/useLanguage'

const WHATSAPP_URL = 'https://wa.me/919514313331'

export function WhatsAppButton() {
  const { t } = useLanguage()
  const label = t('whatsapp.label')

  return (
    <a
      className="whatsapp-fab"
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path
          className="whatsapp-fab__bubble"
          d="M16 4.25A11.75 11.75 0 0 0 5.92 22.04L4.3 27.75l5.86-1.54A11.75 11.75 0 1 0 16 4.25Z"
        />
        <path
          className="whatsapp-fab__phone"
          d="M11.02 9.92c.29-.65.59-.66.87-.67h.74c.24 0 .63.09.96.8.33.71 1.12 2.75 1.22 2.95.1.19.16.42.03.68-.13.26-.2.42-.39.65-.2.23-.41.51-.59.68-.2.19-.4.39-.17.78.23.39 1.02 1.69 2.2 2.73 1.51 1.35 2.78 1.77 3.17 1.96.39.2.62.16.85-.1.23-.26.98-1.14 1.24-1.53.26-.39.52-.33.88-.2.36.13 2.28 1.08 2.67 1.27.39.2.65.29.75.46.1.16.1.94-.23 1.85-.33.91-1.91 1.74-2.63 1.85-.67.1-1.52.15-2.45-.15-.57-.18-1.29-.42-2.22-.82-.39-.17-6.83-2.53-9.34-8.68-.7-1.72-.08-3.77.44-4.5Z"
        />
      </svg>
    </a>
  )
}
