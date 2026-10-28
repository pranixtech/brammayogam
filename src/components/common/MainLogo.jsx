import originalLogo from '../../assets/brahmam-original-logo.png'

export function MainLogo({ className = '' }) {
  return <img className={className} src={originalLogo} alt="" />
}
