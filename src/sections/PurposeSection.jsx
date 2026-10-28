import { MainLogo } from '../components/common/MainLogo'
import { useLanguage } from '../i18n/useLanguage'

export function PurposeSection() {
  const { t } = useLanguage()
  return (
    <section className="purpose-section section-padding" id="purpose">
      <div className="purpose-section__mark"><MainLogo className="purpose-section__logo" /></div>
      <p className="section-kicker section-kicker--light">{t('purpose.kicker')}</p>
      <h2>{t('purpose.titleTop')}<br />{t('purpose.titleBottom')}</h2>
      <p>
        {t('purpose.description')}
      </p>
      <a className="button button--outline" href="#home">{t('purpose.action')} <span>↑</span></a>
    </section>
  )
}
