import { useLanguage } from '../i18n/LanguageContext'
import { getJourneyChapters } from '../i18n/siteContent'

export function ChaptersSection() {
  const { language, t } = useLanguage()
  const chapters = getJourneyChapters(language)
  return (
    <section
      className="full-journey-section section-padding"
      id="spiritual-journey"
      aria-labelledby="spiritual-journey-title"
    >
      <header className="full-journey-section__header">
        <p className="section-kicker">{t('biography.kicker')}</p>
        <h2 id="spiritual-journey-title">{t('biography.title')}</h2>
      </header>

      <div className="full-journey-section__layout">
        <aside className="chapter-index" aria-label={t('biography.sections')}>
          <span>{t('biography.index')}</span>
          <ol>
            {chapters.map(({ id, title }, index) => (
              <li key={id}>
                <a href={`#journey-${id}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {title}
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <div className="chapter-list">
          {chapters.map(({ id, title, paragraphs }, index) => (
            <article className="chapter" id={`journey-${id}`} key={id}>
              <p className="chapter__number">{t('biography.part')} {String(index + 1).padStart(2, '0')}</p>
              <h3>{title}</h3>
              <div className="chapter__body">
                {paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={`${id}-${paragraphIndex}`}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
