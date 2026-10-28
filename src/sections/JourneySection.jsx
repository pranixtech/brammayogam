import { useLanguage } from '../i18n/LanguageContext'

export function JourneySection() {
  const { t } = useLanguage()
  return (
    <section className="journey-section section-padding" id="journey" aria-labelledby="journey-title">
      <div className="journey-section__content">
        <h2 id="journey-title">{t('journey.title')}</h2>
        <p>{t('journey.description')}</p>
      </div>
    </section>
  )
}
