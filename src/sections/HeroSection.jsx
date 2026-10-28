import meditationImage from '../assets/meditation-home.jpeg'

export function HeroSection() {
  return (
    <section className="meditation-hero" id="home">
      <figure className="meditation-hero__portrait">
        <img
          className="meditation-hero__image"
          src={meditationImage}
          alt="Guru Brahmashri Harish meditating before a mountain range"
        />
      </figure>

      <article className="meditation-letter" aria-label="A spiritual reflection">
        <blockquote>
          Wherever darkness prevails, God reveals Himself as the light.
        </blockquote>
        <footer>— Guru Brahmashri Harish</footer>
      </article>
    </section>
  )
}
