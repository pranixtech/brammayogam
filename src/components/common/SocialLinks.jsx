import { useLanguage } from '../../i18n/useLanguage'

const SOCIAL_LINKS = [
  {
    name: 'YouTube',
    className: 'is-youtube',
    href: 'https://youtube.com/@brahmayogamfoundation2021?si=R-NsILlJqtlWIEjL',
    icon: <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />,
  },
  {
    name: 'Instagram',
    className: 'is-instagram',
    href: 'https://www.instagram.com/brahmam_foundation?rpxt=MWE3cXd2ajAwcXRveQ%3D%3D&utm_source=qr',
    icon: (
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 1h10a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H7a6 6 0 0 1-6-6V7a6 6 0 0 1 6-6Zm0 4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7Zm5 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm5.55-4.8a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5Z"
      />
    ),
  },
  {
    name: 'Facebook',
    className: 'is-facebook',
    href: 'https://www.facebook.com/share/1CByjnBbJk/?mibextid=wwXIfr',
    icon: <path d="M14 8h3V4.2c-.5-.1-2.2-.2-4.1-.2C9 4 6.3 6.4 6.3 10.8V14H2v4.2h4.3V24h5.2v-5.8h4.3l.7-4.2h-5v-2.8C11.5 9.9 12 8 14 8Z" />,
  },
  {
    name: 'X',
    className: 'is-x',
    href: 'https://x.com/brahma_yogam?s=11',
    icon: <path d="M18.9 2H22l-6.8 7.8L23.2 22H17l-4.8-6.3L6.7 22H3.6l7.1-8.2L3 2h6.4l4.4 5.8L18.9 2Zm-1.1 17.9h1.7L8.5 4H6.7l11.1 15.9Z" />,
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
      {SOCIAL_LINKS.map(({ name, className: socialClassName, href, icon }) => (
        <a
          className={`meditation-socials__link ${socialClassName}`}
          href={href}
          key={name}
          target="_blank"
          rel="noreferrer"
          aria-label={name}
          title={name}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {icon}
          </svg>
        </a>
      ))}
    </Component>
  )
}
