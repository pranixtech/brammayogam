import { Brand } from '../common/Brand'
import { SITE_NAME } from '../../data/siteContent'
import { useLanguage } from '../../i18n/LanguageContext'

export function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="site-footer">
      <Brand className="site-footer__brand" />
      <p>{t('footer.quote')}</p>
      <p className="site-footer__copyright">
        © {new Date().getFullYear()} {SITE_NAME}
      </p>
    </footer>
  )
}
