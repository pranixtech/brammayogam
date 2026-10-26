import { Brand } from '../common/Brand'
import { SITE_NAME } from '../../data/siteContent'

export function Footer() {
  return (
    <footer className="site-footer">
      <Brand className="site-footer__brand" />
      <p>Knowing oneself is the beginning of wisdom.</p>
      <p className="site-footer__copyright">
        © {new Date().getFullYear()} {SITE_NAME}
      </p>
    </footer>
  )
}
