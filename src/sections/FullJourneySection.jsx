import {
  FULL_JOURNEY_CHAPTERS,
  FULL_JOURNEY_INTRO,
} from '../data/siteContent'

export function FullJourneySection() {
  return (
    <section
      className="full-journey-section section-padding"
      id="full-story"
      aria-labelledby="full-journey-title"
    >
      <header className="full-journey-section__header">
        <p className="section-kicker">In his own words</p>
        <h2 id="full-journey-title">Spiritual Journey<br /><em>The Search for Wisdom</em></h2>
        <p>{FULL_JOURNEY_INTRO}</p>
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
