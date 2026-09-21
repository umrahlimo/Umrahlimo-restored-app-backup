'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../context/AuthContext'
import { getUserBookings, getReviewsForBookings, signOutUser, submitRideReview } from '../../../lib/firebase'
import IncomingCallListener from '../../components/Chat/IncomingCallListener'
import Logo from '../../components/Logo/Logo'
import { useCurrency } from '../../../context/CurrencyContext'
import ReviewModal from '../components/ReviewModal'
import styles from '../dashboard.module.scss'

const BookingsPage = () => {
  const router = useRouter()
  const { user, userData, loading } = useAuth()
  const { formatPrice } = useCurrency()
  const [bookings, setBookings] = useState([])
  const [reviewsByBooking, setReviewsByBooking] = useState({})
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [reviewModalBooking, setReviewModalBooking] = useState(null)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchBookings = async () => {
      if (user) {
        const result = await getUserBookings(user.uid)
        if (result.success) {
          setBookings(result.bookings)

          const reviewLookup = await getReviewsForBookings(result.bookings.map((b) => b.id))
          if (reviewLookup.success) {
            setReviewsByBooking(reviewLookup.reviewsByBooking)
          }
        }
        setLoadingBookings(false)
      }
    }

    if (user) {
      fetchBookings()
    }
  }, [user])

  const handleLogout = async () => {
    await signOutUser()
    router.push('/')
  }

  const handleSubmitReview = async ({ rating, reviewText }) => {
    if (!reviewModalBooking || !user) return
    setSubmittingReview(true)

    const customerName = userData?.firstName
      ? `${userData.firstName} ${userData.lastName || ''}`.trim()
      : (user.displayName || user.email || 'Customer')

    const result = await submitRideReview({
      booking: reviewModalBooking,
      customerId: user.uid,
      customerName,
      rating,
      reviewText
    })

    if (!result.success) {
      alert(result.error || 'Failed to submit review')
      setSubmittingReview(false)
      return
    }

    setReviewsByBooking((prev) => ({
      ...prev,
      [reviewModalBooking.id]: result.review
    }))
    setBookings((prev) => prev.map((booking) => (
      booking.id === reviewModalBooking.id
        ? { ...booking, hasSubmittedReview: true, reviewRating: result.review.rating }
        : booking
    )))

    setSubmittingReview(false)
    setReviewModalBooking(null)
    alert('Thank you for your review!')
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return styles.statusConfirmed
      case 'completed': return styles.statusCompleted
      case 'cancelled': return styles.statusCancelled
      case 'pending': return styles.statusPending
      case 'admin_approved': return styles.statusAdminApproved
      case 'admin_rejected': return styles.statusRejected
      case 'driver_rejected': return styles.statusRejected
      default: return styles.statusPending
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending Approval'
      case 'admin_approved': return 'Awaiting Driver'
      case 'confirmed': return 'Confirmed'
      case 'admin_rejected': return 'Rejected'
      case 'driver_rejected': return 'Driver Declined'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  const filterBookings = () => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    if (activeTab === 'upcoming') {
      return bookings.filter(b => {
        let dateStr = b.departureDate
        if (!dateStr && b.multiCityStops && b.multiCityStops.length > 0) {
          dateStr = b.multiCityStops[0].date
        }
        if (!dateStr) return b.status === 'confirmed'
        const bookingDate = new Date(dateStr)
        return bookingDate >= now && b.status !== 'cancelled'
      })
    } else if (activeTab === 'past') {
      return bookings.filter(b => {
        let dateStr = b.departureDate
        if (!dateStr && b.multiCityStops && b.multiCityStops.length > 0) {
          dateStr = b.multiCityStops[0].date
        }
        if (!dateStr) return b.status === 'completed'
        const bookingDate = new Date(dateStr)
        return bookingDate < now || b.status === 'completed'
      })
    } else if (activeTab === 'cancelled') {
      return bookings.filter(b => b.status === 'cancelled')
    }
    return bookings
  }

  if (loading || !user) {
    return (
      <div className={styles.dashboardPage}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  const filteredBookings = filterBookings()

  return (
    <div className={styles.dashboardPage}>
      {/* Incoming Call Listener */}
      {user && (
        <IncomingCallListener
          userId={user.uid}
          userName={userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : 'Customer'}
        />
      )}

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logo}>
            <Logo />
          </Link>
        </div>

        <nav className={styles.sidebarNav}>
          <Link href="/dashboard" className={styles.navItem}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
            Dashboard
          </Link>
          <Link href="/dashboard/bookings" className={`${styles.navItem} ${styles.active}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
            </svg>
            My Bookings
          </Link>
          <Link href="/dashboard/messages" className={styles.navItem}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
            </svg>
            Messages
          </Link>
          <Link href="/dashboard/profile" className={styles.navItem}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            Profile
          </Link>
          <Link href="/search" className={styles.navItem}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            Book a Ride
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>My Bookings</h1>
            <p>View and manage all your bookings</p>
          </div>
          <div className={styles.headerRight}>
            <Link href="/search" className={styles.newBookingBtn}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              New Booking
            </Link>
          </div>
        </header>

        <section className={styles.bookingsSection}>
          <div className={styles.sectionHeader}>
            <h2>All Bookings ({bookings.length})</h2>
            <div className={styles.tabsContainer}>
              <button
                className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'upcoming' ? styles.active : ''}`}
                onClick={() => setActiveTab('upcoming')}
              >
                Upcoming
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'past' ? styles.active : ''}`}
                onClick={() => setActiveTab('past')}
              >
                Past
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'cancelled' ? styles.active : ''}`}
                onClick={() => setActiveTab('cancelled')}
              >
                Cancelled
              </button>
            </div>
          </div>

          {loadingBookings ? (
            <div className={styles.loadingBookings}>
              <div className={styles.spinner}></div>
              <p>Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className={styles.emptyState}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
              </svg>
              <h3>No bookings found</h3>
              <p>You don&apos;t have any {activeTab !== 'all' ? activeTab : ''} bookings yet.</p>
              <Link href="/search" className={styles.bookNowBtn}>
                Book a Ride
              </Link>
            </div>
          ) : (
            <div className={styles.bookingsList}>
              {filteredBookings.map((booking) => {
                const isMultiCity = booking.tripType === 'multi-city'
                const fromLoc = isMultiCity && booking.multiCityStops?.length > 0
                  ? booking.multiCityStops[0].from
                  : (booking.fromLocation || booking.from || 'N/A')
                const toLoc = isMultiCity && booking.multiCityStops?.length > 0
                  ? booking.multiCityStops[booking.multiCityStops.length - 1].to
                  : (booking.toLocation || booking.to || 'N/A')
                const depDate = isMultiCity && booking.multiCityStops?.length > 0
                  ? booking.multiCityStops[0].date
                  : booking.departureDate
                const depTime = isMultiCity && booking.multiCityStops?.length > 0
                  ? booking.multiCityStops[0].time
                  : booking.departureTime

                return (
                  <div key={booking.id} className={styles.bookingCard}>
                    <div className={styles.bookingHeader}>
                      <div className={styles.bookingRef}>
                        <span className={styles.refLabel}>Booking Ref</span>
                        <span className={styles.refValue}>{booking.bookingRef || booking.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <div className={styles.headerRight}>
                        <span className={`${styles.tripTypeBadge} ${booking.tripType === 'round-trip' ? styles.roundTrip : booking.tripType === 'multi-city' ? styles.multiCity : styles.oneWay}`}>
                          {booking.tripType === 'multi-city' ? 'Multi-City' : booking.tripType === 'round-trip' ? 'Round Trip' : 'One Way'}
                        </span>
                        <span className={`${styles.status} ${getStatusColor(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>
                    </div>

                    <div className={styles.bookingRoute}>
                      <div className={styles.routePoint}>
                        <span className={styles.dot}></span>
                        <div>
                          <span className={styles.label}>From</span>
                          <span className={styles.location}>{fromLoc}</span>
                        </div>
                      </div>
                      <div className={styles.routeLine}></div>
                      <div className={styles.routePoint}>
                        <span className={`${styles.dot} ${styles.destination}`}></span>
                        <div>
                          <span className={styles.label}>To</span>
                          <span className={styles.location}>{toLoc}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.bookingMeta}>
                      <div className={styles.metaItem}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                        </svg>
                        <span>{formatDate(depDate)}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                        </svg>
                        <span>{formatTime(depTime)}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" />
                        </svg>
                        <span>{booking.vehicleName || (isMultiCity ? 'Multiple Vehicles' : 'Vehicle')}</span>
                      </div>
                    </div>

                    <div className={styles.bookingFooter}>
                      <span className={styles.price}>{formatPrice(booking.totalPrice || 0)}</span>
                      <div className={styles.footerActions}>
                        {booking.status === 'completed' && !reviewsByBooking[booking.id] && (
                          <button
                            type="button"
                            className={styles.reviewBtn}
                            onClick={() => setReviewModalBooking(booking)}
                          >
                            Leave a Review
                          </button>
                        )}
                        {booking.status === 'completed' && reviewsByBooking[booking.id] && (
                          <span className={styles.reviewBadge}>
                            Reviewed ★ {reviewsByBooking[booking.id].rating || booking.reviewRating || 5}
                          </span>
                        )}
                        {/* Document Upload Button */}
                        {(booking.status === 'confirmed' || booking.status === 'admin_approved') && (
                          <Link
                            href={`/dashboard/documents/${booking.id}`}
                            className={`${styles.uploadDocsBtn} ${booking.documentsStatus === 'verified' ? styles.verified : booking.documentsStatus === 'submitted' ? styles.submitted : ''}`}
                          >
                            {booking.documentsStatus === 'verified' ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                </svg>
                                Documents Verified
                              </>
                            ) : booking.documentsStatus === 'submitted' ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                                Documents Submitted
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                                </svg>
                                Upload Documents
                              </>
                            )}
                          </Link>
                        )}
                        <Link href={`/dashboard/bookings/${booking.id}`} className={styles.viewDetailsBtn}>View Details</Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {reviewModalBooking && (
          <ReviewModal
            booking={reviewModalBooking}
            onClose={() => setReviewModalBooking(null)}
            onSubmit={handleSubmitReview}
            submitting={submittingReview}
            styles={styles}
          />
        )}
      </main>
    </div>
  )
}

export default BookingsPage
