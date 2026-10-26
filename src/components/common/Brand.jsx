import { LotusMark } from './LotusMark'
import { SITE_NAME } from '../../data/siteContent'

export function Brand({ className = '', onClick }) {
  return (
    <a
      className={`brand ${className}`.trim()}
      href="#home"
      onClick={onClick}
      aria-label={`${SITE_NAME} home`}
    >
      <LotusMark size="small" />
      <span className="brand__text">
        <strong>{SITE_NAME}</strong>
        <small>the inward path</small>
      </span>
    </a>
  )
}
