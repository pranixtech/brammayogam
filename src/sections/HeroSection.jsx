import meditationImage from '../assets/meditation-home.jpeg'
import { useLanguage } from '../i18n/LanguageContext'

export function HeroSection() {
  const { t } = useLanguage()
  return (
    <section className="meditation-hero" id="home">
      <figure className="meditation-hero__portrait">
        <img
          className="meditation-hero__image"
          src={meditationImage}
          alt={t('hero.imageAlt')}
        />
      </figure>

      <article className="meditation-letter" aria-label={t('hero.reflection')}>
        <blockquote>
          {t('hero.quote')}
        </blockquote>
        <footer>{t('hero.author')}</footer>
      </article>
    </section>
  )
}
