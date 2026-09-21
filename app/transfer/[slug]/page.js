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

const BASE_URL = 'https://www.umrahlimo.com'

export function generateStaticParams() {
  return TRANSFER_ROUTE_SLUGS
}

export function generateMetadata({ params }) {
  const route = getTransferRouteBySlug(params.slug)
  if (!route) {
    return { title: 'Transfer | UmrahLimo' }
  }
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

function buildServiceSchema(route) {
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
    priceRange: route.fares?.rows?.[0]?.prices?.[0] || 'SAR',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildServiceSchema(route)) }}
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
              href="https://wa.me/966533924547"
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
                          {route.fares.columns.map((col) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {route.fares.rows.map((row) => (
                          <tr key={row.vehicle}>
                            <td>{row.vehicle}</td>
                            {row.prices.map((price, i) => (
                              <td key={`${row.vehicle}-${i}`} className={styles.priceCell}>{price}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              <section className={styles.contentBlock} id="faq">
                <h2 className={styles.sectionHeading}>Frequently asked questions</h2>
                <div className={styles.faqList}>
                  {route.faqs.map((faq) => (
                    <details key={faq.question} className={styles.faqItem}>
                      <summary>{faq.question}</summary>
                      <p>{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            </article>

            <aside className={styles.sidebar}>
              <div className={styles.sideCard}>
                <p className={styles.sideLabel}>Book now</p>
                <h3 className={styles.sideTitle}>{route.from} → {route.to}</h3>
                <p className={styles.sideText}>Fixed fare · Flight tracking · Meet & greet</p>
                <Link href={route.searchHref} className={styles.primaryBtn}>
                  Search vehicles
                </Link>
                <a
                  href="https://wa.me/966533924547"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sideWhatsapp}
                >
                  WhatsApp +966 53 392 4547
                </a>
              </div>

              {route.related?.length > 0 && (
                <div className={styles.sideCard}>
                  <p className={styles.sideLabel}>Related</p>
                  <ul className={styles.relatedList}>
                    {route.related.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href}>{item.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      <PortalFooter />
    </div>
  )
}
