'use client'

import { useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import PortalNavbar from '../components/Navbar/PortalNavbar'
import Footer from '../components/Footer/Footer'
import { buildFaqSchema } from '../../lib/seo/schemas'
import { TRIPADVISOR_LISTING_URL } from '../../lib/tripAdvisor'
import styles from './faq.module.css'

/* ━━━ FAQ DATA ━━━ */
const FAQ_CATEGORIES = [
  {
    id: 'all',
    label: 'All',
    icon: null,
  },
  {
    id: 'booking',
    label: 'Booking',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'payment',
    label: 'Payment',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    id: 'transfers',
    label: 'Transfers',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <circle cx="5" cy="18" r="3" /><circle cx="19" cy="18" r="3" /><path d="M10 18H14M3 9l2-5h10l4 5" /><line x1="1" y1="14" x2="23" y2="14" />
      </svg>
    ),
  },
  {
    id: 'fleet',
    label: 'Fleet',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2h-2" /><circle cx="9" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
      </svg>
    ),
  },
  {
    id: 'policies',
    label: 'Policies',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: 'services',
    label: 'Services',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
]

const ALL_FAQ_ITEMS = [
  /* ── Booking ── */
  {
    category: 'booking',
    question: 'How do I book a transfer with UmrahLimo?',
    answer:
      'Booking is 100% online. Enter your pickup and drop-off locations on our website, select your travel date and time, choose a vehicle, and confirm with a small deposit. You will receive an instant confirmation email with your booking details and driver information.',
  },
  {
    category: 'booking',
    question: 'How far in advance should I book?',
    answer:
      'We recommend booking at least 48 hours in advance to guarantee availability, especially during peak Umrah and Hajj seasons (Ramadan, Dhul Hijjah). However, we do accept last-minute bookings subject to vehicle availability. Book 30 days in advance for our 10% early-bird discount.',
  },
  {
    category: 'booking',
    question: 'Can I book for a group?',
    answer:
      'Yes. We accommodate groups of all sizes — from families to large Umrah delegations. Options include vans (7 seats), minibuses (14 seats), and full-size buses (up to 49 seats). Groups save up to 20% on their booking. Contact us directly for group quotes.',
  },
  {
    category: 'booking',
    question: 'Do I need to create an account to book?',
    answer:
      'No account is required to make a booking. You can book as a guest using just your email address. An account lets you view and manage all past and upcoming bookings in one place, which is useful for repeat pilgrims.',
  },
  /* ── Payment ── */
  {
    category: 'payment',
    question: 'Do I have to pay the full amount online?',
    answer:
      'No. UmrahLimo uses a deposit model — you pay a small deposit online to confirm your booking, and the remaining balance is paid directly to your driver on arrival. This gives you peace of mind without requiring full upfront payment.',
  },
  {
    category: 'payment',
    question: 'What payment methods do you accept?',
    answer:
      'Online deposits can be paid via major credit and debit cards (Visa, Mastercard). The remaining balance paid to the driver on arrival can be made in cash (SAR or USD accepted) or by card. Please confirm cash currency options with our support team when booking.',
  },
  {
    category: 'payment',
    question: 'Are the prices fixed or can they change?',
    answer:
      'All UmrahLimo prices are fixed. There is no surge pricing, no hidden fees, and no surprises. The price you see when booking is the price you pay — nothing more. This includes all tolls, taxes, and standard meet & greet.',
  },
  {
    category: 'payment',
    question: 'Are there any extra charges I should know about?',
    answer:
      'No hidden extras. Meet & greet, flight tracking, and standard waiting time (up to 60 minutes after landing) are all included in the price. Extra stops (e.g., Meeqat during Makkah–Madinah transfers) may incur a small additional fee — ask at the time of booking.',
  },
  /* ── Transfers ── */
  {
    category: 'transfers',
    question: 'How long does the Jeddah Airport to Makkah transfer take?',
    answer:
      'The journey from Jeddah King Abdulaziz International Airport (KAIA) to Makkah is approximately 85 km and takes around 1 to 1.5 hours depending on traffic. During peak Hajj and Umrah seasons, traffic can extend this to 2 hours or more.',
  },
  {
    category: 'transfers',
    question: 'How long is the Makkah to Madinah transfer?',
    answer:
      'The road journey from Makkah to Madinah is approximately 430 km and takes around 4 to 4.5 hours under normal traffic. Our drivers take regular rest stops and can stop at Meeqat on request at no extra charge.',
  },
  {
    category: 'transfers',
    question: 'Do your drivers meet us inside the airport?',
    answer:
      'Yes. All airport transfers include a meet & greet service. Your driver will be waiting in the arrivals hall with a name board displaying your name. They will assist with your luggage and guide you to the vehicle.',
  },
  {
    category: 'transfers',
    question: 'What happens if my flight is delayed?',
    answer:
      'We track every flight in real time. If your flight is delayed, your driver\'s pickup time is automatically adjusted to match your new arrival time. You do not need to contact us — and there is no extra charge for flight delays.',
  },
  {
    category: 'transfers',
    question: 'Which airports do you serve?',
    answer:
      'We serve all major Saudi airports including Jeddah King Abdulaziz International Airport (JED), Prince Mohammad Bin Abdulaziz Airport in Madinah (MED), King Khalid International Airport in Riyadh (RUH), and Taif Regional Airport (TIF).',
  },
  /* ── Fleet ── */
  {
    category: 'fleet',
    question: 'What types of vehicles do you offer?',
    answer:
      'Our fleet includes luxury sedans (Toyota Camry, Lexus ES), 7-seater SUVs and vans (Toyota Hiace, GMC Yukon), 14-seat minibuses, and full-size coaches for up to 49 passengers. All vehicles are air-conditioned, clean, and well-maintained.',
  },
  {
    category: 'fleet',
    question: 'Are your vehicles Nusuk compliant?',
    answer:
      'Yes. UmrahLimo is fully Nusuk compliant. All our vehicles and drivers meet the official Saudi Ministry of Hajj and Umrah transport requirements for pilgrims travelling on Umrah visas. This is required for access to Makkah and the holy sites.',
  },
  {
    category: 'fleet',
    question: 'How much luggage can I bring?',
    answer:
      'Luggage allowance depends on the vehicle type. Sedans accommodate 2 large suitcases and 2 carry-ons. Vans and minibuses have generous luggage space. If you have an unusually large amount of luggage (e.g., a group with 10+ bags), please mention it at booking so we can assign the right vehicle.',
  },
  /* ── Policies ── */
  {
    category: 'policies',
    question: 'What is your cancellation policy?',
    answer:
      'You can cancel for free up to 24 hours before your scheduled pickup time and receive a full refund of your deposit. Cancellations made less than 24 hours before pickup are non-refundable. To cancel, log in to your account or contact our support team via email or WhatsApp +1 302 401 4991.',
  },
  {
    category: 'policies',
    question: 'Can I change my booking after confirming?',
    answer:
      'Yes. You can change your pickup time, vehicle type, or passenger count through the Manage Booking section of our website, or by contacting our support team. Changes are subject to availability and must be made at least 12 hours before pickup. As shown in our reviews, we have accommodated changes of over 10 hours at no extra charge.',
  },
  {
    category: 'policies',
    question: 'What if I can\'t find my driver at the airport?',
    answer:
      'Your booking confirmation includes your driver\'s name and mobile number. If you cannot locate your driver in the arrivals hall, call the driver directly. If there is no answer, contact our 24/7 support line immediately — our team will locate your driver and resolve the situation within minutes.',
  },
  /* ── Services ── */
  {
    category: 'services',
    question: 'Do you offer Mazarat (holy site) tours?',
    answer:
      'Yes. We offer guided Mazarat tours in both Makkah and Madinah, covering historical and religious sites such as Masjid Aisha (Tan\'eem), Masjid Jurana, Jabal Noor, Jabal Thawr, Badr, and Wadi Jinn. Tours can be booked as half-day or full-day trips.',
  },
  {
    category: 'services',
    question: 'Can drivers stop at Meeqat during our transfer?',
    answer:
      'Yes. On Makkah to Madinah or Madinah to Makkah transfers, your driver can stop at the relevant Meeqat (e.g., Masjid al-Miqat in Dhul Hulayfah) for you to change into Ihram. Please request this when booking so the driver is informed in advance.',
  },
  {
    category: 'services',
    question: 'Do you offer transfers to Taif, Badr, and Wadi Jinn?',
    answer:
      'Yes. We cover all major spiritual and scenic destinations including Taif Mazarats, Badr battlefield, and Wadi Jinn (Wadi Al-Baydah). These can be booked as return day trips from Makkah or Madinah.',
  },
  {
    category: 'services',
    question: 'Is UmrahLimo available during Hajj season?',
    answer:
      'Yes, we operate year-round including during Hajj season (Dhul Hijjah). We strongly recommend booking as early as possible for Hajj travel, as vehicle availability is very limited during peak days. Our 24/7 support team is available throughout the season.',
  },
  {
    category: 'services',
    question: 'Do you offer Riyadh to Makkah transfers?',
    answer:
      'Yes. We offer city-to-city transfers from Riyadh to Makkah and vice versa. The road journey is approximately 900 km and takes around 8 to 9 hours. This is popular for pilgrims based in Riyadh who prefer a private road transfer over flying to Jeddah.',
  },
]

/* ━━━ FAQ Item Component ━━━ */
function FaqItem({ faq, idx, isOpen, onToggle }) {
  return (
    <div className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}>
      <button
        id={`faq-btn-${idx}`}
        className={styles.faqBtn}
        aria-expanded={isOpen}
        aria-controls={`faq-panel-${idx}`}
        onClick={onToggle}
      >
        <span className={styles.faqQuestion}>{faq.question}</span>
        <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      <div
        id={`faq-panel-${idx}`}
        role="region"
        aria-labelledby={`faq-btn-${idx}`}
        className={`${styles.faqAnswer} ${isOpen ? styles.faqAnswerOpen : ''}`}
      >
        <p className={styles.faqAnswerText}>{faq.answer}</p>
      </div>
    </div>
  )
}

/* ━━━ Main Page ━━━ */
export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [openIdx, setOpenIdx] = useState(null)

  const visibleFaqs =
    activeCategory === 'all'
      ? ALL_FAQ_ITEMS
      : ALL_FAQ_ITEMS.filter((f) => f.category === activeCategory)

  const handleCatChange = (id) => {
    setActiveCategory(id)
    setOpenIdx(null)
  }

  const toggle = (i) => setOpenIdx(openIdx === i ? null : i)

  return (
    <>
      {/* FAQPage JSON-LD */}
      <Script
        id="schema-faq-page"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(ALL_FAQ_ITEMS)) }}
      />

      <PortalNavbar forceDark />

      <main className={styles.page}>
        {/* ═══ PAGE HEADER ═══ */}
        <section className={styles.header}>
          <div className={styles.container}>
            <h1 className={styles.title}>Frequently asked questions</h1>
            <p className={styles.subtitle}>Everything pilgrims need to know about booking with UmrahLimo</p>

            {/* Category filter pills */}
            <div className={styles.filters} role="tablist" aria-label="FAQ categories">
              {FAQ_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={activeCategory === cat.id}
                  className={`${styles.filterPill} ${activeCategory === cat.id ? styles.filterPillActive : ''}`}
                  onClick={() => handleCatChange(cat.id)}
                >
                  {cat.icon && <span className={styles.pillIcon}>{cat.icon}</span>}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FAQ LIST ═══ */}
        <section className={styles.body}>
          <div className={styles.container}>
            <div className={styles.faqList} role="list">
              {visibleFaqs.map((faq, i) => (
                <FaqItem
                  key={`${activeCategory}-${i}`}
                  faq={faq}
                  idx={`${activeCategory}-${i}`}
                  isOpen={openIdx === `${activeCategory}-${i}`}
                  onToggle={() => toggle(`${activeCategory}-${i}`)}
                />
              ))}
            </div>

            {/* Still need help? */}
            <div className={styles.helpBox}>
              <div className={styles.helpLeft}>
                <p className={styles.helpTitle}>Still have a question?</p>
                <p className={styles.helpSub}>Our team responds within minutes — 24 hours a day, 7 days a week.</p>
              </div>
              <div className={styles.helpActions}>
                <a
                  href="https://wa.me/13024014991"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.helpWhatsapp}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
                <a href="mailto:info@umrahlimo.com" className={styles.helpEmail}>
                  Email Us
                </a>
                <Link href="/" className={styles.helpBook}>
                  Book a Transfer →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
