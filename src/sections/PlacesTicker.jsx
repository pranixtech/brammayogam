import { useLanguage } from '../i18n/LanguageContext'
import { getSacredPlaces } from '../i18n/siteContent'

export function PlacesTicker() {
  const { language } = useLanguage()
  const places = getSacredPlaces(language)
  const repeatedPlaces = [...places, ...places]

  return (
    <section className="places-ticker" aria-label={language === 'ta' ? 'ஆன்மீகப் பயணத்தின் புனிதத் தலங்கள்' : 'Sacred places of the journey'}>
      <div className="places-ticker__track">
        {repeatedPlaces.map((place, index) => (
          <span key={`${place}-${index}`}><i aria-hidden="true">✦</i>{place}</span>
        ))}
      </div>
    </section>
  )
}
