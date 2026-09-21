import Link from 'next/link'
import { notFound } from 'next/navigation'
import PortalNavbar from '../../components/Navbar/PortalNavbar'
import PortalFooter from '../../components/PortalFooter/PortalFooter'
import homeStyles from '../../page.module.css'
import { AIRPORT_GUIDE_SLUGS, GUIDE_FLOW_STEPS, getAirportGuideBySlug } from '../../../lib/airportPortalData'
import styles from './page.module.css'

export function generateStaticParams() {
  return AIRPORT_GUIDE_SLUGS
}

export function generateMetadata({ params }) {
  const guide = getAirportGuideBySlug(params.slug)

  if (!guide) {
    return {
      title: 'Airport Guide | UmrahLimo',
      description: 'Practical airport arrival guides for major destinations around the world.',
    }
  }

  return {
    title: `${guide.airportName} Guide | UmrahLimo`,
    description: guide.summary,
  }
}

export default function AirportGuideDetailPage({ params }) {
  const guide = getAirportGuideBySlug(params.slug)

  if (!guide) {
    notFound()
  }

  return (
    <div className={styles.page}>
      <PortalNavbar />

      <section className={styles.hero}>
        <div className={styles.heroGlowOne} />
        <div className={styles.heroGlowTwo} />
        <div className={homeStyles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <span className={styles.heroBadge}>{guide.code} arrival guide</span>
              <h1 className={styles.heroTitle}>{guide.airportName}</h1>
              <p className={styles.heroLead}>
                {guide.city}, {guide.country}
              </p>
              <p className={styles.heroSummary}>{guide.summary}</p>
              <div className={styles.heroActions}>
                <Link href="/search" className={styles.primaryAction}>
                  Search transfers
                </Link>
                <Link href="/airport-guides" className={styles.secondaryAction}>
                  Back to airport guides
                </Link>
              </div>
            </div>

            <aside className={styles.heroPanel}>
              <p className={styles.panelLabel}>Quick facts</p>
              <div className={styles.factsGrid}>
                {guide.facts.map((fact) => (
                  <div key={`${guide.slug}-${fact.label}`} className={styles.factCard}>
                    <span className={styles.factLabel}>{fact.label}</span>
                    <span className={styles.factValue}>{fact.value}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <main>
        <section className={styles.section}>
          <div className={homeStyles.container}>
            <div className={homeStyles.sectionHeader}>
              <h2 className={homeStyles.sectionTitle}>Why this guide helps</h2>
              <p className={homeStyles.sectionSubtitle}>{guide.overview}</p>
            </div>

            <div className={styles.routesGrid}>
              {guide.routes.map((route) => (
                <Link key={`${guide.slug}-${route.label}`} href={route.href} className={styles.routeCard}>
                  <span className={styles.routeLabel}>{route.label}</span>
                  <span className={styles.routeDetail}>{route.detail}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={homeStyles.container}>
            <div className={homeStyles.sectionHeader}>
              <h2 className={homeStyles.sectionTitle}>What happens after you land at any airport</h2>
              <p className={homeStyles.sectionSubtitle}>
                The sequence is the same everywhere. The details below help you make the right call for this airport.
              </p>
            </div>

            <div className={styles.stepsGrid}>
              {GUIDE_FLOW_STEPS.map((step) => (
                <article key={step.step} className={styles.stepCard}>
                  <span className={styles.stepNumber}>{step.step}</span>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepText}>{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={homeStyles.container}>
            <div className={homeStyles.sectionHeader}>
              <h2 className={homeStyles.sectionTitle}>Practical tips</h2>
              <p className={homeStyles.sectionSubtitle}>
                Simple checks that usually save time, stress, and an awkward curbside decision.
              </p>
            </div>

            <div className={styles.tipGrid}>
              {guide.tips.map((tip, index) => (
                <article key={`${guide.slug}-tip-${index}`} className={styles.tipCard}>
                  <span className={styles.tipIndex}>0{index + 1}</span>
                  <p className={styles.tipText}>{tip}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PortalFooter />
    </div>
  )
}
