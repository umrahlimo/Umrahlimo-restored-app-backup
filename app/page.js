'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import SearchBar from './components/SearchBar'
import Logo from './components/Logo/Logo'
import PortalNavbar from './components/Navbar/PortalNavbar'
import TestimonialsCarousel from './components/TestimonialsCarousel/TestimonialsCarousel'
import styles from './page.module.css'
import Script from 'next/script'
import { TRIPADVISOR_LISTING_URL } from '../lib/tripAdvisor'
import { buildLocalBusinessSchema, buildFaqSchema, HOMEPAGE_FAQS } from '../lib/seo/schemas'
import { useLanguage } from '../context/LanguageContext'
import { translations } from '../translations/translations'

/* ━━━ Hero Carousel Images (static) ━━━ */
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1513072064285-240f87fa81e8?w=1920&q=80&fit=crop',
  '/Hero_Makkah.jpeg',
  '/Hero_Med.jpeg',
  '/Hero_Makkah-image.jpeg',
]

/* ━━━ Offer Banner Images (static) ━━━ */
const OFFER_IMAGES = [
  '/banners/banner1.jpg',
  '/banners/banner2.jpg',
  '/banners/banner3.jpg',
  '/banners/banner4.jpg',
]

/* ━━━ Services (static icons/hrefs only) ━━━ */
const SERVICE_META = [
  { icon: 'plane', href: '/popular-routes' },
  { icon: 'kaaba', href: '/popular-routes' },
  { icon: 'mosque', href: '/popular-routes' },
  { icon: 'route', href: '/popular-routes' },
]

/* ━━━ Popular Route Cards ━━━ */
const ROUTE_CARDS = [
  { from: 'Jeddah Airport', to: 'Makkah Hotel', duration: '~1.5 hrs', image: 'https://images.unsplash.com/photo-1554794470-42d3cd193ecc?w=640&q=80&fit=crop', href: '/transfer/jeddah-airport-to-makkah' },
  { from: 'Jeddah Airport', to: 'Madinah Hotel', duration: '~4 hrs', image: 'https://images.unsplash.com/photo-1523151164408-6540213bd2c8?w=640&q=80&fit=crop', href: '/transfer/jeddah-airport-to-madinah' },
  { from: 'Madinah Airport', to: 'Madinah Hotel', duration: '~30 min', image: 'https://images.unsplash.com/photo-1523151164408-6540213bd2c8?w=640&q=80&fit=crop', href: '/transfer/madinah-airport-to-madinah' },
  { from: 'Makkah Hotel', to: 'Madinah Hotel', duration: '~4.5 hrs', image: 'https://images.unsplash.com/photo-1693590614566-1d3ea9ef32f7?w=640&q=80&fit=crop', href: '/transfer/makkah-to-madinah' },
  { from: 'Makkah Hotel', to: 'Jeddah Airport', duration: '~1.5 hrs', image: 'https://images.unsplash.com/photo-1513072064285-240f87fa81e8?w=640&q=80&fit=crop', href: '/transfer/makkah-to-jeddah-airport' },
  { from: 'Makkah Hotel', to: 'Taif Mazarats', duration: '~2 hrs', image: 'https://images.unsplash.com/photo-1554794470-42d3cd193ecc?w=640&q=80&fit=crop', href: '/transfer/makkah-to-taif' },
]

/* ━━━ Why Choose Us (static icons only) ━━━ */
const WHY_ICONS = ['price', 'greet', 'flight', 'support', 'cancel', 'verified']

/* ━━━ Fleet ━━━ */
const FLEET_GROUPS = [
  {
    title: 'Sedans & Comfort',
    vehicles: [
      { name: 'Lexus ES', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/377/1775096656054-fa45f2484ceb.png' },
      { name: 'Toyota Camry', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/358/1775205805712-b6e49f8a9d71.jpg' },
      { name: 'Skoda Octavia', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/304/1774278964349-3145bfcc6376.png' },
      { name: 'Honda Accord', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/118/1770209448250-xmv54f.jpg' },
      { name: 'Tesla Model 3', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/129/1771613320435-dc53d28f5869.jpg' },
      { name: 'Audi Q7', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/314/1774260842719-556d94779519.jpg' },
      { name: 'KIA K5', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/484/1775075521671-3b005d5cc95d.jpg' },
      { name: 'Lincoln Continental', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/183/1771703242674-169716cbdf8a.jpg' }
    ]
  },
  {
    title: 'Vans & Minivans',
    vehicles: [
      { name: 'Mercedes V-Class', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/159/1771585822576-af18ef5d2550.jpg' },
      { name: 'Hyundai Staria', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/148/1771574575974-62b82177041a.jpg' },
      { name: 'Toyota Alphard', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/306/1774866840869-475daa39bb2e.jpg' },
      { name: 'Chrysler Pacifica', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/369/1774372869513-847bdfdea5ea.jpg' },
      { name: 'Mercedes V-Class', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/474/1774973390481-489ad7808a6e.jpg' },
      { name: 'Mercedes V-Class', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/208/1774560741224-646286cc664c.jpg' },
      { name: 'Buick GL8', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/188/1771740689064-34c3605a8f95.png' },
      { name: 'Mercedes V-Klass', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/253/1773526342663-10d4ed2f4b3d.jpg' }
    ]
  },
  {
    title: 'Minibuses & Buses',
    vehicles: [
      { name: 'Mercedes Sprinter', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/325/1774633141111-ef24d8d79d50.jpg' },
      { name: 'Renault Traffic', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/408/1774937974912-569ff807681d.jpg' },
      { name: 'Toyota Coaster', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/188/1774878328736-673029ea5a1f.jpg' },
      { name: 'Toyota Grand Hiace', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/103/1774271675659-4b93d6b7cb51.jpg' },
      { name: 'Setra Coach', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/308/1774259560502-d7f005f02e12.jpg' },
      { name: 'Prevost H3', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/461/1774905599061-727b6b4ecf28.jpg' },
      { name: 'YuTong Coach', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/188/1771823812734-6f1d6fff94e2.png' },
      { name: 'JMC Minibus', image: 'https://airporttransfer-files.ams3.cdn.digitaloceanspaces.com/vehicle-images/188/1771841056655-d518a588f9bf.png' }
    ]
  }
]

/* ━━━ Popular Airports ━━━ */
const POPULAR_AIRPORTS = [
  { code: 'JED', city: 'Jeddah',    href: '/airport-guides/jed', image: 'https://images.unsplash.com/photo-1554794470-42d3cd193ecc?w=640&q=80&fit=crop' },
  { code: 'MED', city: 'Madinah',   href: '/airport-guides/med', image: 'https://images.unsplash.com/photo-1523151164408-6540213bd2c8?w=640&q=80&fit=crop' },
  { code: 'RUH', city: 'Riyadh',    href: '/airport-guides/ruh', image: 'https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=640&q=80&fit=crop' },
  { code: 'TIF', city: 'Taif',      href: '/airport-guides/jed', image: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=640&q=80&fit=crop' },
  { code: 'ISB', city: 'Islamabad', href: '/airport-guides/isb', image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=640&q=80&fit=crop' },
  { code: 'LHE', city: 'Lahore',    href: '/airport-guides/lhe', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=640&q=80&fit=crop' },
  { code: 'KHI', city: 'Karachi',   href: '/airport-guides/khi', image: 'https://images.unsplash.com/photo-1586281010784-1a6ebba19ae2?w=640&q=80&fit=crop' },
  { code: 'LHR', city: 'London',    href: '/airport-guides/lhr', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=640&q=80&fit=crop' },
]

/* ━━━ Worldwide Links ━━━ */
const WORLDWIDE_COLUMNS = [
  {
    title: 'Top Cities',
    links: [
      { label: 'Makkah',     href: '/city/makkah' },
      { label: 'Madinah',    href: '/city/madinah' },
      { label: 'Jeddah',     href: '/city/jeddah' },
      { label: 'Riyadh',     href: '/city/riyadh' },
      { label: 'Taif',       href: '/city/taif' },
      { label: 'Islamabad',  href: '/city/islamabad' },
      { label: 'Lahore',     href: '/city/lahore' },
      { label: 'Karachi',    href: '/city/karachi' },
    ]
  },
  {
    title: 'Top Airports',
    links: [
      { label: 'Jeddah KAIA (JED)',    href: '/airport/jed' },
      { label: 'Madinah Airport (MED)', href: '/airport/med' },
      { label: 'Riyadh Airport (RUH)', href: '/airport/ruh' },
      { label: 'Taif Airport (TIF)',   href: '/airport/tif' },
      { label: 'Islamabad Intl (ISB)', href: '/airport/isb' },
      { label: 'Lahore Airport (LHE)', href: '/airport/lhe' },
      { label: 'Karachi Airport (KHI)', href: '/airport/khi' },
      { label: 'London Heathrow (LHR)', href: '/airport/lhr' },
    ]
  },
  {
    title: 'Popular Transfer Routes',
    links: [
      { label: 'Jeddah Airport → Makkah',         href: '/transfer/jeddah-airport-to-makkah' },
      { label: 'Jeddah Airport → Madinah',         href: '/transfer/jeddah-airport-to-madinah' },
      { label: 'Madinah Airport → Hotel',          href: '/transfer/madinah-airport-to-madinah' },
      { label: 'Makkah → Madinah',                 href: '/transfer/makkah-to-madinah' },
      { label: 'Madinah → Makkah',                 href: '/transfer/madinah-to-makkah' },
      { label: 'Makkah → Jeddah Airport',          href: '/transfer/makkah-to-jeddah-airport' },
      { label: 'Makkah → Taif',                    href: '/transfer/makkah-to-taif' },
      { label: 'All transfer routes',              href: '/transfer' },
    ]
  },
  {
    title: 'Travel Tips & Guides',
    links: [
      { label: 'Umrah Travel Guide',       href: '/blog/umrah-hajj-airport-transfer-guide' },
      { label: 'Save on Transfers',        href: '/blog/how-to-save-money-on-airport-transfers' },
      { label: 'Transfer vs Taxi',         href: '/blog/airport-transfer-vs-taxi-which-is-better' },
      { label: 'Traveling with Kids',      href: '/blog/traveling-with-children-airport-transfer-tips' },
      { label: 'Business Travel Guide',    href: '/blog/business-travel-airport-transfer-guide' },
      { label: 'Jeddah Transfer Guide',    href: '/blog/jeddah-airport-transfer-guide' },
      { label: 'All Travel Tips →',        href: '/travel-tips' },
    ]
  }
]

/* ━━━ Footer ━━━ */
const FOOTER_COLUMNS = [
  {
    title: 'Quick Links',
    links: [
      { label: 'Search Transfers', href: '/' }, { label: 'Popular Routes', href: '/popular-routes' },
      { label: 'Airport Guides', href: '/airport-guides' }, { label: 'Travel Tips', href: '/travel-tips' },
      { label: 'Blog', href: '/blog' }
    ]
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/help' }, { label: 'Contact Us', href: '/contact' },
      { label: 'FAQs', href: '/faq' }, { label: 'Manage Booking', href: '/manage-booking' }
    ]
  },
  {
    title: 'Portals',
    links: [
      { label: 'My Bookings', href: '/customer/login' }, { label: 'Operator Login', href: '/supplier/login' },
      { label: 'Partner Login', href: '/partners/login' }
    ]
  },
  {
    title: 'Contact Us',
    links: [
      { label: '+1 302 401 4991', href: 'tel:+13024014991' },
      { label: 'info@umrahlimo.com', href: 'mailto:info@umrahlimo.com' },
      { label: 'Join as Operator', href: '/join-as-operator' },
      { label: 'Distribution Partners', href: '/partners' }
    ]
  }
]

/* ━━━ SVG Icons ━━━ */
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor" />
  </svg>
)

const ArrowLeft = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
)

const ArrowRight = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
)

const ServiceIcon = ({ type }) => {
  const icons = {
    plane: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>,
    kaaba: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.18L19 9v6l-7 3.89L5 15V9l7-4.82z"/></svg>,
    mosque: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 7h-3V4h-2v3h-3l-4-4-4 4H5V4H3v3H0v2h1v11h8v-5c0-1.66 1.34-3 3-3s3 1.34 3 3v5h8V9h1V7zm-9 13h-2v-5c0-2.76-2.24-5-5-5s-5 2.24-5 5v5H1V9h22v11h-8z"/></svg>,
    route: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 15H6l7-14v8h5l-7 14v-8z"/></svg>,
  }
  return <span className={styles.serviceIconSvg}>{icons[type]}</span>
}

const WhyIcon = ({ type }) => {
  const icons = {
    price: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>,
    greet: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
    flight: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>,
    support: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1 1 0 00-1.02.24l-2.2 2.2a15.05 15.05 0 01-6.59-6.59l2.2-2.2a1 1 0 00.24-1.02A11.36 11.36 0 018.5 4a1 1 0 00-1-1H4a1 1 0 00-1 1 17 17 0 0017 17 1 1 0 001-1v-3.5a1 1 0 00-1-1z"/></svg>,
    cancel: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>,
    verified: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>,
  }
  return <span className={styles.whyIconSvg}>{icons[type]}</span>
}

/* ━━━ HomepageAboutFaq — body copy + FAQ accordion (SEO section) ━━━ */
function HomepageAboutFaq({ faqs, t, tripadvisorUrl }) {
  const [openIdx, setOpenIdx] = useState(null)
  const toggle = (i) => setOpenIdx(openIdx === i ? null : i)

  return (
    <>
      {/* ── About / Body Copy ── */}
      <section className={`${styles.section} ${styles.whiteSection}`} aria-labelledby="about-umrahlimo">
        <div className={styles.container}>
          <div className={styles.aboutCopyGrid}>
            <div className={styles.aboutCopyText}>
              <h2 id="about-umrahlimo" className={styles.sectionTitle}>
                About UmrahLimo — Trusted Umrah Taxi & Airport Transfer Service
              </h2>
              <p>
                UmrahLimo is a premium Umrah taxi and airport transfer company founded in 2015,
                specialising in reliable, comfortable, and Nusuk-compliant transport for pilgrims
                and travellers across Saudi Arabia. We connect Jeddah Airport (JED), Makkah
                Al-Mukarramah, Madinah Al-Munawwarah, Taif, and Riyadh with a network of vetted
                local drivers operating luxury sedans, vans, minibuses, and coaches.
              </p>
              <p>
                Our unique <strong>pay deposit now, rest to driver on arrival</strong> model means
                you secure your transfer online with a small deposit — no full prepayment risk —
                and settle the remaining balance with your driver in cash or card on the day.
                This protects you while keeping the process simple and transparent.
              </p>
              <p>
                Rated <strong>4.5 out of 5 on TripAdvisor</strong> and ranked{' '}
                <a
                  href={tripadvisorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.inlineLink}
                >
                  #6 of 101 Transportation Providers in Mecca
                </a>
                , UmrahLimo has earned the trust of thousands of pilgrims from the United Kingdom,
                Pakistan, India, Turkey, and the Gulf. Our fleet is fully Nusuk-compliant, our
                drivers hold valid operating permits for the holy city zones, and every booking
                includes real-time flight tracking and a professional meet &amp; greet with a
                name board at the arrivals hall.
              </p>
              <p>
                Whether you are a first-time Umrah pilgrim needing a straightforward Jeddah Airport
                to Makkah hotel transfer, a family group travelling Makkah to Madinah with prayer
                stops en route, or a large Hajj group requiring multiple coaches, UmrahLimo offers
                fixed prices, 24/7 customer support, and free cancellation up to 24 hours before
                pickup — with no hidden charges, no surge pricing, and no meter surprises.
              </p>
            </div>

            <div className={styles.aboutCopyStats}>
              <div className={styles.aboutStatCard}>
                <span className={styles.aboutStatNum}>4.5★</span>
                <span className={styles.aboutStatLabel}>TripAdvisor Rating</span>
              </div>
              <div className={styles.aboutStatCard}>
                <span className={styles.aboutStatNum}>37+</span>
                <span className={styles.aboutStatLabel}>Verified Reviews</span>
              </div>
              <div className={styles.aboutStatCard}>
                <span className={styles.aboutStatNum}>2015</span>
                <span className={styles.aboutStatLabel}>Established</span>
              </div>
              <div className={styles.aboutStatCard}>
                <span className={styles.aboutStatNum}>24/7</span>
                <span className={styles.aboutStatLabel}>Customer Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Accordion ── */}
      <section className={`${styles.section} ${styles.graySection}`} id="faq" aria-labelledby="faq-heading">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 id="faq-heading" className={styles.sectionTitle}>
              Frequently Asked Questions
            </h2>
            <p className={styles.sectionSubtitle}>
              Everything you need to know before booking your Umrah taxi or airport transfer
            </p>
          </div>
          <div className={styles.faqList} role="list">
            {faqs.map((faq, i) => (
              <div key={i} className={styles.faqItem} role="listitem">
                <button
                  id={`faq-q-${i}`}
                  className={styles.faqQuestion}
                  aria-expanded={openIdx === i}
                  aria-controls={`faq-a-${i}`}
                  onClick={() => toggle(i)}
                >
                  <span>{faq.question}</span>
                  <span className={`${styles.faqChevron} ${openIdx === i ? styles.faqChevronOpen : ''}`} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </button>
                <div
                  id={`faq-a-${i}`}
                  role="region"
                  aria-labelledby={`faq-q-${i}`}
                  className={`${styles.faqAnswer} ${openIdx === i ? styles.faqAnswerOpen : ''}`}
                >
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function SectionHeader({ title, subtitle, subtitleLink, light }) {
  return (
    <div className={styles.sectionHeader}>
      <h2 className={`${styles.sectionTitle} ${light ? styles.lightTitle : ''}`}>{title}</h2>
      {subtitle && (
        subtitleLink ? (
          <a
            href={subtitleLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.sectionSubtitle} ${styles.tripAdvisorSubtitle} ${light ? styles.lightSubtitle : ''}`}
          >
            {subtitle}
          </a>
        ) : (
          <p className={`${styles.sectionSubtitle} ${light ? styles.lightSubtitle : ''}`}>{subtitle}</p>
        )
      )}
    </div>
  )
}


export default function Home() {
  const { language } = useLanguage()
  const t = translations[language] || translations.en

  /* ── Translated dynamic arrays ── */
  const HERO_SLIDES = [
    { image: HERO_IMAGES[0], heading: t.heroSlide1Heading, sub: t.heroSlide1Sub },
    { image: HERO_IMAGES[1], heading: t.heroSlide2Heading, sub: t.heroSlide2Sub },
    { image: HERO_IMAGES[2], heading: t.heroSlide3Heading, sub: t.heroSlide3Sub },
    { image: HERO_IMAGES[3], heading: t.heroSlide4Heading, sub: t.heroSlide4Sub },
  ]

  const OFFER_BANNERS = [
    { image: OFFER_IMAGES[0], title: t.offerBanner1Title, sub: t.offerBanner1Sub },
    { image: OFFER_IMAGES[1], title: t.offerBanner2Title, sub: t.offerBanner2Sub },
    { image: OFFER_IMAGES[2], title: t.offerBanner3Title, sub: t.offerBanner3Sub },
    { image: OFFER_IMAGES[3], title: t.offerBanner4Title, sub: t.offerBanner4Sub },
  ]

  const SERVICES = [
    { title: t.service1Title, description: t.service1Desc, icon: SERVICE_META[0].icon, href: SERVICE_META[0].href },
    { title: t.service2Title, description: t.service2Desc, icon: SERVICE_META[1].icon, href: SERVICE_META[1].href },
    { title: t.service3Title, description: t.service3Desc, icon: SERVICE_META[2].icon, href: SERVICE_META[2].href },
    { title: t.service4Title, description: t.service4Desc, icon: SERVICE_META[3].icon, href: SERVICE_META[3].href },
  ]

  const WHY_CHOOSE = [
    { title: t.whyFixedTitle, desc: t.whyFixedDesc, icon: WHY_ICONS[0] },
    { title: t.whyGreetTitle, desc: t.whyGreetDesc, icon: WHY_ICONS[1] },
    { title: t.whyFlightTitle, desc: t.whyFlightDesc, icon: WHY_ICONS[2] },
    { title: t.whySupportTitle, desc: t.whySupportDesc, icon: WHY_ICONS[3] },
    { title: t.whyCancelTitle, desc: t.whyCancelDesc, icon: WHY_ICONS[4] },
    { title: t.whyVerifiedTitle, desc: t.whyVerifiedDesc, icon: WHY_ICONS[5] },
  ]

  const FOOTER_COLUMNS_T = [
    { title: t.footerQuickLinks, links: FOOTER_COLUMNS[0].links },
    { title: t.footerSupport, links: FOOTER_COLUMNS[1].links },
    { title: t.footerPortals, links: FOOTER_COLUMNS[2].links },
    { title: t.footerContactUs, links: FOOTER_COLUMNS[3].links },
  ]

  /* ── Hero Carousel State ── */
  const [heroIdx, setHeroIdx] = useState(0)
  const heroRef = useRef(null)

  const resetHero = useCallback(() => {
    if (heroRef.current) clearInterval(heroRef.current)
    heroRef.current = setInterval(() => setHeroIdx(p => (p + 1) % HERO_SLIDES.length), 6000)
  }, [])

  useEffect(() => { resetHero(); return () => clearInterval(heroRef.current) }, [resetHero])
  const goHero = (i) => { setHeroIdx(i); resetHero() }

  /* ── Offers Carousel State ── */
  const [offerIdx, setOfferIdx] = useState(0)
  const offerRef = useRef(null)

  const resetOffer = useCallback(() => {
    if (offerRef.current) clearInterval(offerRef.current)
    offerRef.current = setInterval(() => setOfferIdx(p => (p + 1) % OFFER_BANNERS.length), 5000)
  }, [])

  useEffect(() => { resetOffer(); return () => clearInterval(offerRef.current) }, [resetOffer])
  const goOffer = (i) => { setOfferIdx(i); resetOffer() }

  /* ── Translated trust badges ── */
  const TRUST_BADGES_T = [
    t.freeCancellation || 'Free cancellation',
    t.meetAndGreet || 'Meet & greet',
    t.flightTracking || 'Flight tracking',
    t.support247 || '24/7 support',
  ]

  /* ── Worldwide column titles translated ── */
  const WORLDWIDE_COLUMNS_T = WORLDWIDE_COLUMNS.map((col) => {
    const titleMap = {
      'Top Cities': t.topCities || 'Top Cities',
      'Top Airports': t.topAirports || 'Top Airports',
      'Popular Transfer Routes': t.popularTransferRoutes || 'Popular Transfer Routes',
      'Travel Tips & Guides': t.travelTipsGuides || 'Travel Tips & Guides',
    }
    return { ...col, title: titleMap[col.title] || col.title }
  })

  return (
    <div className={styles.page}>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-4MSXXT9GMF"
        strategy="afterInteractive"
      />
      <Script id="gtag-init-ga4" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-4MSXXT9GMF');
        `}
      </Script>
      {/* FAQPage Schema — placed here because FAQ content is visible on this page */}
      <Script
        id="schema-faq"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildFaqSchema(HOMEPAGE_FAQS)),
        }}
      />
      <PortalNavbar />

      {/* ═══════ HERO CAROUSEL ═══════ */}
      <section className={styles.hero}>
        {HERO_SLIDES.map((slide, i) => (
          <div key={i} className={`${styles.heroSlide} ${i === heroIdx ? styles.heroSlideActive : ''}`}>
            <img src={slide.image} alt={slide.heading} className={styles.heroSlideImg} />
            <div className={styles.heroOverlay} />
          </div>
        ))}

        <div className={styles.heroContent}>
          <div className={styles.heroTextWrap}>
            <h1 className={styles.heroHeading}>
              {HERO_SLIDES[heroIdx].heading.split(' ').map((word, wi, arr) =>
                wi >= arr.length - 2
                  ? <span key={wi} className={styles.heroAccent}>{word}{wi < arr.length - 1 ? ' ' : ''}</span>
                  : word + ' '
              )}
            </h1>
            <p className={styles.heroSub}>{HERO_SLIDES[heroIdx].sub}</p>
          </div>

          <div className={styles.heroDots}>
            {HERO_SLIDES.map((_, i) => (
              <button key={i} className={`${styles.heroDot} ${i === heroIdx ? styles.heroDotActive : ''}`} onClick={() => goHero(i)} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>

          <button className={`${styles.heroArrow} ${styles.heroArrowL}`} onClick={() => goHero((heroIdx - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)} aria-label="Previous"><ArrowLeft /></button>
          <button className={`${styles.heroArrow} ${styles.heroArrowR}`} onClick={() => goHero((heroIdx + 1) % HERO_SLIDES.length)} aria-label="Next"><ArrowRight /></button>
        </div>
      </section>

      {/* ═══════ BOOKING / SEARCH ═══════ */}
      <section id="book-transfer" className={styles.bookingSection}>
        <div className={styles.container}>
          <div className={styles.trustRow}>
            {TRUST_BADGES_T.map((badge) => (
              <span key={badge} className={styles.trustBadge}><CheckIcon />{badge}</span>
            ))}
          </div>
          <div className={styles.bookingCard}>
            <div className={styles.searchMount}><SearchBar /></div>
          </div>
        </div>
      </section>

      <div className={styles.sectionGap} />

      {/* ═══════ OFFERS / PROMO CAROUSEL ═══════ */}
      <section className={styles.offersSection}>
        <div className={styles.container}>
          <SectionHeader title={t.sectionOffersTitle} subtitle={t.sectionOffersSubtitle} />
          <div className={styles.offersCarousel}>
            {OFFER_BANNERS.map((banner, i) => (
              <div key={i} className={`${styles.offerSlide} ${i === offerIdx ? styles.offerSlideActive : ''}`}>
                <img src={banner.image} alt={banner.title} className={styles.offerImg} />
                <div className={styles.offerOverlay} />
                <div className={styles.offerContent}>
                  <h3 className={styles.offerTitle}>{banner.title}</h3>
                  <p className={styles.offerSub}>{banner.sub}</p>
                  <Link href="/" className={styles.offerBtn}>{t.bookNow}</Link>
                </div>
              </div>
            ))}
            <button className={`${styles.offerArrow} ${styles.offerArrowL}`} onClick={() => goOffer((offerIdx - 1 + OFFER_BANNERS.length) % OFFER_BANNERS.length)} aria-label="Previous"><ArrowLeft /></button>
            <button className={`${styles.offerArrow} ${styles.offerArrowR}`} onClick={() => goOffer((offerIdx + 1) % OFFER_BANNERS.length)} aria-label="Next"><ArrowRight /></button>
            <div className={styles.offerDots}>
              {OFFER_BANNERS.map((_, i) => (
                <button key={i} className={`${styles.offerDot} ${i === offerIdx ? styles.offerDotActive : ''}`} onClick={() => goOffer(i)} aria-label={`Banner ${i + 1}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ SERVICES ═══════ */}
      <section className={`${styles.section} ${styles.whiteSection}`}>
        <div className={styles.container}>
          <SectionHeader title={t.sectionServicesTitle} subtitle={t.sectionServicesSubtitle} />
          <div className={styles.servicesGrid}>
            {SERVICES.map((svc) => (
              <Link key={svc.title} href={svc.href} className={styles.serviceCard}>
                <ServiceIcon type={svc.icon} />
                <h3 className={styles.serviceTitle}>{svc.title}</h3>
                <p className={styles.serviceDesc}>{svc.description}</p>
                <span className={styles.serviceArrow}>{t.serviceLearnMore}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ POPULAR ROUTES ═══════ */}
      <section className={`${styles.section} ${styles.graySection}`}>
        <div className={styles.container}>
          <SectionHeader title={t.sectionRoutesTitle} subtitle={t.sectionRoutesSubtitle} />
          <div className={styles.routesGrid}>
            {ROUTE_CARDS.map((route) => (
              <Link key={`${route.from}-${route.to}`} href={route.href} className={styles.routeCard}>
                <img src={route.image} alt={`${route.from} to ${route.to}`} className={styles.routeImg} loading="lazy" />
                <div className={styles.routeOverlay} />
                <div className={styles.routeInfo}>
                  <span className={styles.routeDuration}>{route.duration}</span>
                  <p className={styles.routeFrom}>{route.from}</p>
                  <span className={styles.routeArrowIcon}>&darr;</span>
                  <p className={styles.routeTo}>{route.to}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ WHY CHOOSE US ═══════ */}
      <section className={styles.whySection}>
        <div className={styles.container}>
          <SectionHeader title={t.sectionWhyTitle} subtitle={t.sectionWhySubtitle} light />
          <div className={styles.whyGrid}>
            {WHY_CHOOSE.map((item) => (
              <div key={item.title} className={styles.whyCard}>
                <WhyIcon type={item.icon} />
                <h4 className={styles.whyTitle}>{item.title}</h4>
                <p className={styles.whyDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ ABOUT COPY + FAQ ═══════ */}
      <HomepageAboutFaq faqs={HOMEPAGE_FAQS} t={t} tripadvisorUrl={TRIPADVISOR_LISTING_URL} />

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section id="reviews" className={`${styles.section} ${styles.whiteSection}`}>
        <div className={styles.container}>
          <SectionHeader
            title={t.whatTravelersSay || 'What our pilgrims say'}
            subtitle={t.whatTravelersSayTripAdvisor}
            subtitleLink={TRIPADVISOR_LISTING_URL}
          />
        </div>
        <TestimonialsCarousel />
      </section>

      {/* ═══════ FLEET ═══════ */}
      <section className={`${styles.section} ${styles.graySection}`}>
        <div className={styles.container}>
          <SectionHeader
            title={t.ourFleetSection || 'Our Fleet'}
            subtitle={t.ourFleetSubtitle || 'Real vehicles from our verified suppliers worldwide. From comfortable sedans to spacious group vehicles.'}
          />
          {FLEET_GROUPS.map((group) => {
            const groupTitleMap = {
              'Sedans & Comfort': language === 'ur' ? '\u0633\u06CC\u0688\u0627\u0646 \u0627\u0648\u0631 \u06A9\u0645\u0641\u0631\u0679' : language === 'ar' ? '\u0627\u0644\u0633\u064A\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0631\u0627\u062D\u0629' : group.title,
              'Vans & Minivans': language === 'ur' ? '\u0648\u06CC\u0646\u0632 \u0627\u0648\u0631 \u0645\u06CC\u0646\u06CC \u0648\u06CC\u0646\u0632' : language === 'ar' ? '\u0627\u0644\u0641\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0645\u064A\u0643\u0631\u0648\u0628\u0627\u0635' : group.title,
              'Minibuses & Buses': language === 'ur' ? '\u0645\u0646\u06CC \u0628\u0633\u06CC\u06BA \u0627\u0648\u0631 \u0628\u0633\u06CC\u06BA' : language === 'ar' ? '\u0627\u0644\u062D\u0627\u0641\u0644\u0627\u062A \u0627\u0644\u0635\u063A\u064A\u0631\u0629 \u0648\u0627\u0644\u0643\u0628\u064A\u0631\u0629' : group.title,
            }
            return (
              <div key={group.title} className={styles.fleetGroup}>
                <h3 className={styles.fleetGroupTitle}>{groupTitleMap[group.title] || group.title}</h3>
                <div className={styles.fleetGrid}>
                  {group.vehicles.map((vehicle) => (
                    <article key={`${group.title}-${vehicle.name}-${vehicle.image}`} className={styles.vehicleCard}>
                      <img src={vehicle.image} alt={vehicle.name} className={styles.vehicleImage} loading="lazy" />
                      <div className={styles.vehicleOverlay} />
                      <div className={styles.vehicleLabel}>{vehicle.name}</div>
                    </article>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ═══════ POPULAR AIRPORTS ═══════ */}
      <section id="popular-routes" className={`${styles.section} ${styles.whiteSection}`}>
        <div className={styles.container}>
          <SectionHeader title={t.popularAirports || 'Popular Airports'} />
          <div className={styles.airportsGrid}>
            {POPULAR_AIRPORTS.map((airport) => (
              <Link key={airport.code} href={airport.href} className={styles.airportCard}>
                <img src={airport.image} alt={airport.city} className={styles.airportImage} loading="lazy" />
                <div className={styles.airportOverlay} />
                <div className={styles.airportCode}>{airport.code}</div>
                <div className={styles.airportCity}>{airport.city}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ WORLDWIDE LINKS ═══════ */}
      <section id="airport-guides" className={`${styles.section} ${styles.graySection}`}>
        <div className={styles.container}>
          <SectionHeader
            title={t.airportTransfersWorldwide || 'Airport Transfers Worldwide'}
            subtitle={t.browseByCity || 'Browse transfers by city or airport'}
          />
          <div className={styles.worldGrid}>
            {WORLDWIDE_COLUMNS_T.map((column) => (
              <div key={column.title} className={styles.worldColumn}>
                <h3 className={styles.worldTitle}>{column.title}</h3>
                <ul className={styles.worldList}>
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.href}-${link.label}`}>
                      <Link href={link.href} className={styles.worldLink}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrandArea}>
              <Logo className={styles.footerLogo} />
              <p className={styles.footerTagline}>
                {language === 'ur'
                  ? '\u062F\u0646\u06CC\u0627 \u0628\u06BE\u0631 \u0645\u06CC\u06BA \u062A\u0635\u062F\u06CC\u0642 \u0634\u062F\u06C1 \u0645\u0642\u0627\u0645\u06CC \u0633\u067E\u0644\u0627\u0626\u0631\u0632 \u0633\u06D2 \u0642\u0627\u0628\u0644 \u0627\u0639\u062A\u0645\u0627\u062F \u0627\u06CC\u0626\u0631\u067E\u0648\u0631\u0679 \u0679\u0631\u0627\u0646\u0633\u0641\u0631 \u0628\u06A9 \u06A9\u0631\u06CC\u06BA\u06D4'
                  : language === 'ar'
                    ? '\u0627\u062D\u062C\u0632 \u0646\u0642\u0644 \u0627\u0644\u0645\u0637\u0627\u0631 \u0645\u0646 \u0645\u0648\u0631\u062F\u064A\u0646 \u0645\u062D\u0644\u064A\u064A\u0646 \u0645\u0648\u062B\u0648\u0642\u064A\u0646 \u062D\u0648\u0644 \u0627\u0644\u0639\u0627\u0644\u0645.'
                    : 'Book reliable airport transfers worldwide from verified local suppliers. Travel with confidence.'}
              </p>
            </div>
            <span className={styles.footerSslBadge}>SSL</span>
          </div>

          <div className={styles.footerGrid}>
            {FOOTER_COLUMNS_T.map((column) => (
              <div key={column.title} className={styles.footerColumn}>
                <h4 className={styles.footerColumnTitle}>{column.title}</h4>
                <ul className={styles.footerLinks}>
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.href}-${link.label}`}>
                      <Link href={link.href} className={styles.footerLink}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className={styles.footerBottom}>
            <p>{t.footerCopyright}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
