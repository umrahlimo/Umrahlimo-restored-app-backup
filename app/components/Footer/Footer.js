'use client'

import Link from 'next/link'
import { useTranslation } from '../../../hooks/useTranslation'
import Logo from '../Logo/Logo'
import TripAdvisorBadge from '../TripAdvisorBadge/TripAdvisorBadge'
import './Footer.css'

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
)

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
  </svg>
)

const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
)

const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

export default function Footer() {
  const t = useTranslation()

  return (
    <footer id="contact" className="footer">
      <div className="container">
        {/* Footer Top - Brand & Social */}
        <div className="footer-top">
          <div className="footer-brand-section">
            <Link href="/" className="footer-logo">
              <Logo className="footer-logo-img" />
            </Link>
            <p className="footer-tagline">Premium Chauffeur Services for Sacred Journeys</p>
          </div>
          <div className="footer-social">
            <a href="https://wa.me/13024014991" className="social-link whatsapp" aria-label="WhatsApp USA">
              <WhatsAppIcon />
            </a>
            <a href="https://wa.me/966533924547" className="social-link whatsapp" aria-label="WhatsApp KSA">
              <WhatsAppIcon />
            </a>
            <a href="tel:+13024014991" className="social-link phone" aria-label="Phone">
              <PhoneIcon />
            </a>
            <a href="mailto:info@umrahlimo.com" className="social-link email" aria-label="Email">
              <EmailIcon />
            </a>
          </div>
        </div>

        <div className="footer-divider"></div>

        {/* Footer Main Content */}
        <div className="row g-4 footer-main">
          <div className="col-lg-4 col-md-6">
            <div className="footer-about">
              <h5 className="footer-title">About UmrahLimo</h5>
              <p className="footer-description">
                Experience premium chauffeur and transfer services for Umrah, Hajj, Ziyarah, and airport transfers. Serving pilgrims with excellence since 2015.
              </p>
              <div className="footer-features">
                <div className="footer-feature">
                  <span className="feature-check">✓</span>
                  <span>Licensed & Insured</span>
                </div>
                <div className="footer-feature">
                  <span className="feature-check">✓</span>
                  <span>Professional Chauffeurs</span>
                </div>
                <div className="footer-feature">
                  <span className="feature-check">✓</span>
                  <span>24/7 Availability</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-2 col-md-6">
            <h5 className="footer-title">{t('quickLinks')}</h5>
            <ul className="footer-links">
              <li><Link href="/">{t('home')}</Link></li>
              <li><Link href="/#about">{t('about')}</Link></li>
              <li><Link href="/#services">{t('services')}</Link></li>
              <li><Link href="/#fleet">{t('fleet')}</Link></li>
              <li><Link href="/booking">{t('bookNow')}</Link></li>
            </ul>
          </div>
          <div className="col-lg-3 col-md-6">
            <h5 className="footer-title">{t('ourServices')}</h5>
            <ul className="footer-links">
              <li><Link href="/#services">{t('airportTransfer')}</Link></li>
              <li><Link href="/#services">{t('umrahHajj')}</Link></li>
              <li><Link href="/#services">{t('corporateTravel')}</Link></li>
              <li><Link href="/#services">{t('toursSightseeing')}</Link></li>
              <li><Link href="/#services">VIP Services</Link></li>
            </ul>
          </div>
          <div className="col-lg-3 col-md-6">
            <h5 className="footer-title">{t('contactInfo')}</h5>
            <div className="footer-contact">
              <div className="footer-contact-item">
                <div className="contact-icon">
                  <LocationIcon />
                </div>
                <div className="contact-text">
                  <span>Level 26, King&apos;s Road Tower</span>
                  <span>King Abdul Aziz Road</span>
                  <span>Jeddah 21499, Saudi Arabia</span>
                </div>
              </div>
              <div className="footer-contact-item">
                <div className="contact-icon">
                  <PhoneIcon />
                </div>
                <div className="contact-text">
                  <a href="tel:+13024014991">🇺🇸 USA WhatsApp: +1 302-401-4991</a>
                  <a href="tel:+966533924547">🇸🇦 KSA: +966 53 392 4547</a>
                </div>
              </div>
              <div className="footer-contact-item">
                <div className="contact-icon">
                  <EmailIcon />
                </div>
                <a href="mailto:info@umrahlimo.com">info@umrahlimo.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="footer-copyright">
              © 2026 UmrahLimo. {t('allRightsReserved')}
            </p>
            <div className="footer-ta-badge">
              <TripAdvisorBadge />
            </div>
            <div className="footer-bottom-links">
              <Link href="#">Privacy Policy</Link>
              <Link href="#">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
