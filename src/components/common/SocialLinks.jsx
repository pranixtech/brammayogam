import { useLanguage } from '../../i18n/useLanguage'
import facebookIcon from '../../assets/social/facebook.jpeg'
import instagramIcon from '../../assets/social/instagram.jpeg'
import xIcon from '../../assets/social/x.jpeg'
import youtubeIcon from '../../assets/social/youtube.jpeg'

const SOCIAL_LINKS = [
  {
    name: 'YouTube',
    className: 'is-youtube',
    href: 'https://youtube.com/@brahmayogamfoundation2021?si=R-NsILlJqtlWIEjL',
    image: youtubeIcon,
  },
  {
    name: 'Instagram',
    className: 'is-instagram',
    href: 'https://www.instagram.com/brahmam_foundation?rpxt=MWE3cXd2ajAwcXRveQ%3D%3D&utm_source=qr',
    image: instagramIcon,
  },
  {
    name: 'Facebook',
    className: 'is-facebook',
    href: 'https://www.facebook.com/share/1CByjnBbJk/?mibextid=wwXIfr',
    image: facebookIcon,
  },
  {
    name: 'X',
    className: 'is-x',
    href: 'https://x.com/brahma_yogam?s=11',
    image: xIcon,
  },
]

export function SocialLinks({ className = '', as: Component = 'nav' }) {
  const { t } = useLanguage()

  return (
    <Component
      className={`meditation-socials ${className}`.trim()}
      aria-label={t('hero.socialLabel')}
      role={Component === 'nav' ? undefined : 'group'}
    >
      {SOCIAL_LINKS.map(({ name, className: socialClassName, href, icon, image }) => (
        <a
          className={`meditation-socials__link ${socialClassName}${image ? ' meditation-socials__link--image' : ''}`}
          href={href}
          key={name}
          target="_blank"
          rel="noreferrer"
          aria-label={name}
          title={name}
        >
          {image ? (
            <img src={image} alt="" aria-hidden="true" />
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              {icon}
            </svg>
          )}
        </a>
      ))}
    </Component>
  )
}
