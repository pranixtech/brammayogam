import { Brand } from '../common/Brand'
import { useLanguage } from '../../i18n/useLanguage'

export function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="site-footer">
      <Brand className="site-footer__brand" />
      <p>{t('footer.quote')}</p>
      <p className="site-footer__copyright">
        © {new Date().getFullYear()} {t('brand.name')}
      </p>
    </footer>
  )
}
