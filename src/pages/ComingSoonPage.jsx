import { MainLogo } from '../components/common/MainLogo'

export function ComingSoonPage({ title, action }) {
  return (
    <section className="coming-soon-page section-padding" aria-labelledby="coming-soon-title">
      <div className="coming-soon-page__mark"><MainLogo className="coming-soon-page__logo" /></div>
      <p className="section-kicker">{title}</p>
      <h1 id="coming-soon-title">Coming <em>soon.</em></h1>
      <p>
        We are thoughtfully preparing this space. Details about {title.toLowerCase()} offerings will be available soon.
      </p>
      <a className="button button--primary" href={action?.href ?? '/#home'}>
        {action?.label ?? 'Return home'} <span>↑</span>
      </a>
    </section>
  )
}
