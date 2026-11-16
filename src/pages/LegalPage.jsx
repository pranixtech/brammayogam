const CONTACT_DETAILS = [
  ['Organization', 'Brahmam Foundation'],
  ['Email', 'brahmamfoundation@gmail.com'],
  ['Phone / WhatsApp', '+91 9514313331'],
]

export function LegalPage({ policy }) {
  return (
    <article className="legal-page">
      <header className="legal-page__hero">
        <p className="section-kicker">Brahmam Foundation</p>
        <h1>{policy.title}</h1>
        <p className="legal-page__updated">Last updated: {policy.updated}</p>
      </header>

      <div className="legal-page__layout">
        <nav className="legal-page__toc" aria-label={`${policy.title} sections`}>
          <p>On this page</p>
          <ol>
            {policy.sections.map((section, index) => (
              <li key={section.title}>
                <a href={`#legal-section-${index + 1}`}>{section.title}</a>
              </li>
            ))}
            <li><a href="#legal-contact">Contact Us</a></li>
          </ol>
        </nav>

        <div className="legal-page__content">
          <section className="legal-page__introduction">
            {policy.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>

          {policy.sections.map((section, index) => (
            <section className="legal-page__section" id={`legal-section-${index + 1}`} key={section.title}>
              <span className="legal-page__number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.items && (
                <ul>
                  {section.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
              {section.after?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}

          <section className="legal-page__section legal-page__contact" id="legal-contact">
            <span className="legal-page__number" aria-hidden="true">{String(policy.sections.length + 1).padStart(2, '0')}</span>
            <h2>Contact Us</h2>
            <p>If you have questions, concerns, or requests regarding this policy, please contact us.</p>
            <dl>
              {CONTACT_DETAILS.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{label === 'Email' ? <a href={`mailto:${value}`}>{value}</a> : value}</dd>
                </div>
              ))}
            </dl>
            <address>
              Brahmam Foundation,<br />
              115C, Nainar Koil Street,<br />
              Pudu Gummidipoondi, Gummidipoondi Post,<br />
              Tiruvallur District, Chennai – 601 201,<br />
              Tamil Nadu, India.
            </address>
          </section>
        </div>
      </div>
    </article>
  )
}
