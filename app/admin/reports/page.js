'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import styles from './reports.module.scss'
import { db } from '../../../lib/firebase'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'

const toNumber = (value) => {
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const getDateRange = (dateRange, customStartDate, customEndDate) => {
  const now = new Date()
  let startDate
  let endDate

  switch (dateRange) {
    case 'last-week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      endDate = now
      break
    case 'last-month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      endDate = now
      break
    case 'last-3-months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
      endDate = now
      break
    case 'last-6-months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
      endDate = now
      break
    case 'custom':
      startDate = customStartDate ? new Date(customStartDate) : new Date(now.getFullYear(), 0, 1)
      endDate = customEndDate ? new Date(customEndDate) : now
      break
    default:
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      endDate = now
  }

  return { start: startDate, end: endDate }
}

const getBookingDate = (booking) => {
  if (booking.createdAt?.toDate) return booking.createdAt.toDate()
  if (booking.createdAt) return new Date(booking.createdAt)
  if (booking.departureDate) return new Date(booking.departureDate)
  if (booking.pickupDate) return new Date(booking.pickupDate)
  return new Date(0)
}

const buildReportRow = (booking) => {
  const total = toNumber(booking.totalPrice || booking.invoiceSnapshot?.pricing?.totalAmount)
  const deposit = toNumber(booking.depositAmount || booking.invoiceSnapshot?.pricing?.depositAmount)
  const explicitRemaining = booking.remainingAmount !== undefined ? toNumber(booking.remainingAmount) : null
  const remaining = explicitRemaining === null ? Math.max(0, total - deposit) : Math.max(0, explicitRemaining)
  const paid = toNumber(booking.paymentSummary?.totalPaid) || Math.max(0, total - remaining)

  return {
    id: booking.id,
    bookingRef: booking.bookingRef || booking.id.slice(0, 8).toUpperCase(),
    date: getBookingDate(booking),
    customerName: booking.contactInfo
      ? `${booking.contactInfo.firstName || ''} ${booking.contactInfo.lastName || ''}`.trim()
      : (booking.customerName || 'N/A'),
    route: `${booking.fromLocation || booking.pickupLocation || 'N/A'} -> ${booking.toLocation || booking.dropoffLocation || 'N/A'}`,
    vehicleName: booking.vehicleName || booking.vehicleType || 'N/A',
    total,
    paid,
    remaining,
    paymentStatus: remaining > 0 ? 'partial' : 'full',
    bookingStatus: booking.status || 'pending'
  }
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('last-month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)

  const range = useMemo(() => getDateRange(dateRange, customStartDate, customEndDate), [dateRange, customStartDate, customEndDate])

  const filteredRows = useMemo(() => {
    return bookings
      .map(buildReportRow)
      .filter((row) => row.date >= range.start && row.date <= range.end)
      .sort((a, b) => b.date - a.date)
  }, [bookings, range])

  const reportData = useMemo(() => {
    return filteredRows.reduce((acc, row) => {
      acc.totalBookings += 1
      acc.totalInvoiced += row.total
      acc.totalCollected += row.paid
      acc.totalOutstanding += row.remaining
      acc.partialPayments += row.paymentStatus === 'partial' ? 1 : 0
      acc.fullPayments += row.paymentStatus === 'full' ? 1 : 0
      acc.completedBookings += row.bookingStatus === 'completed' ? 1 : 0
      acc.cancelledBookings += row.bookingStatus === 'cancelled' ? 1 : 0
      return acc
    }, {
      totalBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      totalInvoiced: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      partialPayments: 0,
      fullPayments: 0
    })
  }, [filteredRows])

  const averageBookingValue = reportData.totalBookings > 0 ? reportData.totalInvoiced / reportData.totalBookings : 0

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const bookingsData = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      setBookings(bookingsData)
    } catch (error) {
      console.error('Error fetching report data:', error)
      alert('Error loading report data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [])

  const handleExportCSV = () => {
    let csv = 'Invoice,Date,Customer,Route,Vehicle,Booking Status,Payment Status,Total USD,Paid USD,Remaining USD\n'

    filteredRows.forEach((row) => {
      csv += `${row.bookingRef},`
      csv += `${row.date.toISOString().split('T')[0]},`
      csv += `"${row.customerName}",`
      csv += `"${row.route}",`
      csv += `"${row.vehicleName}",`
      csv += `${row.bookingStatus},`
      csv += `${row.paymentStatus},`
      csv += `${row.total.toFixed(2)},`
      csv += `${row.paid.toFixed(2)},`
      csv += `${row.remaining.toFixed(2)}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `UmrahLimo_Report_${range.start.toISOString().split('T')[0]}_to_${range.end.toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  const getRangeName = () => {
    switch (dateRange) {
      case 'last-week': return 'Last 7 Days'
      case 'last-month': return 'Last Month'
      case 'last-3-months': return 'Last 3 Months'
      case 'last-6-months': return 'Last 6 Months'
      case 'custom': return 'Custom Range'
      default: return 'Last Month'
    }
  }

  return (
    <AdminLayout pageTitle="Reports & Analytics" pageDescription="Invoice and payment analytics">
      <div className={styles.reportsPage}>
        <div className={styles.filtersSection}>
          <div className={styles.filterGroup}>
            <label>Report Period</label>
            <div className={styles.periodButtons}>
              <button className={`${styles.periodBtn} ${dateRange === 'last-week' ? styles.active : ''}`} onClick={() => setDateRange('last-week')}>Last Week</button>
              <button className={`${styles.periodBtn} ${dateRange === 'last-month' ? styles.active : ''}`} onClick={() => setDateRange('last-month')}>Last Month</button>
              <button className={`${styles.periodBtn} ${dateRange === 'last-3-months' ? styles.active : ''}`} onClick={() => setDateRange('last-3-months')}>Last 3 Months</button>
              <button className={`${styles.periodBtn} ${dateRange === 'last-6-months' ? styles.active : ''}`} onClick={() => setDateRange('last-6-months')}>Last 6 Months</button>
              <button className={`${styles.periodBtn} ${dateRange === 'custom' ? styles.active : ''}`} onClick={() => setDateRange('custom')}>Custom Range</button>
            </div>
          </div>

          {dateRange === 'custom' && (
            <div className={styles.customDateRange}>
              <div className={styles.dateInput}>
                <label>Start Date</label>
                <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
              </div>
              <div className={styles.dateInput}>
                <label>End Date</label>
                <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
              </div>
            </div>
          )}

          <div className={styles.actionButtons}>
            <button className={styles.exportBtn} onClick={handleExportCSV}>Export CSV</button>
            <button className={styles.printBtn} onClick={handlePrint}>Print Report</button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading report data...</p>
          </div>
        ) : (
          <>
            <div className={styles.reportHeader}>
              <h2>Financial Report - {getRangeName()}</h2>
              <p className={styles.dateRange}>
                {range.start.toISOString().split('T')[0]} to {range.end.toISOString().split('T')[0]}
              </p>
            </div>

            <div className={styles.metricsGrid}>
              <div className={`${styles.metricCard} ${styles.revenue}`}>
                <div className={styles.metricContent}>
                  <span className={styles.metricLabel}>Total Invoiced (USD)</span>
                  <span className={styles.metricValue}>USD {reportData.totalInvoiced.toFixed(2)}</span>
                </div>
              </div>

              <div className={`${styles.metricCard} ${styles.driverPayment}`}>
                <div className={styles.metricContent}>
                  <span className={styles.metricLabel}>Collected (USD)</span>
                  <span className={styles.metricValue}>USD {reportData.totalCollected.toFixed(2)}</span>
                </div>
              </div>

              <div className={`${styles.metricCard} ${styles.profit}`}>
                <div className={styles.metricContent}>
                  <span className={styles.metricLabel}>Outstanding (USD)</span>
                  <span className={styles.metricValue}>USD {reportData.totalOutstanding.toFixed(2)}</span>
                </div>
              </div>

              <div className={`${styles.metricCard} ${styles.bookings}`}>
                <div className={styles.metricContent}>
                  <span className={styles.metricLabel}>Total Bookings</span>
                  <span className={styles.metricValue}>{reportData.totalBookings}</span>
                </div>
              </div>

              <div className={`${styles.metricCard} ${styles.completed}`}>
                <div className={styles.metricContent}>
                  <span className={styles.metricLabel}>Partial / Full Payments</span>
                  <span className={styles.metricValue}>{reportData.partialPayments} / {reportData.fullPayments}</span>
                </div>
              </div>

              <div className={`${styles.metricCard} ${styles.average}`}>
                <div className={styles.metricContent}>
                  <span className={styles.metricLabel}>Avg Booking Value</span>
                  <span className={styles.metricValue}>USD {averageBookingValue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className={styles.tableSection}>
              <h3>Invoice-Level Report</h3>
              <div className={styles.tableWrapper}>
                <table className={styles.reportTable}>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Route</th>
                      <th>Vehicle</th>
                      <th>Booking</th>
                      <th>Payment</th>
                      <th>Total USD</th>
                      <th>Paid USD</th>
                      <th>Remaining USD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan="10" className={styles.noData}>No bookings found for selected period</td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => (
                        <tr key={row.id}>
                          <td className={styles.bookingId}>#{row.bookingRef}</td>
                          <td>{row.date.toISOString().split('T')[0]}</td>
                          <td>{row.customerName}</td>
                          <td className={styles.route}>{row.route}</td>
                          <td>{row.vehicleName}</td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles[row.bookingStatus] || styles.pending}`}>
                              {row.bookingStatus}
                            </span>
                          </td>
                          <td>
                            <span className={`${styles.statusBadge} ${row.paymentStatus === 'full' ? styles.completed : styles.pending}`}>
                              {row.paymentStatus === 'full' ? 'fully_paid' : 'partial'}
                            </span>
                          </td>
                          <td className={styles.price}>USD {row.total.toFixed(2)}</td>
                          <td className={styles.companyShare}>USD {row.paid.toFixed(2)}</td>
                          <td className={styles.driverPay}>USD {row.remaining.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredRows.length > 0 && (
                    <tfoot>
                      <tr className={styles.totalRow}>
                        <td colSpan="7"><strong>TOTAL</strong></td>
                        <td className={styles.price}><strong>USD {reportData.totalInvoiced.toFixed(2)}</strong></td>
                        <td className={styles.companyShare}><strong>USD {reportData.totalCollected.toFixed(2)}</strong></td>
                        <td className={styles.driverPay}><strong>USD {reportData.totalOutstanding.toFixed(2)}</strong></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
