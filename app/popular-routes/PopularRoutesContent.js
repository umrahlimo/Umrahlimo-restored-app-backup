'use client'

import Link from 'next/link'
import PortalNavbar from '../components/Navbar/PortalNavbar'
import PortalFooter from '../components/PortalFooter/PortalFooter'
import homeStyles from '../page.module.css'
import { POPULAR_ROUTE_SECTIONS } from '../../lib/airportPortalData'
import styles from './page.module.css'
import { useTranslation } from '../../hooks/useTranslation'

/* Map section codes to their translation keys */
const SECTION_T_KEYS = {
  JED: { city: 'prCityJED', trend: 'prTrendJED', sum: 'prSumJED' },
  MED: { city: 'prCityMED', trend: 'prTrendMED', sum: 'prSumMED' },
  ISB: { city: 'prCityISB', trend: 'prTrendISB', sum: 'prSumISB' },
  RUH: { city: 'prCityRUH', trend: 'prTrendRUH', sum: 'prSumRUH' },
}

/* Map English detail strings to their translation keys */
const DETAIL_KEY_MAP = {
  'Holy city – Umrah destination': 'prDetailHolyCity',
  "Prophet's city – Ziyarah": 'prDetailProphetCity',
  'Waterfront hotels': 'prDetailWaterfront',
  'Near Makkah area': 'prDetailNearMakkah',
  'Resort beach area': 'prDetailResortBeach',
  'City center shopping': 'prDetailCityShopping',
  'Near Al-Masjid an-Nabawi': 'prDetailNabawi',
  'Onward Umrah journey': 'prDetailOnwardUmrah',
  'Central hotel zone': 'prDetailCentralHotel',
  'Religious sites area': 'prDetailReligiousSites',
  'Hotel district': 'prDetailHotelDistrict',
  'Business district': 'prDetailBusiness',
  'Historic old city': 'prDetailHistoricOld',
  'Bosphorus hotels': 'prDetailBosphorus',
  'Bosphorus area': 'prDetailBosphorusArea',
  'Upscale shopping district': 'prDetailUpscaleShopping',
  'Historic peninsula': 'prDetailHistoricPen',
  'Ferry and old market area': 'prDetailFerryMarket',
  'Beachfront hotels': 'prDetailBeachfront',
  'City landmark area': 'prDetailCityLandmark',
  'Hotel cluster': 'prDetailHotelCluster',
  'Mixed-use district': 'prDetailMixedUse',
  'Luxury beach resort': 'prDetailLuxuryBeach',
  'Central city stay': 'prDetailCentralCity',
  'Commercial & hotel zone': 'prDetailCommercialHotel',
  'City center twin': 'prDetailCityCenterTwin',
  'Residential area': 'prDetailResidential',
  'Gated community': 'prDetailGatedCommunity',
  'Hill station route': 'prDetailHillStation',
  'Golf and resort district': 'prDetailGolfResort',
  'Far east coast': 'prDetailFarEastCoast',
  'West coast resort': 'prDetailWestCoast',
  'City hotels': 'prDetailCityHotels',
  'Beach hotels': 'prDetailBeachHotels',
  'Asian side district': 'prDetailAsianSide',
  'Asian side ferry point': 'prDetailAsianFerry',
  'Upscale hotel area': 'prDetailUpscaleHotel',
  'Central residential area': 'prDetailCentralRes',
  'UNESCO heritage site area': 'prDetailUNESCO',
  'Central hotel and business zone': 'prDetailCentralBusiness',
}

export default function PopularRoutesContent() {
  const t = useTranslation()

  return (
    <div className={styles.page}>
      <PortalNavbar />

      <section className={styles.hero}>
        <div className={styles.heroGlowOne} />
        <div className={styles.heroGlowTwo} />
        <div className={homeStyles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <span className={styles.heroBadge}>{t('prHeroBadge')}</span>
              <h1 className={styles.heroTitle}>{t('prHeroTitle')}</h1>
              <p className={styles.heroLead}>{t('prHeroLead')}</p>
              <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                  <span className={styles.heroStatValue}>2</span>
                  <span className={styles.heroStatLabel}>{t('prCountriesCovered')}</span>
                </div>
                <div className={styles.heroStat}>
                  <span className={styles.heroStatValue}>4+</span>
                  <span className={styles.heroStatLabel}>{t('prFeaturedAirports')}</span>
                </div>
                <div className={styles.heroStat}>
                  <span className={styles.heroStatValue}>Fixed</span>
                  <span className={styles.heroStatLabel}>{t('prPriceNoMeter')}</span>
                </div>
              </div>
              <div className={styles.heroActions}>
                <Link href="/search" className={styles.primaryAction}>
                  {t('prSearchTransfers')}
                </Link>
                <Link href="/airport-guides" className={styles.secondaryAction}>
                  {t('prBrowseGuides')}
                </Link>
              </div>
            </div>

            <aside className={styles.heroPanel}>
              <p className={styles.panelLabel}>{t('prWhatYouFindHere')}</p>
              <ul className={styles.panelList}>
                <li>🕌 {t('prPanelItem1')}</li>
                <li>✈️ {t('prPanelItem2')}</li>
                <li>🏙️ {t('prPanelItem3')}</li>
                <li>🇵🇰 {t('prPanelItem4')}</li>
                <li>⛱️ {t('prPanelItem5')}</li>
                <li>🔗 {t('prPanelItem6')}</li>
              </ul>
              <div className={styles.panelNote}>
                {t('prPanelNote')}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <main>
        <section className={styles.section}>
          <div className={homeStyles.container}>
            <div className={homeStyles.sectionHeader}>
              <h2 className={homeStyles.sectionTitle}>{t('prRoutesByAirport')}</h2>
              <p className={homeStyles.sectionSubtitle}>{t('prRoutesByAirportSub')}</p>
            </div>

            <div className={styles.routesGrid}>
              {POPULAR_ROUTE_SECTIONS.map((section) => {
                const keys = SECTION_T_KEYS[section.code] || {}
                const city = keys.city ? t(keys.city) : section.city
                const trend = keys.trend ? t(keys.trend) : section.trend
                const summary = keys.sum ? t(keys.sum) : section.summary
                return (
                  <article key={section.code} className={styles.routeCard}>
                    <div className={styles.routeCardHeader}>
                      <span className={styles.routeCode}>{section.code}</span>
                      <div>
                        <h3 className={styles.routeTitle}>{section.airportName}</h3>
                        <p className={styles.routeCity}>{city}</p>
                      </div>
                    </div>
                    <p className={styles.routeTrend}>{trend}</p>
                    <p className={styles.routeSummary}>{summary}</p>

                    <div className={styles.routeList}>
                      {section.routes.map((route) => {
                        const detailKey = DETAIL_KEY_MAP[route.detail]
                        const detail = detailKey ? t(detailKey) : route.detail
                        const searches = route.searches.replace('searches', t('prSearchesWord'))
                        const suppliers = route.suppliers.replace('suppliers', t('prSuppliersWord'))
                        return (
                          <Link key={`${section.code}-${route.label}`} href={route.href} className={styles.routeLink}>
                            <span className={styles.routeLinkTop}>
                              <span className={styles.routeLinkLabel}>{route.label}</span>
                              <span className={styles.routePrice}>{route.price}</span>
                            </span>
                            <span className={styles.routeLinkMeta}>
                              {searches} · {suppliers}
                            </span>
                            <span className={styles.routeLinkDetail}>{detail}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={homeStyles.container}>
            <div className={styles.noticeCard}>
              <div>
                <p className={styles.noticeLabel}>{t('prDontSeeRoute')}</p>
                <h2 className={styles.noticeTitle}>{t('prNoticeTitle')}</h2>
              </div>
              <div className={styles.noticeActions}>
                <Link href="/search" className={styles.primaryAction}>
                  {t('prSearchAllRoutes')}
                </Link>
                <Link href="/airport-guides" className={styles.secondaryAction}>
                  {t('prAirportGuides')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section} style={{ background: '#f9fafb' }}>
          <div className={homeStyles.container}>
            <div className={homeStyles.sectionHeader}>
              <h2 className={homeStyles.sectionTitle}>{t('prAllRoutes')}</h2>
              <p className={homeStyles.sectionSubtitle}>{t('prAllRoutesSub')}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e40af', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🇸🇦 {t('prCountrySaudi')}</h3>
                {[
                  ['Jeddah Airport → Makkah', '/search?from=Jeddah+Airport&to=Makkah'],
                  ['Jeddah Airport → Madinah', '/search?from=Jeddah+Airport&to=Madinah'],
                  ['Jeddah Airport → Jeddah Corniche', '/search?from=Jeddah+Airport&to=Jeddah+Corniche'],
                  ['Jeddah Airport → Al Aziziyah', '/search?from=Jeddah+Airport&to=Al+Aziziyah'],
                  ['Madinah Airport → Makkah', '/search?from=Madinah+Airport&to=Makkah'],
                  ['Madinah Airport → Haram Area', '/search?from=Madinah+Airport&to=Haram+Area'],
                  ['Madinah Airport → Quba', '/search?from=Madinah+Airport&to=Quba'],
                  ['Riyadh Airport → City Center', '/search?from=Riyadh+Airport&to=City+Center'],
                  ['Riyadh Airport → Al Olaya', '/search?from=Riyadh+Airport&to=Al+Olaya'],
                ].map(([label, href]) => (
                  <Link key={href} href={href} style={{ display: 'block', padding: '0.4rem 0', fontSize: '0.85rem', color: '#1d4ed8', textDecoration: 'none', borderBottom: '1px solid #e5e7eb' }}>
                    {label}
                  </Link>
                ))}
              </div>

              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e40af', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🇵🇰 Pakistan</h3>
                {[
                  ['Islamabad Airport → F-7 Markaz', '/search?from=Islamabad+Airport&to=F7+Markaz'],
                  ['Islamabad Airport → Blue Area', '/search?from=Islamabad+Airport&to=Blue+Area'],
                  ['Islamabad Airport → Bahria Town', '/search?from=Islamabad+Airport&to=Bahria+Town'],
                  ['Islamabad Airport → Murree', '/search?from=Islamabad+Airport&to=Murree'],
                  ['Lahore Airport → Gulberg', '/search?from=Lahore+Airport&to=Gulberg'],
                  ['Lahore Airport → DHA Lahore', '/search?from=Lahore+Airport&to=DHA+Lahore'],
                  ['Karachi Airport → Clifton', '/search?from=Karachi+Airport&to=Clifton'],
                  ['Karachi Airport → Defence', '/search?from=Karachi+Airport&to=Defence'],
                  ['Karachi Airport → Gulshan-e-Iqbal', '/search?from=Karachi+Airport&to=Gulshan-e-Iqbal'],
                ].map(([label, href]) => (
                  <Link key={href} href={href} style={{ display: 'block', padding: '0.4rem 0', fontSize: '0.85rem', color: '#1d4ed8', textDecoration: 'none', borderBottom: '1px solid #e5e7eb' }}>
                    {label}
                  </Link>
                ))}
              </div>

              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e40af', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🇬🇧 United Kingdom</h3>
                {[
                  ['London Heathrow → Central London', '/search?from=London+Heathrow&to=Central+London'],
                  ['London Heathrow → Canary Wharf', '/search?from=London+Heathrow&to=Canary+Wharf'],
                  ['London Heathrow → Kings Cross', '/search?from=London+Heathrow&to=Kings+Cross'],
                  ['London Heathrow → Stratford', '/search?from=London+Heathrow&to=Stratford'],
                ].map(([label, href]) => (
                  <Link key={href} href={href} style={{ display: 'block', padding: '0.4rem 0', fontSize: '0.85rem', color: '#1d4ed8', textDecoration: 'none', borderBottom: '1px solid #e5e7eb' }}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <PortalFooter />
    </div>
  )
}
