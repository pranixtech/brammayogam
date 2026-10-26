import { useEffect, useState } from 'react'
import { Brand } from '../common/Brand'
import { NAVIGATION_ITEMS } from '../../data/siteContent'
import { useScrollThreshold } from '../../hooks/useScrollThreshold'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isScrolled = useScrollThreshold()
  const closeMenu = () => setIsMenuOpen(false)

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

  return (
    <header className={`site-header${isScrolled ? ' site-header--scrolled' : ''}`}>
      <Brand onClick={closeMenu} />

      <button
        className="menu-button"
        type="button"
        aria-label="Toggle navigation"
        aria-controls="primary-navigation"
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
      >
        <span />
        <span />
      </button>

      <nav
        id="primary-navigation"
        className={`primary-navigation${isMenuOpen ? ' primary-navigation--open' : ''}`}
        aria-label="Main navigation"
      >
        {NAVIGATION_ITEMS.map(({ label, href, featured }) => (
          <a
            className={featured ? 'primary-navigation__featured' : undefined}
            href={href}
            key={href}
            onClick={closeMenu}
          >
            {label}
          </a>
        ))}
      </nav>
    </header>
  )
}
