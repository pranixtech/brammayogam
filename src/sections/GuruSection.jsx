import { useLanguage } from '../i18n/LanguageContext'

export function GuruSection() {
  const { t } = useLanguage()
  return (
    <section className="guru-section section-padding" id="guru">
      <div className="guru-section__copy">
        <p className="section-kicker">{t('guru.kicker')}</p>
        <h2>{t('guru.titleTop')}<br />{t('guru.titleBottom')}</h2>
        <p className="guru-section__lead">
          {t('guru.lead')}
        </p>
        <p>
          {t('guru.body')}
        </p>
      </div>
    </section>
  )
}
