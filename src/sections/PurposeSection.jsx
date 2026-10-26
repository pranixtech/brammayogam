import { LotusMark } from '../components/common/LotusMark'

export function PurposeSection() {
  return (
    <section className="purpose-section section-padding" id="purpose">
      <div className="purpose-section__mark"><LotusMark /></div>
      <p className="section-kicker section-kicker--light">The spiritual purpose</p>
      <h2>To know the mind is to<br />begin the inward journey.</h2>
      <p>
        Spirituality is more than an outer identity. Its essence is the realization of our inner nature—a movement toward peace, awareness and a more compassionate way of living. Brahma Yogam exists to help seekers explore the purpose of life through meditation, yoga and self-knowledge.
      </p>
      <a className="button button--outline" href="#home">Return to stillness <span>↑</span></a>
    </section>
  )
}
