import { TEACHING_AREAS } from '../data/siteContent'

export function TeachingsSection() {
  return (
    <section className="teachings-section section-padding" id="teachings">
      <div className="teachings-section__intro">
        <p className="section-kicker">The field of inquiry</p>
        <h2>Ancient wisdom.<br />Living awareness.</h2>
        <p>
          The work continues through questions that have accompanied seekers for centuries—explored not as abstract ideas, but as a lived practice.
        </p>
      </div>

      <div className="teaching-orbit" aria-label="Areas of spiritual inquiry">
        <div className="teaching-orbit__center"><span>ॐ</span><strong>Awareness</strong></div>
        {TEACHING_AREAS.map(({ id, title, subtitle }, index) => (
          <div className={`teaching-orbit__item teaching-orbit__item--${index + 1}`} key={id}>
            <span>{id}</span><strong>{title}</strong><small>{subtitle}</small>
          </div>
        ))}
      </div>
    </section>
  )
}
