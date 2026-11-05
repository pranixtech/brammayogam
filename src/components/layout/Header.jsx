import { useEffect, useRef, useState } from 'react'
import { Brand } from '../common/Brand'
import { SocialLinks } from '../common/SocialLinks'
import { NAVIGATION_ITEMS } from '../../data/siteContent'
import { useScrollThreshold } from '../../hooks/useScrollThreshold'
import { useLanguage } from '../../i18n/useLanguage'

const NAVIGATION_KEYS = {
  '/#journey': 'journey', '/bio': 'bio', '/#quotes': 'quotes', '/#contribution': 'contribution', '/#teachings': 'teachings',
  '/yogam': 'yogam', '/registration': 'registration', '/feedback': 'feedback',
  '/deeksha': 'deeksha', '/book': 'book', '/photos': 'photos', '/videos': 'videos', '/#purpose': 'purpose',
}

export function Header({ forceSolid = false }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const navigationRef = useRef(null)
  const languageRef = useRef(null)
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
      if (event.key === 'Escape') {
        closeMenu()
        setIsLanguageOpen(false)
      }
    }
    const closeLanguageOnOutsideClick = (event) => {
      if (!languageRef.current?.contains(event.target)) setIsLanguageOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    window.addEventListener('pointerdown', closeLanguageOnOutsideClick)

    return () => {
      document.body.classList.remove('menu-open')
      window.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('pointerdown', closeLanguageOnOutsideClick)
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

      <nav
        ref={navigationRef}
        id="primary-navigation"
        className={`primary-navigation${isMenuOpen ? ' primary-navigation--open' : ''}`}
        aria-label={t('navigation.label')}
      >
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

        <SocialLinks as="div" className="primary-navigation__socials" />
      </nav>

      <div className="site-header__actions">
        <div className="header-language" ref={languageRef}>
          <button
            className="header-language__trigger"
            type="button"
            aria-label={t('language.label')}
            aria-haspopup="menu"
            aria-expanded={isLanguageOpen}
            onClick={() => setIsLanguageOpen((current) => !current)}
          >
            <svg
              aria-hidden="true"
              className="header-language__icon"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c2.4 2.45 3.65 5.45 3.65 9S14.4 18.55 12 21M12 3c-2.4 2.45-3.65 5.45-3.65 9S9.6 18.55 12 21" />
            </svg>
          </button>

          {isLanguageOpen && (
            <div className="header-language__popover" role="menu" aria-label={t('language.label')}>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={language === 'en'}
                className={language === 'en' ? 'is-active' : undefined}
                onClick={() => {
                  setLanguage('en')
                  setIsLanguageOpen(false)
                }}
              >
                <span lang="en">{t('language.english')}</span>
                <span aria-hidden="true">{language === 'en' ? '✓' : ''}</span>
              </button>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={language === 'ta'}
                className={language === 'ta' ? 'is-active' : undefined}
                onClick={() => {
                  setLanguage('ta')
                  setIsLanguageOpen(false)
                }}
              >
                <span lang="ta">{t('language.tamil')}</span>
                <span aria-hidden="true">{language === 'ta' ? '✓' : ''}</span>
              </button>
            </div>
          )}
        </div>

        <button
          className={`menu-button${isMenuOpen ? ' menu-button--open' : ''}`}
          type="button"
          aria-label={t(isMenuOpen ? 'navigation.close' : 'navigation.open')}
          aria-controls="primary-navigation"
          aria-expanded={isMenuOpen}
          onClick={() => {
            setIsLanguageOpen(false)
            setIsMenuOpen((currentValue) => !currentValue)
          }}
        >
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
