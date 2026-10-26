import guruPortrait from '../assets/sivapraba.jpeg'
import { GURU_NAME } from '../data/siteContent'

export function HeroSection() {
  return (
    <section className="hero-section" id="home">
      <div className="hero-section__glow" aria-hidden="true" />

      <div className="hero-section__copy">
        <p className="eyebrow"><span /> A living journey of awareness</p>
        <h1>Return to the<br /><em>stillness within.</em></h1>
        <p className="hero-section__intro">
          Brahma Yogam is an inward path through meditation, yoga and self-knowledge—an invitation to understand the mind, awaken awareness and meet life with compassion.
        </p>
        <div className="hero-section__actions">
          <a className="button button--primary" href="#journey">Begin the journey <span>↘</span></a>
          <a className="text-link" href="#guru">Meet the Guru <span>→</span></a>
        </div>
        <div className="hero-section__note">
          <span className="om-symbol">ॐ</span>
          <p><strong>Know yourself.</strong><br />The beginning of wisdom.</p>
        </div>
      </div>

      <div className="hero-portrait">
        <div className="mandala-rings" aria-hidden="true"><span /><span /><span /></div>
        <div className="portrait-arch"><img src={guruPortrait} alt={GURU_NAME} /></div>
        <p className="portrait-caption"><span>The guiding presence</span>{GURU_NAME}</p>
      </div>

      <a className="scroll-cue" href="#journey" aria-label="Scroll to the spiritual journey">
        <span>Explore</span><i />
      </a>
    </section>
  )
}
