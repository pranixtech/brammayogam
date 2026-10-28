import { useLanguage } from '../i18n/useLanguage'
import { getTeachingAreas } from '../i18n/siteContent'

export function TeachingsSection() {
  const { language, t } = useLanguage()
  const teachingAreas = getTeachingAreas(language)
  return (
    <section className="teachings-section section-padding" id="teachings">
      <div className="teachings-section__intro">
        <p className="section-kicker">{t('teachings.kicker')}</p>
        <h2>{t('teachings.titleTop')}<br />{t('teachings.titleBottom')}</h2>
        <p>
          {t('teachings.description')}
        </p>
      </div>

      <div className="teaching-orbit" aria-label={t('teachings.aria')}>
        <div className="teaching-orbit__center"><span>ॐ</span><strong>{t('teachings.awareness')}</strong></div>
        {teachingAreas.map(({ id, title, subtitle }, index) => (
          <div className={`teaching-orbit__item teaching-orbit__item--${index + 1}`} key={id}>
            <span>{id}</span><strong>{title}</strong><small>{subtitle}</small>
          </div>
        ))}
      </div>
    </section>
  )
}
