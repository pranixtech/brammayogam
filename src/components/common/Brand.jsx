import { useLanguage } from '../../i18n/useLanguage'
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
        <strong>{t('brand.name')}</strong>
        <small>{t('brand.tagline')}</small>
      </span>
    </a>
  )
}
