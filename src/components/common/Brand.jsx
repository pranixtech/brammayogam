import { SITE_NAME } from '../../data/siteContent'
import { useLanguage } from '../../i18n/LanguageContext'
import { MainLogo } from './MainLogo'

export function Brand({ className = '', onClick }) {
  const { t } = useLanguage()
  return (
    <a
      className={`brand ${className}`.trim()}
      href="/#home"
      onClick={onClick}
      aria-label={t('brand.home')}
    >
      <MainLogo className="brand__logo" />
      <span className="brand__text">
        <strong>{SITE_NAME}</strong>
        <small>{t('brand.tagline')}</small>
      </span>
    </a>
  )
}
