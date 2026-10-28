import { FULL_JOURNEY_CHAPTERS } from '../data/siteContent'

export function ChaptersSection() {
  return (
    <section
      className="full-journey-section section-padding"
      id="chapters"
      aria-labelledby="chapters-title"
    >
      <header className="full-journey-section__header">
        <p className="section-kicker">The complete journey</p>
        <h2 id="chapters-title">Chapters</h2>
      </header>

      <div className="full-journey-section__layout">
        <aside className="chapter-index" aria-label="Journey chapters">
          <span>Chapters</span>
          <ol>
            {FULL_JOURNEY_CHAPTERS.map(({ id, title }, index) => (
              <li key={id}>
                <a href={`#chapter-${id}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {title}
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <div className="chapter-list">
          {FULL_JOURNEY_CHAPTERS.map(({ id, title, paragraphs }, index) => (
            <article className="chapter" id={`chapter-${id}`} key={id}>
              <p className="chapter__number">Chapter {String(index + 1).padStart(2, '0')}</p>
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
