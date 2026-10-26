import { JOURNEY_STAGES } from '../data/siteContent'

export function JourneySection() {
  return (
    <section className="journey-section section-padding" id="journey">
      <div className="section-heading">
        <div>
          <p className="section-kicker section-kicker--light">The path unfolds</p>
          <h2>A journey shaped<br />by experience</h2>
        </div>
        <p>Not a path of escape, but a life examined deeply—through dreams and disappointments, silence and surrender, hunger and grace.</p>
      </div>

      <div className="journey-list">
        {JOURNEY_STAGES.map(({ id, title, description }) => (
          <article className="journey-card" key={id}>
            <span className="journey-card__number">{id}</span>
            <h3>{title}</h3>
            <p>{description}</p>
            <span className="journey-card__symbol" aria-hidden="true">✦</span>
          </article>
        ))}
      </div>
    </section>
  )
}
