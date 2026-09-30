import Link from 'next/link'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import PortalNavbar from '../../components/Navbar/PortalNavbar'
import PortalFooter from '../../components/PortalFooter/PortalFooter'
import homeStyles from '../../page.module.css'
import {
  TRANSFER_ROUTE_SLUGS,
  getTransferRouteBySlug,
} from '../../../lib/transferRoutes'
import { buildFaqSchema } from '../../../lib/seo/schemas'
import styles from '../transfer.module.css'

const BASE_URL = 'https://umrahlimo.com'

export function generateStaticParams() {
  return TRANSFER_ROUTE_SLUGS
}

export function generateMetadata({ params }) {
  const route = getTransferRouteBySlug(params.slug)
  if (!route) {
    return { title: 'Transfer | UmrahLimo' }
  }

  // MULTI-ROUTE META OPTIMIZATION LAYER
  const routeMetaMap = {
    'jeddah-airport-to-makkah': {
      title: 'Jeddah Airport to Makkah Private Transfer | Luxury & Family Vans',
      description: 'Pre-book reliable, fixed-fare private airport transfers from Jeddah Airport (JED) to Makkah. Premium VIP limos, GMC Yukons, and family vans. 24/7 flight tracking.'
    },
    'makkah-to-madinah': {
      title: 'Makkah to Madinah Private Transport | Umrah Limo Service',
      description: 'Comfortable intercity private transport from Makkah to Madinah. Clean standard family vans, premium coaches, and luxury VIP options. Complimentary Meeqat stops.'
    },
    'jeddah-airport-to-madinah': {
      title: 'Jeddah Airport to Madinah Private Transfer | VIP & Family Fleet',
      description: 'Reliable long-distance ground transportation from Jeddah Airport (JED) directly to your Madinah hotel. Professional drivers and premium air-conditioned vehicles.'
    },
    'madinah-airport-to-madinah': {
      title: 'Madinah Airport Transfer | Private Limo & Hotel Chauffeur',
      description: 'Pre-book fast, private airport transfers from Prince Mohammad Bin Abdulaziz Airport (MED) to Madinah hotels. Professional meet & greet with live flight tracking.'
    },
    'makkah-to-jeddah-airport': {
      title: 'Makkah to Jeddah Airport Private Transport | Fixed Rates',
      description: 'Dependable private transfers from your Makkah hotel back to Jeddah Airport (JED). Punctual, professional drivers ensure you catch your departure flight stress-free.'
    },
    'madinah-to-makkah': {
      title: 'Madinah to Makkah Private Transport | Umrah Pilgrim Fleet',
      description: 'Travel seamlessly between the two holy cities. Private intercity transfers from Madinah to Makkah with optional stops at the Meeqat for Ihram preparation.'
    },
    'madinah-to-jeddah-airport': {
      title: 'Madinah to Jeddah Airport Private Transfer | Long-Distance Limo',
      description: 'Chauffeured long-distance private transfers from Madinah to Jeddah Airport (JED). Premium SUVs and standard multi-seater family vans built for long journeys.'
    }
  }

  const optimizedMeta = routeMetaMap[params.slug]

  if (optimizedMeta) {
    return {
      title: optimizedMeta.title,
      description: optimizedMeta.description,
      keywords: [`${route.from} to ${route.to} Transport`],
      alternates: { canonical: `${BASE_URL}/transfer/${params.slug}` },
      openGraph: {
        title: optimizedMeta.title,
        description: optimizedMeta.description,
        url: `${BASE_URL}/transfer/${params.slug}`,
        type: 'website',
      },
    }
  }

  // Fallback defaults for any other route slug configuration array
  return {
    title: route.title,
    description: route.metaDescription,
    keywords: [route.primaryKeyword],
    alternates: { canonical: `${BASE_URL}/transfer/${route.slug}` },
    openGraph: {
      title: route.title,
      description: route.metaDescription,
      url: `${BASE_URL}/transfer/${route.slug}`,
      type: 'website',
    },
  }
}

function buildServiceSchema(route, slug) {
  // SCHEMA MAP DATA OBJECT FOR ALL SYSTEM ROUTES (TELEPHONE REMOVED)
  const routeSchemaConfig = {
    'jeddah-airport-to-makkah': { name: 'Jeddah to Makkah Transfer', regions: ['Jeddah', 'Makkah'], price: '210.00' },
    'makkah-to-madinah': { name: 'Makkah to Madinah Intercity Transport', regions: ['Makkah', 'Madinah'], price: '400.00' },
    'jeddah-airport-to-madinah': { name: 'Jeddah Airport to Madinah Long-Distance Transfer', regions: ['Jeddah', 'Madinah'], price: '600.00' },
    'madinah-airport-to-madinah': { name: 'Madinah Airport Local Hotel Transfer', regions: ['Madinah'], price: '150.00' },
    'makkah-to-jeddah-airport': { name: 'Makkah to Jeddah Airport Departure Transfer', regions: ['Makkah', 'Jeddah'], price: '210.00' },
    'madinah-to-makkah': { name: 'Madinah to Makkah Intercity Pilgrim Transport', regions: ['Madinah', 'Makkah'], price: '400.00' },
    'madinah-to-jeddah-airport': { name: 'Madinah to Jeddah Airport Private Chauffeur', regions: ['Madinah', 'Jeddah'], price: '600.00' }
  }

  const config = routeSchemaConfig[slug]

  if (config) {
    return {
      '@context': 'https://schema.org',
      '@type': 'TaxiService',
      'name': `UmrahLimo ${config.name}`,
      'description': `Premium private transfer and limo logistics for ${config.name} routes. Fixed competitive pricing.`,
      'provider': {
        '@type': 'LocalBusiness',
        'name': 'UmrahLimo',
        'url': BASE_URL
      },
      'providerMobility': 'dynamic',
      'areaServed': config.regions.map(region => ({ '@type': 'AdministrativeArea', 'name': region })),
      'url': `${BASE_URL}/transfer/${slug}`,
      'offers': {
        '@type': 'Offer',
        'priceCurrency': 'SAR',
        'price': config.price,
        'description': `Fixed wholesale and consumer retail pricing structure starting from ${config.price} SAR.`
      }
    }
  }

  // Universal structural layout fallback schema (Syntax error completely clean here)
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: route.h1,
    description: route.metaDescription,
    provider: {
      '@type': 'LocalBusiness',
      name: 'UmrahLimo',
      url: BASE_URL,
    },
    areaServed: [route.from, route.to],
    url: `${BASE_URL}/transfer/${route.slug}`,
    priceRange: 'SAR',
  }
}

export default function TransferRoutePage({ params }) {
  const route = getTransferRouteBySlug(params.slug)
  if (!route) notFound()

  return (
    <div className={styles.page}>
      <Script
        id={`faq-schema-${route.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(route.faqs)) }}
      />
      <Script
        id={`service-schema-${route.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildServiceSchema(route, params.slug)) }}
      />

      <PortalNavbar forceDark />

      <section className={styles.hero}>
        <div className={homeStyles.container}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/transfer">Transfers</Link>
            <span>/</span>
            <span>{route.from} → {route.to}</span>
          </nav>
          <span className={styles.badge}>{route.badge}</span>
          <h1 className={styles.heroTitle}>{route.h1}</h1>
          <p className={styles.heroLead}>{route.lead}</p>
          <div className={styles.heroActions}>
            <Link href={route.searchHref} className={styles.primaryBtn}>
              Book this route
            </Link>
            <a
              href="https://wa.me"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondaryBtn}
            >
              WhatsApp us
            </a>
          </div>
        </div>
      </section>

      <main className={styles.main}>
        <div className={homeStyles.container}>
          <div className={styles.layout}>
            <article className={styles.article}>
              {route.sections.map((section) => (
                <section key={section.heading} className={styles.contentBlock}>
                  <h2 className={styles.sectionHeading}>{section.heading}</h2>
                  {section.paragraphs.map((p) => (
                    <p key={p.slice(0, 48)} className={styles.paragraph}>{p}</p>
                  ))}
                </section>
              ))}

              {route.vehicles?.length > 0 && (
                <section className={styles.contentBlock}>
                  <h2 className={styles.sectionHeading}>Vehicle guide</h2>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Vehicle</th>
                          <th>Passengers</th>
                          <th>Realistic luggage</th>
                          <th>Best suited to</th>
                        </tr>
                      </thead>
                      <tbody>
                        {route.vehicles.map((v) => (
                          <tr key={v.name}>
                            <td>{v.name}</td>
                            <td>{v.passengers}</td>
                            <td>{v.luggage}</td>
                            <td>{v.suited}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {route.fares && (
                <section className={styles.contentBlock} id="fares">
                  <h2 className={styles.sectionHeading}>Fares</h2>
                  <p className={styles.fareNote}>{route.fares.note}</p>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Vehicle</th>
