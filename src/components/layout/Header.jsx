import { useEffect, useRef, useState } from 'react'
import { Brand } from '../common/Brand'
import { NAVIGATION_ITEMS } from '../../data/siteContent'
import { useScrollThreshold } from '../../hooks/useScrollThreshold'
import { useLanguage } from '../../i18n/useLanguage'

const NAVIGATION_KEYS = {
  '/#journey': 'journey', '/bio': 'bio', '/#contribution': 'contribution', '/#teachings': 'teachings',
  '/yogam': 'yogam', '/registration': 'registration', '/feedback': 'feedback',
  '/deeksha': 'deeksha', '/book': 'book', '/photos': 'photos', '/videos': 'videos', '/#purpose': 'purpose',
}

export function Header({ forceSolid = false }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigationRef = useRef(null)
  const { language, setLanguage, t } = useLanguage()
  const isScrolled = useScrollThreshold()
  const closeMenu = () => {
    setIsMenuOpen(false)
    navigationRef.current?.querySelectorAll('details[open]').forEach((item) => {
      item.removeAttribute('open')
    })
  }

  useEffect(() => {
    document.body.classList.toggle('menu-open', isMenuOpen)

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') closeMenu()
    }

    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.classList.remove('menu-open')
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isMenuOpen])

  useEffect(() => {
    if (isMenuOpen && navigationRef.current) {
      navigationRef.current.scrollTop = 0
    }
  }, [isMenuOpen])

  return (
    <header className={`site-header${isScrolled || forceSolid ? ' site-header--scrolled' : ''}`}>
      <Brand onClick={closeMenu} />

      <button
        className={`menu-button${isMenuOpen ? ' menu-button--open' : ''}`}
        type="button"
        aria-label={t(isMenuOpen ? 'navigation.close' : 'navigation.open')}
        aria-controls="primary-navigation"
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
      >
        <span />
        <span />
      </button>

      <nav
        ref={navigationRef}
        id="primary-navigation"
        className={`primary-navigation${isMenuOpen ? ' primary-navigation--open' : ''}`}
        aria-label={t('navigation.label')}
      >
        <div className="language-toggle" role="group" aria-label={t('language.label')}>
          <button
            className={`language-toggle__option${language === 'en' ? ' is-active' : ''}`}
            type="button"
            lang="en"
            aria-pressed={language === 'en'}
            onClick={() => setLanguage('en')}
          >
            {t('language.english')}
          </button>
          <span className="language-toggle__mark" aria-hidden="true">✦</span>
          <button
            className={`language-toggle__option${language === 'ta' ? ' is-active' : ''}`}
            type="button"
            lang="ta"
            aria-pressed={language === 'ta'}
            onClick={() => setLanguage('ta')}
          >
            {t('language.tamil')}
          </button>
        </div>

        {NAVIGATION_ITEMS.map(({ label, href, lang, featured, children }) => (
          children ? (
            <details className="navigation-dropdown" key={label}>
              <summary>
                {t('navigation.gallery')}
                <span aria-hidden="true">⌄</span>
              </summary>
              <div className="navigation-dropdown__menu">
                {children.map((child) => (
                  <a href={child.href} key={child.href} onClick={closeMenu}>
                    {t(`navigation.${NAVIGATION_KEYS[child.href]}`)}
                  </a>
                ))}
              </div>
            </details>
          ) : (
            <a
              className={featured ? 'primary-navigation__featured' : undefined}
              href={href}
              key={href}
              lang={lang}
              onClick={closeMenu}
            >
              {t(`navigation.${NAVIGATION_KEYS[href]}`) || label}
            </a>
          )
        ))}
      </nav>
    </header>
  )
}
