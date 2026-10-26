import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { FullJourneySection } from '../sections/FullJourneySection'
import { GuruSection } from '../sections/GuruSection'
import { HeroSection } from '../sections/HeroSection'
import { JourneySection } from '../sections/JourneySection'
import { PlacesTicker } from '../sections/PlacesTicker'
import { PurposeSection } from '../sections/PurposeSection'
import { QuoteSection } from '../sections/QuoteSection'
import { TeachingsSection } from '../sections/TeachingsSection'

export default function App() {
  return (
    <div className="site-shell">
      <Header />
      <main>
        <HeroSection />
        <QuoteSection />
        <JourneySection />
        <GuruSection />
        <PlacesTicker />
        <FullJourneySection />
        <TeachingsSection />
        <PurposeSection />
      </main>
      <Footer />
    </div>
  )
}
