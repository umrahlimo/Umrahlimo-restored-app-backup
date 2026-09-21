'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import AdminLayout from '../../components/AdminLayout'
import styles from '../receipts.module.scss'
import { db } from '../../../../lib/firebase'

const toNumber = (value) => {
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export default function ReceiptDetailPage() {
  const params = useParams()
  const invoiceId = params?.invoiceId
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchBooking = async () => {
    if (!invoiceId) return
    setLoading(true)
    try {
      const bookingRef = doc(db, 'bookings', invoiceId)
      const snap = await getDoc(bookingRef)
      if (snap.exists()) {
        setBooking({ id: snap.id, ...snap.data() })
      } else {
        setBooking(null)
      }
    } catch (error) {
      console.error('Failed to fetch receipt detail:', error)
      setBooking(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooking()
  }, [invoiceId])

  const model = useMemo(() => {
    if (!booking) return null

    const total = toNumber(booking.totalPrice || booking.invoiceSnapshot?.pricing?.totalAmount)
    const deposit = toNumber(booking.depositAmount || booking.invoiceSnapshot?.pricing?.depositAmount)
    const explicitRemaining = booking.remainingAmount !== undefined ? toNumber(booking.remainingAmount) : null
    const remaining = explicitRemaining === null ? Math.max(0, total - deposit) : Math.max(0, explicitRemaining)
    const totalPaid = toNumber(booking.paymentSummary?.totalPaid) || Math.max(0, total - remaining)

    return {
      bookingRef: booking.bookingRef || booking.id.slice(0, 8).toUpperCase(),
      customerName: booking.contactInfo
        ? `${booking.contactInfo.firstName || ''} ${booking.contactInfo.lastName || ''}`.trim()
        : (booking.customerName || 'N/A'),
      customerEmail: booking.contactInfo?.email || booking.customerEmail || 'N/A',
      customerPhone: booking.contactInfo?.phone || booking.customerPhone || 'N/A',
      routeFrom: booking.fromLocation || booking.pickupLocation || 'N/A',
      routeTo: booking.toLocation || booking.dropoffLocation || 'N/A',
      tripType: booking.tripType || 'one-way',
      departureDate: booking.departureDate || booking.pickupDate || 'N/A',
      departureTime: booking.departureTime || booking.pickupTime || 'N/A',
      vehicleName: booking.vehicleName || booking.vehicleType || 'N/A',
      vehicleOwner: booking.vehicleOwnerName || 'N/A',
      total,
      deposit,
      remaining,
      totalPaid,
      depositPercentage: toNumber(booking.depositPercentage || booking.paymentPlan?.depositPercentage),
      paymentStatus: booking.paymentStatus || (remaining > 0 ? 'deposit_paid' : 'fully_paid'),
      stripePaymentIntentId: booking.stripePaymentIntentId || booking.invoiceSnapshot?.stripePaymentIntentId || 'N/A',
      timeline: Array.isArray(booking.paymentTimeline) ? booking.paymentTimeline : []
    }
  }, [booking])

  const markRemainingAsPaid = async () => {
    if (!model || model.remaining <= 0) return
    if (!window.confirm(`Mark remaining USD ${model.remaining.toFixed(2)} as paid?`)) return

    setSaving(true)
    try {
      const updatedTimeline = [
        ...(Array.isArray(booking.paymentTimeline) ? booking.paymentTimeline : []),
        {
          type: 'remaining_paid',
          amount: model.remaining,
          currency: 'USD',
          source: 'admin_receipt_detail',
          at: new Date().toISOString()
        }
      ]

      await updateDoc(doc(db, 'bookings', booking.id), {
        paymentStatus: 'fully_paid',
        remainingAmount: 0,
        paymentTimeline: updatedTimeline,
        paymentSummary: {
          totalAmount: model.total,
          totalPaid: model.total,
          totalRemaining: 0,
          settlementStatus: 'full',
          currency: 'USD'
        },
        invoiceSnapshot: {
          ...(booking.invoiceSnapshot || {}),
          paymentStatus: 'fully_paid',
          pricing: {
            ...(booking.invoiceSnapshot?.pricing || {}),
            totalAmount: model.total,
            depositAmount: model.deposit,
            remainingAmount: 0,
            currency: 'USD'
          },
          updatedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      })

      await fetchBooking()
    } catch (error) {
      console.error('Failed to settle from detail page:', error)
      alert('Failed to update payment status.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout pageTitle="Receipt Details" pageDescription="Invoice snapshot and payment timeline">
      <div className={styles.receiptsPage}>
        <Link href="/admin/receipts" className={styles.backLink}>Back to Receipts</Link>

        {loading ? (
          <section className={styles.detailCard}>
            <p className={styles.metaText}>Loading receipt details...</p>
          </section>
        ) : !model ? (
          <section className={styles.detailCard}>
            <p className={styles.metaText}>Receipt not found.</p>
          </section>
        ) : (
          <>
            <section className={styles.detailCard}>
              <div className={styles.detailGrid}>
                <div className={styles.detailRow}><span>Invoice</span><span>{model.bookingRef}</span></div>
                <div className={styles.detailRow}><span>Payment Status</span><span>{model.paymentStatus}</span></div>
                <div className={styles.detailRow}><span>Customer</span><span>{model.customerName}</span></div>
                <div className={styles.detailRow}><span>Email</span><span>{model.customerEmail}</span></div>
                <div className={styles.detailRow}><span>Phone</span><span>{model.customerPhone}</span></div>
                <div className={styles.detailRow}><span>Route</span><span>{model.routeFrom} {'->'} {model.routeTo}</span></div>
                <div className={styles.detailRow}><span>Trip</span><span>{model.tripType}</span></div>
                <div className={styles.detailRow}><span>Departure</span><span>{model.departureDate} {model.departureTime}</span></div>
                <div className={styles.detailRow}><span>Vehicle</span><span>{model.vehicleName}</span></div>
                <div className={styles.detailRow}><span>Driver/Owner</span><span>{model.vehicleOwner}</span></div>
                <div className={styles.detailRow}><span>Total (USD)</span><span>{model.total.toFixed(2)}</span></div>
                <div className={styles.detailRow}><span>Deposit Paid (USD)</span><span>{model.deposit.toFixed(2)}</span></div>
                <div className={styles.detailRow}><span>Remaining (USD)</span><span>{model.remaining.toFixed(2)}</span></div>
                <div className={styles.detailRow}><span>Total Paid (USD)</span><span>{model.totalPaid.toFixed(2)}</span></div>
                <div className={styles.detailRow}><span>Deposit Policy</span><span>{model.depositPercentage}% / {100 - model.depositPercentage}%</span></div>
                <div className={styles.detailRow}><span>Stripe PaymentIntent</span><span>{model.stripePaymentIntentId}</span></div>
              </div>

              {model.remaining > 0 && (
                <div className={styles.actions} style={{ marginTop: 14 }}>
                  <button type="button" className={styles.btnPrimary} disabled={saving} onClick={markRemainingAsPaid}>
                    {saving ? 'Saving...' : `Mark Remaining USD ${model.remaining.toFixed(2)} Paid`}
                  </button>
                </div>
              )}
            </section>

            <section className={styles.detailCard}>
              <h3>Payment Timeline</h3>
              <div className={styles.timeline}>
                {model.timeline.length === 0 ? (
                  <p className={styles.metaText}>No payment timeline entries found.</p>
                ) : model.timeline.map((entry, idx) => (
                  <div key={`${entry.type || 'entry'}-${idx}`} className={styles.timelineItem}>
                    <strong>{entry.type || 'payment_event'}</strong> - USD {toNumber(entry.amount).toFixed(2)}
                    <div className={styles.metaText}>{entry.at || 'N/A'} {entry.source ? `(${entry.source})` : ''}</div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
