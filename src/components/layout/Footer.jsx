import { Brand } from '../common/Brand'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <section className="site-footer__identity" aria-labelledby="footer-organization-title">
          <Brand className="site-footer__brand" />
          <p className="site-footer__label" id="footer-organization-title">Organization</p>
          <p className="site-footer__organization">Brahmam Foundation</p>
        </section>

        <section className="site-footer__contact" aria-labelledby="footer-contact-title">
          <h2 id="footer-contact-title">Contact</h2>
          <div className="site-footer__contact-list">
            <a href="mailto:brahmamfoundation@gmail.com">
              <span>Email</span>
              <strong>brahmamfoundation@gmail.com</strong>
            </a>
            <a href="https://wa.me/919514313331" target="_blank" rel="noreferrer">
              <span>Phone / WhatsApp</span>
              <strong>+91 9514313331</strong>
            </a>
          </div>
        </section>

        <section className="site-footer__address" aria-labelledby="footer-address-title">
          <h2 id="footer-address-title">Address</h2>
          <address>
            <strong>Brahmam Foundation,</strong>
            <span>115C, Nainar Koil Street,</span>
            <span>Pudu Gummidipoondi, Gummidipoondi Post,</span>
            <span>Tiruvallur District, Chennai – 601 201,</span>
            <span>Tamil Nadu, India.</span>
          </address>
        </section>
      </div>

      <div className="site-footer__bottom">
        <p>© 2026 Brahmam Foundation. All Rights Reserved.</p>
      </div>
    </footer>
  )
}
