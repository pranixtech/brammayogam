import { useLanguage } from '../i18n/LanguageContext'

const ENERGIES_TAMIL = [
  {
    title: 'மன ஆற்றல்',
    english: 'Mental Energy',
    description: 'மனதை ஒருமுகப்படுத்தி, தேவையற்ற சிந்தனைகளைக் கடந்து அமைதியையும் மன உறுதியையும் வளர்த்தல்.',
  },
  {
    title: 'உள்ளுணர்வு',
    english: 'Inner Consciousness',
    description: 'தன்னையும் தனது எண்ணங்களையும் ஆழமாக உணர்ந்து, உள்ளார்ந்த தெளிவையும் விழிப்புணர்வையும் வளர்த்தல்.',
  },
  {
    title: 'பிரபஞ்ச உணர்வு',
    english: 'Cosmic Consciousness',
    description: 'பிரபஞ்சத்தின் பேரியக்கம், இயற்கையின் நுண்ணிய அலைவரிசைகள் மற்றும் உயிர்களின் ஒன்றிணைந்த தன்மை குறித்த ஆன்மீகப் புரிதலை வளர்த்தல்.',
  },
  {
    title: 'தியான ஆற்றல்',
    english: 'Meditative Energy',
    description: 'ஆழ்ந்த தியானத்தின் மூலம் மன ஒருமைப்பாடு, உள்ளார்ந்த அமைதி மற்றும் விழிப்புணர்வை மேம்படுத்துதல்.',
  },
  {
    title: 'சித்தர்களின் ஞானம்',
    english: 'Siddhar Wisdom',
    description: 'பதினெண் சித்தர்கள் மற்றும் ஞான மரபுகள் உணர்த்திய யோகம், தவம், தியானம், காயகற்பம், மூச்சுப் பயிற்சி மற்றும் ஆன்மீக ஞானக் கோட்பாடுகளை அறிதல்.',
  },
  {
    title: 'கர்ம வினை ஞானம்',
    english: 'Karma & Spiritual Wisdom',
    description: 'கர்ம வினைகளின் இயல்பு, எண்ணங்கள் மற்றும் செயல்களின் விளைவுகள், பிறப்பு மற்றும் மறுபிறப்பு குறித்த ஆன்மீகத் தத்துவங்களைப் புரிந்துகொள்ளுதல். நற்செயல்கள், நற்பண்புகள் மற்றும் விழிப்புணர்வான வாழ்க்கையின் முக்கியத்துவத்தை உணர்தல்.',
  },
  {
    title: 'குண்டலினி மற்றும் சக்கர ஞானம்',
    english: 'Kundalini & Chakra Wisdom',
    description: 'யோக மரபில் கூறப்படும் குண்டலினி தத்துவம், ஆதாரச் சக்கரங்கள் மற்றும் மனிதனின் உள்ளார்ந்த ஆற்றல் நிலைகள் குறித்த புரிதலை வளர்த்தல்.',
  },
  {
    title: 'பிரம்ம ஞானம்',
    english: 'Brahma Gnanam',
    description: 'உடல், மனம், எண்ணங்கள் ஆகியவற்றின் இயல்பை ஆராய்ந்து, தன்னுடைய உண்மையான இயல்பை உணர்வதற்கான ஞானத் தேடல்.',
  },
  {
    title: 'ஆன்மீக உயர்வு',
    english: 'Spiritual Evolution',
    description: 'அகந்தை, அறியாமை மற்றும் பற்றுதல்களைக் கடந்து அன்பு, கருணை, பொறுமை, சமநிலை மற்றும் பேருணர்வு நிறைந்த வாழ்க்கையை உருவாக்குதல்.',
  },
  {
    title: 'முக்தி ஞானம்',
    english: 'Moksha Gnanam',
    description: 'பிறப்பு, இறப்பு, கர்மம் மற்றும் ஆன்மாவின் இயல்பு குறித்த ஆழமான ஆன்மீகத் தத்துவங்களை உணர்ந்து, முக்தி எனும் உயரிய விடுதலை நிலையை நோக்கிப் பயணித்தல்.',
  },
]

const ENERGIES_ENGLISH = [
  { title: 'Mental Energy', description: 'Training the mind to remain focused, move beyond unnecessary thoughts, and develop peace and inner strength.' },
  { title: 'Inner Consciousness', description: 'Deeply observing oneself and one’s thoughts to cultivate inner clarity and awareness.' },
  { title: 'Cosmic Consciousness', description: 'Developing a spiritual understanding of the universe, nature’s subtle frequencies, and the interconnectedness of all life.' },
  { title: 'Meditative Energy', description: 'Strengthening concentration, inner peace, and awareness through deep meditation.' },
  { title: 'Siddhar Wisdom', description: 'Learning the principles of yoga, tapas, meditation, kayakalpa, breath practice, and spiritual wisdom taught by the eighteen Siddhars and wisdom traditions.' },
  { title: 'Karma & Spiritual Wisdom', description: 'Understanding karma, the effects of thought and action, birth and rebirth, and the value of virtuous, mindful living.' },
  { title: 'Kundalini & Chakra Wisdom', description: 'Developing an understanding of Kundalini philosophy, the chakras, and the inner energy states described in the yogic tradition.' },
  { title: 'Brahma Gnanam', description: 'Exploring the nature of body, mind, and thought in a search to realize one’s true nature.' },
  { title: 'Spiritual Evolution', description: 'Moving beyond ego, ignorance, and attachment to cultivate love, compassion, patience, balance, and expanded awareness.' },
  { title: 'Moksha Gnanam', description: 'Understanding the deeper spiritual philosophy of birth, death, karma, and the soul while journeying toward liberation.' },
]

const JOURNEY_WORDS_TAMIL = [
  'அறிதல்',
  'உணர்தல்',
  'அனுபவித்தல்',
  'ஆராய்தல்',
  'தெளிதல்',
  'விழித்தல்',
  'பரிணமித்தல்',
  'ஞானமடைதல்',
  'பேருணர்வில் உயர்தல்',
]

const JOURNEY_WORDS_ENGLISH = [
  'Knowing', 'Realizing', 'Experiencing', 'Exploring', 'Clarifying', 'Awakening', 'Evolving', 'Attaining wisdom', 'Rising into higher consciousness',
]

const COPY = {
  en: {
    kicker: 'The wisdom path of the Siddhars', title: 'Brahma Yogam – Cosmic Energy & Siddhar Wisdom', subtitle: 'பிரம்ம யோகம் – பிரபஞ்சப் பேராற்றலும் சித்தர்களின் ஞானமும்',
    intro: [
      'The energy of Brahma Yogam is more than physical strength or mental determination. It is an integrated state of mental peace, deep meditation, clear thought, self-awareness, and spiritual wisdom.',
      'Brahma Yogam is a spiritual journey that embraces the wisdom traditions of the Siddhars, the philosophy of karma, the subtle frequencies of the universe, spiritual energies, and the profound search for liberation.',
    ],
    energyKicker: 'Ten states of wisdom', energyTitle: 'The essential energies of Brahma Yogam',
    purposeKicker: 'The higher purpose', purposeTitle: 'The higher purpose of Brahma Yogam',
    purpose: [
      'The true purpose of Brahma Yogam is not to become greater than others, but to remove the ignorance within and realize true wisdom.',
      'By deeply understanding the wisdom paths taught by the Siddhars, the principles of karma, and the great movement of the universe, a person can approach life with renewed awareness.',
      'When the mind becomes peaceful, inner awareness becomes clear. When awareness becomes clear, thoughts become refined. When thoughts become refined, actions become elevated. In this way, a person evolves toward a life filled with love, compassion, wisdom, and spiritual maturity.',
    ],
    journeyKicker: 'The wisdom journey', journeyTitle: 'The wisdom journey of Brahma Yogam', journeyAria: 'Stages of the Brahma Yogam wisdom journey',
    journeyBody: 'Let us recognize the wonders of the universe, absorb the wisdom of the Siddhars, understand the principles of karma, experience the depth of meditation, cultivate inner awareness, and move forward on the noble spiritual journey toward the wisdom of liberation.',
    quote: 'Brahma Yogam is more than a journey in search of power; it is a spiritual journey that realizes the great truth within and blossoms toward the highest dimension of wisdom.',
    author: '– Guru Brahmashri Harish',
  },
  ta: {
    kicker: 'சித்தர்களின் ஞானப் பாதை', title: 'பிரம்ம யோகம் – பிரபஞ்சப் பேராற்றலும் சித்தர்களின் ஞானமும்', subtitle: 'Brahma Yogam – Cosmic Energy & Siddhar Wisdom',
    intro: [
      'பிரம்ம யோகத்தின் ஆற்றல் என்பது வெறும் உடல் வலிமையோ அல்லது மன உறுதியோ மட்டுமல்ல. அது மன அமைதி, ஆழ்ந்த தியானம், தெளிவான சிந்தனை, சுய விழிப்புணர்வு மற்றும் ஆன்மீக ஞானம் ஆகியவற்றின் ஒருங்கிணைந்த நிலையாகும்.',
      'பிரம்ம யோகம் என்பது சித்தர்கள் உணர்த்திய ஞான மரபுகள், கர்ம வினைத் தத்துவங்கள், பிரபஞ்சத்தின் நுண்ணிய அலைவரிசைகள், ஆன்மீக ஆற்றல்கள் மற்றும் முக்தி நிலை குறித்த ஆழமான தேடல்களையும் உள்ளடக்கிய ஆன்மீகப் பயணமாகும்.',
    ],
    energyKicker: 'பத்து ஞான நிலைகள்', energyTitle: 'பிரம்ம யோகத்தின் முக்கிய ஆற்றல்கள்',
    purposeKicker: 'உயர்ந்த நோக்கம்', purposeTitle: 'பிரம்ம யோகத்தின் உயர்ந்த நோக்கம்',
    purpose: [
      'பிரம்ம யோகத்தின் உண்மையான நோக்கம் பிறரைக் காட்டிலும் உயர்ந்தவராக மாறுவது அல்ல; தன்னுள் இருக்கும் அறியாமையை நீக்கி, உண்மையான ஞானத்தை உணர்வதே ஆகும்.',
      'சித்தர்கள் உணர்த்திய ஞான வழிமுறைகளையும், கர்ம வினையின் தத்துவங்களையும், பிரபஞ்சத்தின் பேரியக்கத்தையும் ஆழமாகப் புரிந்துகொள்வதன் மூலம் மனிதன் தனது வாழ்க்கையைப் புதிய விழிப்புணர்வுடன் அணுக முடியும்.',
      'மனம் அமைதியடையும்போது உள்ளுணர்வு தெளிவடைகிறது. உள்ளுணர்வு தெளிவடையும்போது சிந்தனைகள் செம்மையடைகின்றன. சிந்தனைகள் செம்மையடையும்போது செயல்கள் உயர்வடைகின்றன. இவ்வாறு அன்பு, கருணை, ஞானம் மற்றும் ஆன்மீகப் பக்குவம் நிறைந்த வாழ்க்கையை நோக்கி மனிதன் பரிணமிக்கிறான்.',
    ],
    journeyKicker: 'ஞானப் பயணம்', journeyTitle: 'பிரம்ம யோகத்தின் ஞானப் பயணம்', journeyAria: 'பிரம்ம யோகத்தின் ஞானப் பயண நிலைகள்',
    journeyBody: 'பிரபஞ்சத்தின் அற்புதங்களை உணர்வோம்; சித்தர்களின் ஞானத்தை உள்வாங்குவோம்; கர்மத்தின் தத்துவங்களைப் புரிந்துகொள்வோம்; தியானத்தின் ஆழத்தை அனுபவிப்போம்; உள்ளுணர்வை வளர்ப்போம்; முக்தி ஞானத்தை நோக்கிய உயரிய ஆன்மீகப் பயணத்தில் முன்னேறுவோம்.',
    quote: 'பிரம்ம யோகம் என்பது சக்தியைத் தேடும் பயணம் மட்டுமல்ல; தன்னுள் உறையும் பேருண்மையை உணர்ந்து, ஞானத்தின் உயரிய பரிமாணத்தை நோக்கி மலரும் ஆன்மீகப் பயணம்.',
    author: '– குரு பிரம்மஶ்ரீ ஹரீஷ்',
  },
}

export function BrahmaYogamSection() {
  const { language } = useLanguage()
  const copy = COPY[language]
  const energies = language === 'ta' ? ENERGIES_TAMIL : ENERGIES_ENGLISH
  const journeyWords = language === 'ta' ? JOURNEY_WORDS_TAMIL : JOURNEY_WORDS_ENGLISH
  return (
    <section className="brahma-yogam-section section-padding" id="brahma-yogam" lang={language} aria-labelledby="brahma-yogam-title">
      <header className="brahma-yogam-section__hero">
        <p className="section-kicker">{copy.kicker}</p>
        <h1 id="brahma-yogam-title">{copy.title}</h1>
        <p className="brahma-yogam-section__english-title" lang={language === 'ta' ? 'en' : 'ta'}>{copy.subtitle}</p>
        <div className="brahma-yogam-section__intro">
          {copy.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </header>

      <div className="brahma-yogam-section__content">
        <div className="brahma-yogam-section__heading">
          <p className="section-kicker">{copy.energyKicker}</p>
          <h2>{copy.energyTitle}</h2>
        </div>

        <ol className="brahma-energy-grid">
          {energies.map(({ title, english, description }, index) => (
            <li className="brahma-energy-card" key={title}>
              <span className="brahma-energy-card__number">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{title} {english && <small lang="en">{english}</small>}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>

        <article className="brahma-purpose-card">
          <p className="section-kicker">{copy.purposeKicker}</p>
          <h2>{copy.purposeTitle}</h2>
          {copy.purpose.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </article>

        <article className="brahma-wisdom-journey">
          <p className="section-kicker">{copy.journeyKicker}</p>
          <h2>{copy.journeyTitle}</h2>
          <div className="brahma-wisdom-journey__steps" aria-label={copy.journeyAria}>
            {journeyWords.map((word) => <span key={word}>{word}</span>)}
          </div>
          <p>{copy.journeyBody}</p>
          <blockquote>{copy.quote}</blockquote>
          <footer>{copy.author}</footer>
        </article>
      </div>
    </section>
  )
}
