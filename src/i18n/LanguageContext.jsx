import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { TRANSLATIONS } from './translations'

const STORAGE_KEY = 'brahmam-language'
const LanguageContext = createContext(null)

function getInitialLanguage() {
  try {
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY)
    if (savedLanguage === 'en' || savedLanguage === 'ta') return savedLanguage
  } catch {
    // Use English when browser storage is unavailable.
  }
  return 'en'
}

function readTranslation(language, key) {
  return key.split('.').reduce((value, segment) => value?.[segment], TRANSLATIONS[language])
    ?? key.split('.').reduce((value, segment) => value?.[segment], TRANSLATIONS.en)
    ?? key
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage)

  const setLanguage = useCallback((nextLanguage) => {
    if (nextLanguage !== 'en' && nextLanguage !== 'ta') return
    setLanguageState(nextLanguage)
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    document.body.dataset.language = language
    try {
      window.localStorage.setItem(STORAGE_KEY, language)
    } catch {
      // The current visit still uses the selected language.
    }
  }, [language])

  const t = useCallback((key) => readTranslation(language, key), [language])
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
