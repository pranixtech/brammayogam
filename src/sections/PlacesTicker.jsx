import { SACRED_PLACES } from '../data/siteContent'

export function PlacesTicker() {
  const repeatedPlaces = [...SACRED_PLACES, ...SACRED_PLACES]

  return (
    <section className="places-ticker" aria-label="Sacred places of the journey">
      <div className="places-ticker__track">
        {repeatedPlaces.map((place, index) => (
          <span key={`${place}-${index}`}><i aria-hidden="true">✦</i>{place}</span>
        ))}
      </div>
    </section>
  )
}
