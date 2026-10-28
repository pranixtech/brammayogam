import yogiEncounterImage from '../assets/yogi-encounter.jpeg'

export function YogiEncounterSection() {
  return (
    <section className="yogi-encounter-section section-padding" aria-labelledby="yogi-encounter-title">
      <div className="yogi-encounter-section__layout">
        <figure className="yogi-encounter-section__photo">
          <img
            src={yogiEncounterImage}
            alt="An elderly yogi with a long white beard standing beside a man in white"
            loading="lazy"
          />
        </figure>

        <div className="yogi-encounter-section__words">
          <p className="section-kicker">In the company of a yogi</p>
          <h2 id="yogi-encounter-title">A moment of quiet wisdom.</h2>
          <blockquote>
            “In the presence of a yogi, silence becomes a teaching—and the inward journey finds its way.”
          </blockquote>
        </div>
      </div>
    </section>
  )
}
