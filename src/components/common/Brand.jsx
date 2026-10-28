import { SITE_NAME } from '../../data/siteContent'
import { MainLogo } from './MainLogo'

export function Brand({ className = '', onClick }) {
  return (
    <a
      className={`brand ${className}`.trim()}
      href="/#home"
      onClick={onClick}
      aria-label={`${SITE_NAME} home`}
    >
      <MainLogo className="brand__logo" />
      <span className="brand__text">
        <strong>{SITE_NAME}</strong>
        <small>the inward path</small>
      </span>
    </a>
  )
}
