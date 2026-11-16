import { useLanguage } from '../../i18n/useLanguage'
import whatsappIcon from '../../assets/social/whatsapp.jpeg'

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
      <img src={whatsappIcon} alt="" aria-hidden="true" />
    </a>
  )
}
