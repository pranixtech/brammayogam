import meditationImage from '../assets/meditation-home.jpeg'
import { useLanguage } from '../i18n/useLanguage'

const SOCIAL_LINKS = [
  {
    name: 'YouTube',
    className: 'is-youtube',
    href: 'https://youtube.com/@brahmayogamfoundation2021?si=R-NsILlJqtlWIEjL',
    icon: (
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
    ),
  },
  {
    name: 'Instagram',
    className: 'is-instagram',
    href: 'https://www.instagram.com/brahmam_foundation?rpxt=MWE3cXd2ajAwcXRveQ%3D%3D&utm_source=qr',
    icon: (
      <>
        <path d="M12 5.8A6.2 6.2 0 1 0 12 18.2 6.2 6.2 0 0 0 12 5.8Zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
        <circle cx="18.4" cy="5.6" r="1.45" />
        <path d="M12 0C8.7 0 8.3 0 7 .1 5.6.2 4.6.4 3.7.8a7.5 7.5 0 0 0-2.8 2A7.5 7.5 0 0 0 .1 7C0 8.3 0 8.7 0 12s0 3.7.1 5c.1 1.4.3 2.4.7 3.3a7.5 7.5 0 0 0 2 2.8 7.5 7.5 0 0 0 2.8.8c.9.4 1.9.6 3.3.7 1.3.1 1.7.1 5 .1 3.3 0 3.7 0 5-.1 1.4-.1 2.4-.3 3.3-.7a7.5 7.5 0 0 0 2.8-2 7.5 7.5 0 0 0 2-2.8c.4-.9.6-1.9.7-3.3.1-1.3.1-1.7.1-5s0-3.7-.1-5c-.1-1.4-.3-2.4-.7-3.3a7.5 7.5 0 0 0-2-2.8 7.5 7.5 0 0 0-2.8-2C19.4.4 18.4.2 17 .1 15.7 0 15.3 0 12 0Zm9.6 16.8c-.1 1.2-.3 1.9-.5 2.4-.3.7-.7 1.2-1.3 1.7-.5.5-1 .9-1.7 1.2-.5.2-1.2.4-2.4.5-1.3.1-1.6.1-4.8.1s-3.5 0-4.8-.1c-1.2-.1-1.9-.3-2.4-.5a5.2 5.2 0 0 1-1.7-1.2 5.2 5.2 0 0 1-1.2-1.7c-.2-.5-.4-1.2-.5-2.4C2.2 15.5 2.2 15.2 2.2 12s0-3.5.1-4.8c.1-1.2.3-1.9.5-2.4.3-.7.7-1.2 1.2-1.7.5-.5 1-.9 1.7-1.2.5-.2 1.2-.4 2.4-.5C9.4 1.3 9.7 1.3 12 1.3s2.6 0 3.9.1c1.2.1 1.9.3 2.4.5.7.3 1.2.7 1.7 1.2.5.5.9 1 1.2 1.7.2.5.4 1.2.5 2.4.1 1.3.1 1.6.1 4.8s0 3.5-.2 4.8Z" />
      </>
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

export function HeroSection() {
  const { t } = useLanguage()
  return (
    <section className="meditation-hero" id="home">
      <figure className="meditation-hero__portrait">
        <img
          className="meditation-hero__image"
          src={meditationImage}
          alt={t('hero.imageAlt')}
        />
      </figure>

      <article className="meditation-letter" aria-label={t('hero.reflection')}>
        <blockquote>
          {t('hero.quote')}
        </blockquote>
        <footer>{t('hero.author')}</footer>
        <nav className="meditation-socials" aria-label={t('hero.socialLabel')}>
          {SOCIAL_LINKS.map(({ name, className, href, icon }) => (
            <a
              className={`meditation-socials__link ${className}`}
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
        </nav>
      </article>
    </section>
  )
}
