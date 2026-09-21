import Link from 'next/link'
import styles from './deposit-offer-banner.module.css'

export default function DepositOfferBanner({ compact = false }) {
  return (
    <section className={`${styles.banner} ${compact ? styles.compact : ''}`} aria-label="Pay deposit offer">
      <div className={styles.content}>
        <p className={styles.eyebrow}>Limited Time UmrahLimo Offer</p>
        <h2>Pay Deposit, Rest on Arrival</h2>
        <p>
          Book reliable Umrah taxi online with a secure deposit now and pay the remaining balance directly to the driver on arrival.
          Ideal for Jeddah Airport to Makkah transfers, Makkah to Madinah routes, and Nusuk-compliant travel.
        </p>
      </div>
      <div className={styles.actions}>
        <Link href="/search" className={styles.primaryBtn}>Book Instant Transfer</Link>
        <a href="https://wa.me/13024014991" target="_blank" rel="noopener noreferrer" className={styles.secondaryBtn}>WhatsApp Booking</a>
      </div>
    </section>
  )
}
