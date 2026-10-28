import { MainLogo } from '../components/common/MainLogo'
import { useLanguage } from '../i18n/useLanguage'

export function ComingSoonPage({ titleKey, action }) {
  const { language, t } = useLanguage()
  const title = t(`navigation.${titleKey}`)
  return (
    <section className="coming-soon-page section-padding" aria-labelledby="coming-soon-title">
      <div className="coming-soon-page__mark"><MainLogo className="coming-soon-page__logo" /></div>
      <p className="section-kicker">{title}</p>
      <h1 id="coming-soon-title">{t('comingSoon.title')} <em>{t('comingSoon.emphasis')}</em></h1>
      <p>
        {language === 'ta'
          ? `${title} ${t('comingSoon.descriptionEnd')}`
          : `${t('comingSoon.descriptionStart')} ${title.toLowerCase()} ${t('comingSoon.descriptionEnd')}`}
      </p>
      <a className="button button--primary" href={action?.href ?? '/#home'}>
        {action?.labelKey ? t(action.labelKey) : t('comingSoon.returnHome')} <span>↑</span>
      </a>
    </section>
  )
}
