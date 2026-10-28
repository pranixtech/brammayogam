import { useCallback, useEffect, useMemo, useState } from 'react'
import { LanguageContext } from './languageContextState'
import { TRANSLATIONS } from './translations'

const STORAGE_KEY = 'brahmam-language'

function getInitialLanguage() {
  try {
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY)
    if (savedLanguage === 'en' || savedLanguage === 'ta') return savedLanguage
  } catch {
    // Use English when browser storage is unavailable.
  }
  return window.navigator.language?.toLowerCase().startsWith('ta') ? 'ta' : 'en'
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
