import { useEffect, useRef, useState } from 'react'
import { Brand } from '../common/Brand'
import { NAVIGATION_ITEMS } from '../../data/siteContent'
import { useScrollThreshold } from '../../hooks/useScrollThreshold'

export function Header({ forceSolid = false }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigationRef = useRef(null)
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
        aria-label={isMenuOpen ? 'Close navigation' : 'Open navigation'}
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
        aria-label="Main navigation"
      >
        {NAVIGATION_ITEMS.map(({ label, href, lang, featured, children }) => (
          children ? (
            <details className="navigation-dropdown" key={label}>
              <summary>
                {label}
                <span aria-hidden="true">⌄</span>
              </summary>
              <div className="navigation-dropdown__menu">
                {children.map((child) => (
                  <a href={child.href} key={child.href} onClick={closeMenu}>
                    {child.label}
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
              {label}
            </a>
          )
        ))}
      </nav>
    </header>
  )
}
