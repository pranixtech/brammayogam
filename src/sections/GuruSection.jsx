import guruPortrait from '../assets/sivapraba.jpeg'
import { LotusMark } from '../components/common/LotusMark'
import { GURU_NAME } from '../data/siteContent'

export function GuruSection() {
  return (
    <section className="guru-section section-padding" id="guru">
      <div className="guru-section__image-column">
        <div className="guru-portrait">
          <div className="guru-portrait__halo" aria-hidden="true" />
          <img src={guruPortrait} alt="Sri Sivaprabakara Siddha Yogi Swamigal seated in blessing" />
          <span className="guru-portrait__blessing" aria-hidden="true">ॐ</span>
        </div>
      </div>

      <div className="guru-section__copy">
        <p className="section-kicker">Grace found the seeker</p>
        <h2>The arrival<br />of the Guru</h2>
        <p className="guru-section__lead">
          On a silent mountainside in Omallur, an elderly yogi appeared before a seeker in meditation and whispered the practice of Brahma Yoga into his ear.
        </p>
        <p>
          When the meditation ended, the elder was gone. Behind the curtain of the locked Jeeva Samadhi was his photograph—the same presence the seeker felt had offered help during his hour of need in Kashi. In that recognition, teacher and path became one.
        </p>
        <div className="guru-name-card">
          <LotusMark size="small" />
          <div><span>Revered Guru</span><strong>{GURU_NAME}</strong></div>
        </div>
      </div>
    </section>
  )
}
