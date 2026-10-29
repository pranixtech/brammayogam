import { ChaptersSection } from '../sections/ChaptersSection'
import { ContributionSection } from '../sections/ContributionSection'
import { HeroSection } from '../sections/HeroSection'
import { HomeVideosSection } from '../sections/HomeVideosSection'
import { ImageSliderSection } from '../sections/ImageSliderSection'
import { JourneySection } from '../sections/JourneySection'
import { PlacesTicker } from '../sections/PlacesTicker'
import { PurposeSection } from '../sections/PurposeSection'
import { TeachingsSection } from '../sections/TeachingsSection'
import { UpcomingActivitiesSection } from '../sections/UpcomingActivitiesSection'
import { UpcomingClassesSliderSection } from '../sections/UpcomingClassesSliderSection'
import { YogiEncounterSection } from '../sections/YogiEncounterSection'

export function HomePage() {
  return (
    <>
      <HeroSection />
      <UpcomingClassesSliderSection />
      <UpcomingActivitiesSection />
      <HomeVideosSection />
      <JourneySection />
      <ContributionSection />
      <YogiEncounterSection />
      <PlacesTicker />
      <ImageSliderSection />
      <ChaptersSection />
      <TeachingsSection />
      <PurposeSection />
    </>
  )
}
