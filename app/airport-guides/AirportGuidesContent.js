'use client'

import Link from 'next/link'
import PortalNavbar from '../components/Navbar/PortalNavbar'
import PortalFooter from '../components/PortalFooter/PortalFooter'
import styles from './page.module.css'
import { MOST_SEARCHED_TRANSFERS } from '../../lib/airportPortalData'
import { useTranslation } from '../../hooks/useTranslation'

const MoonIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" opacity="0.2"/>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
)

const MapIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" opacity="0.2"/>
    <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M8 2v16M16 6v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const UsersIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" opacity="0.2"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" opacity="0.2"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const DollarIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" opacity="0.2"/>
    <path d="M12 6v12M15 9a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PilgrimIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" opacity="0.2"/>
    <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
)

const AIRPORT_REGIONS = [
  {
    title: '🇸🇦 Saudi Arabia',
    airports: [
      { code: 'JED', name: 'Jeddah King Abdulaziz Intl', href: '/airport-guides/jed', desc: 'Main Umrah & Hajj gateway' },
      { code: 'MED', name: 'Madinah Prince Mohammad',    href: '/airport-guides/med', desc: 'City of the Prophet (PBUH)' },
      { code: 'RUH', name: 'Riyadh King Khalid Intl',    href: '/airport-guides/ruh', desc: 'Saudi capital airport' },
    ]
  },
  {
    title: '🇵🇰 Pakistan',
    airports: [
      { code: 'ISB', name: 'New Islamabad Intl',      href: '/airport-guides/isb', desc: 'Capital twin cities airport' },
      { code: 'LHE', name: 'Lahore Allama Iqbal Intl', href: '/airport-guides/lhe', desc: 'Cultural capital airport' },
      { code: 'KHI', name: 'Karachi Jinnah Intl',     href: '/airport-guides/khi', desc: "Pakistan's largest city" },
    ]
  },
  {
    title: '🇬🇧 United Kingdom',
    airports: [
      { code: 'LHR', name: 'London Heathrow',  href: '/airport-guides/lhr', desc: 'World-class gateway to London' },
    ]
  },
]

export default function AirportGuidesContent() {
  const t = useTranslation()

  const SITUATIONS = [
    { icon: <PilgrimIcon />, title: t('agSit1Title'), description: t('agSit1Desc') },
    { icon: <MoonIcon />, title: t('agSit2Title'), description: t('agSit2Desc') },
    { icon: <MapIcon />, title: t('agSit3Title'), description: t('agSit3Desc') },
    { icon: <UsersIcon />, title: t('agSit4Title'), description: t('agSit4Desc') },
    { icon: <DollarIcon />, title: t('agSit5Title'), description: t('agSit5Desc') },
  ]

  const FLOW_STEPS = [
    { number: '1', title: t('agStep1Title'), description: t('agStep1Desc') },
    { number: '2', title: t('agStep2Title'), description: t('agStep2Desc') },
    { number: '3', title: t('agStep3Title'), description: t('agStep3Desc') },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.navbarWrapper}>
        <PortalNavbar />
      </div>

      <section className={styles.heroSection}>
        <div className={styles.container}>
          <h1 className={styles.heroTitle}>
            {t('agHeroTitle')}<br />
            <span style={{ fontSize: '0.7em', opacity: 0.85 }}>{t('agHeroRegions')}</span>
          </h1>
          <p className={styles.heroSubtitle}>{t('agHeroSubtitle')}</p>

          <div className={styles.situationsGrid}>
            {SITUATIONS.map((situation, index) => (
              <div key={index} className={styles.situationCard}>
                <div className={styles.situationIcon}>{situation.icon}</div>
                <h3 className={styles.situationTitle}>{situation.title}</h3>
                <p className={styles.situationDesc}>{situation.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.searchedSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>{t('agMostSearched')}</h2>
          <p className={styles.sectionSubtitle}>{t('agMostSearchedSub')}</p>
          
          <div className={styles.transfersGrid}>
            {MOST_SEARCHED_TRANSFERS.map((transfer, index) => (
              <Link key={index} href={transfer.href} className={styles.transferCard}>
                <span className={styles.transferRoute}>{transfer.label}</span>
                <span className={styles.transferPrice}>{transfer.price}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.airportsSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>{t('agOurAirports')}</h2>
          <p className={styles.sectionSubtitle}>{t('agOurAirportsSub')}</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            {AIRPORT_REGIONS.map((region) => (
              <div key={region.title} style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#111827' }}>{region.title}</h3>
                {region.airports.map((airport) => (
                  <Link key={airport.code} href={airport.href} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.6rem 0',
                    borderBottom: '1px solid #f3f4f6',
                    textDecoration: 'none',
                    color: 'inherit'
                  }}>
                    <span style={{
                      background: '#1e40af',
                      color: 'white',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      flexShrink: 0
                    }}>{airport.code}</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1d4ed8' }}>{airport.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{airport.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.flowSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>{t('agAfterLanding')}</h2>
          <p className={styles.sectionSubtitle}>{t('agAfterLandingSub')}</p>

          <div className={styles.flowGrid}>
            {FLOW_STEPS.map((step) => (
              <div key={step.number} className={styles.flowCard}>
                <div className={styles.flowNumber}>{step.number}</div>
                <h3 className={styles.flowTitle}>{step.title}</h3>
                <p className={styles.flowDesc}>{step.description}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link href="/search" style={{
              display: 'inline-block',
              background: '#1e40af',
              color: 'white',
              padding: '0.875rem 2rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1rem'
            }}>
              {t('agBookNow')}
            </Link>
          </div>
        </div>
      </section>

      <PortalFooter />
    </div>
  )
}
