import Link from 'next/link'
import PortalNavbar from '../components/Navbar/PortalNavbar'
import PortalFooter from '../components/PortalFooter/PortalFooter'
import homeStyles from '../page.module.css'
import { TRANSFER_HUB, TRANSFER_ROUTES } from '../../lib/transferRoutes'
import styles from './transfer.module.css'

export const metadata = {
  title: TRANSFER_HUB.title,
  description: TRANSFER_HUB.metaDescription,
  alternates: { canonical: 'https://www.umrahlimo.com/transfer' },
}

export default function TransferHubPage() {
  return (
    <div className={styles.page}>
      <PortalNavbar forceDark />

      <section className={styles.hero}>
        <div className={homeStyles.container}>
          <span className={styles.badge}>Umrah & Hajj transfers</span>
          <h1 className={styles.heroTitle}>{TRANSFER_HUB.h1}</h1>
          <p className={styles.heroLead}>{TRANSFER_HUB.lead}</p>
          <div className={styles.heroActions}>
            <Link href="/search" className={styles.primaryBtn}>
              Search & book
            </Link>
            <a
              href="https://wa.me/966533924547"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondaryBtn}
            >
              WhatsApp booking
            </a>
          </div>
        </div>
      </section>

      <main className={styles.main}>
        <div className={homeStyles.container}>
          <div className={styles.grid}>
            {TRANSFER_ROUTES.map((route) => (
              <Link key={route.slug} href={`/transfer/${route.slug}`} className={styles.card}>
                <span className={styles.cardBadge}>{route.badge}</span>
                <h2 className={styles.cardTitle}>{route.h1.replace(' — Private Transfer', '').replace(' — Private Car', '')}</h2>
                <p className={styles.cardLead}>{route.lead.slice(0, 140)}…</p>
                <span className={styles.cardCta}>View route & fares →</span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <PortalFooter />
    </div>
  )
}
