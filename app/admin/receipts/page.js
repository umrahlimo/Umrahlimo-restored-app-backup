'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore'
import AdminLayout from '../components/AdminLayout'
import styles from './receipts.module.scss'
import { db } from '../../../lib/firebase'

const toNumber = (value) => {
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const getBookingDate = (booking) => {
  if (booking.createdAt?.toDate) return booking.createdAt.toDate()
  if (booking.createdAt) return new Date(booking.createdAt)
  if (booking.departureDate) return new Date(booking.departureDate)
  if (booking.pickupDate) return new Date(booking.pickupDate)
  return new Date(0)
}

const getInvoiceModel = (booking) => {
  const total = toNumber(booking.totalPrice || booking.invoiceSnapshot?.pricing?.totalAmount)
  const deposit = toNumber(booking.depositAmount || booking.invoiceSnapshot?.pricing?.depositAmount)
  const explicitRemaining = booking.remainingAmount !== undefined ? toNumber(booking.remainingAmount) : null
  const computedRemaining = Math.max(0, total - deposit)
  const remaining = explicitRemaining === null ? computedRemaining : Math.max(0, explicitRemaining)
  const totalPaid = toNumber(booking.paymentSummary?.totalPaid) || Math.max(0, total - remaining)
  const settlementStatus = remaining > 0 ? 'partial' : 'full'

  return {
    id: booking.id,
    bookingRef: booking.bookingRef || booking.id.slice(0, 8).toUpperCase(),
    customerName: booking.contactInfo
      ? `${booking.contactInfo.firstName || ''} ${booking.contactInfo.lastName || ''}`.trim()
      : (booking.customerName || 'N/A'),
    route: `${booking.fromLocation || booking.pickupLocation || 'N/A'} -> ${booking.toLocation || booking.dropoffLocation || 'N/A'}`,
    vehicleName: booking.vehicleName || booking.vehicleType || 'N/A',
    total,
    deposit,
    remaining,
    totalPaid,
    currency: booking.baseCurrency || booking.paymentSummary?.currency || 'USD',
    paymentStatus: booking.paymentStatus || (settlementStatus === 'full' ? 'fully_paid' : 'deposit_paid'),
    settlementStatus,
    createdAt: getBookingDate(booking),
    raw: booking
  }
}

export default function AdminReceiptsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [settlingId, setSettlingId] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    startDate: '',
    endDate: ''
  })

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setBookings(snap.docs.map((item) => ({ id: item.id, ...item.data() })))
    } catch (error) {
      console.error('Failed to load receipts:', error)
      alert('Failed to load receipts data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const rows = useMemo(() => {
    return bookings
      .map(getInvoiceModel)
      .filter((row) => {
        const search = filters.search.trim().toLowerCase()
        const start = filters.startDate ? new Date(filters.startDate) : null
        const end = filters.endDate ? new Date(filters.endDate) : null

        const matchesSearch = !search
          || row.bookingRef.toLowerCase().includes(search)
          || row.customerName.toLowerCase().includes(search)
          || row.route.toLowerCase().includes(search)

        const matchesStatus = filters.status === 'all' || row.settlementStatus === filters.status

        const matchesStart = !start || row.createdAt >= start
        const matchesEnd = !end || row.createdAt <= new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59)

        return matchesSearch && matchesStatus && matchesStart && matchesEnd
      })
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [bookings, filters])

  const totals = useMemo(() => {
    return rows.reduce((acc, row) => {
      acc.totalInvoiced += row.total
      acc.totalPaid += row.totalPaid
      acc.totalPending += row.remaining
      acc.partialCount += row.settlementStatus === 'partial' ? 1 : 0
      acc.fullCount += row.settlementStatus === 'full' ? 1 : 0
      return acc
    }, {
      totalInvoiced: 0,
      totalPaid: 0,
      totalPending: 0,
      partialCount: 0,
      fullCount: 0
    })
  }, [rows])

  const markRemainingAsPaid = async (row) => {
    if (!row.remaining || row.remaining <= 0) {
      return
    }

    if (!window.confirm(`Mark remaining USD ${row.remaining.toFixed(2)} as paid for ${row.bookingRef}?`)) {
      return
    }

    setSettlingId(row.id)
    try {
      const timeline = Array.isArray(row.raw.paymentTimeline) ? row.raw.paymentTimeline : []
      const updatedTimeline = [
        ...timeline,
        {
          type: 'remaining_paid',
          amount: row.remaining,
          currency: 'USD',
          source: 'admin_receipts',
          at: new Date().toISOString()
        }
      ]

      await updateDoc(doc(db, 'bookings', row.id), {
        paymentStatus: 'fully_paid',
        remainingAmount: 0,
        paymentTimeline: updatedTimeline,
        paymentSummary: {
          totalAmount: row.total,
          totalPaid: row.total,
          totalRemaining: 0,
          settlementStatus: 'full',
          currency: 'USD'
        },
        invoiceSnapshot: {
          ...(row.raw.invoiceSnapshot || {}),
          paymentStatus: 'fully_paid',
          pricing: {
            ...(row.raw.invoiceSnapshot?.pricing || {}),
            totalAmount: row.total,
            depositAmount: row.deposit,
            remainingAmount: 0,
            currency: 'USD'
          },
          updatedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      })

      await fetchBookings()
    } catch (error) {
      console.error('Failed to settle remaining amount:', error)
      alert('Failed to update payment status.')
    } finally {
      setSettlingId(null)
    }
  }

  return (
    <AdminLayout pageTitle="Receipts" pageDescription="Invoices, paid amounts, and pending balances">
      <div className={styles.receiptsPage}>
        <section className={styles.filtersCard}>
          <div className={styles.filtersGrid}>
            <div className={styles.field}>
              <label>Search</label>
              <input
                type="text"
                placeholder="Booking ref, customer, route"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div className={styles.field}>
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">All</option>
                <option value="partial">Partial Paid</option>
                <option value="full">Fully Paid</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className={styles.field}>
              <label>End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </section>

        <section className={styles.totalsCard}>
          <div className={styles.totalsGrid}>
            <div className={styles.totalItem}>
              <span className={styles.label}>Total Invoiced (USD)</span>
              <span className={styles.value}>{totals.totalInvoiced.toFixed(2)}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.label}>Total Paid (USD)</span>
              <span className={styles.value}>{totals.totalPaid.toFixed(2)}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.label}>Pending Balance (USD)</span>
              <span className={styles.value}>{totals.totalPending.toFixed(2)}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.label}>Partial / Full</span>
              <span className={styles.value}>{totals.partialCount} / {totals.fullCount}</span>
            </div>
          </div>
        </section>

        <section className={styles.tableCard}>
          {loading ? (
            <p className={styles.metaText}>Loading receipts...</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Route</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Remaining</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className={styles.metaText}>No receipts found.</td>
                    </tr>
                  ) : rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.bookingRef}</td>
                      <td>{row.createdAt.toLocaleDateString()}</td>
                      <td>{row.customerName}</td>
                      <td>{row.route}</td>
                      <td>USD {row.total.toFixed(2)}</td>
                      <td>USD {row.totalPaid.toFixed(2)}</td>
                      <td>USD {row.remaining.toFixed(2)}</td>
                      <td>
                        <span className={`${styles.pill} ${row.settlementStatus === 'full' ? styles.full : styles.partial}`}>
                          {row.settlementStatus === 'full' ? 'Fully Paid' : 'Partial'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <Link href={`/admin/receipts/${row.id}`} className={styles.btn}>View</Link>
                          {row.remaining > 0 && (
                            <button
                              type="button"
                              className={styles.btnPrimary}
                              disabled={settlingId === row.id}
                              onClick={() => markRemainingAsPaid(row)}
                            >
                              {settlingId === row.id ? 'Saving...' : 'Mark Full Paid'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  )
}
