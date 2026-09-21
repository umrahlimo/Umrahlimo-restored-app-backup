'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../../context/AuthContext'
import { signOutUser, db } from '../../../../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import Chat from '../../../components/Chat/Chat'
import IncomingCallListener from '../../../components/Chat/IncomingCallListener'
import Logo from '../../../components/Logo/Logo'
import { useCurrency } from '../../../../context/CurrencyContext'
import styles from '../../dashboard.module.scss'
import detailStyles from './detail.module.scss'

const BookingDetailPage = () => {
  const router = useRouter()
  const params = useParams()
  const { user, userData, loading } = useAuth()
  const { formatPrice } = useCurrency()
  const [booking, setBooking] = useState(null)
  const [loadingBooking, setLoadingBooking] = useState(true)
  const [vehicleOwner, setVehicleOwner] = useState(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchBooking = async () => {
      if (user && params.id) {
        try {
          const bookingDoc = await getDoc(doc(db, 'bookings', params.id))
          if (bookingDoc.exists()) {
            const data = bookingDoc.data()
            if (data.userId === user.uid) {
              setBooking({ id: bookingDoc.id, ...data })

              // If vehicleOwnerName not in booking, fetch from vehicle document
              if (!data.vehicleOwnerName && data.vehicleId) {
                try {
                  const vehicleDoc = await getDoc(doc(db, 'vehicles', data.vehicleId))
                  if (vehicleDoc.exists()) {
                    setVehicleOwner(vehicleDoc.data().ownerName || null)
                  }
                } catch (err) {
                  console.error('Error fetching vehicle:', err)
                }
              }
            } else {
              router.push('/dashboard/bookings')
            }
          } else {
            router.push('/dashboard/bookings')
          }
        } catch (error) {
          console.error('Error fetching booking:', error)
        }
        setLoadingBooking(false)
      }
    }

    if (user) {
      fetchBooking()
    }
  }, [user, params.id, router])

  const handleLogout = async () => {
    await signOutUser()
    router.push('/')
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A'
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return detailStyles.statusConfirmed
      case 'completed': return detailStyles.statusCompleted
      case 'cancelled': return detailStyles.statusCancelled
      case 'pending': return detailStyles.statusPending
      default: return ''
    }
  }

  // Sidebar Component - always render
  const Sidebar = () => (
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
  )

  // Skeleton Loading
  const SkeletonLoader = () => (
    <div className={detailStyles.detailContent}>
      <div className={detailStyles.mainCard}>
        <div className={detailStyles.cardHeader}>
          <div className={detailStyles.skeleton}>
            <div className={detailStyles.skeletonLine} style={{ width: '120px', height: '14px' }}></div>
            <div className={detailStyles.skeletonLine} style={{ width: '180px', height: '28px', marginTop: '8px' }}></div>
          </div>
          <div className={detailStyles.skeletonLine} style={{ width: '100px', height: '36px', borderRadius: '20px' }}></div>
        </div>
        <div className={detailStyles.skeletonSection}>
          <div className={detailStyles.skeletonLine} style={{ width: '150px', height: '20px', marginBottom: '20px' }}></div>
          <div className={detailStyles.skeletonBox}></div>
        </div>
        <div className={detailStyles.skeletonSection}>
          <div className={detailStyles.skeletonLine} style={{ width: '180px', height: '20px', marginBottom: '20px' }}></div>
          <div className={detailStyles.skeletonGrid}>
            <div className={detailStyles.skeletonItem}></div>
            <div className={detailStyles.skeletonItem}></div>
            <div className={detailStyles.skeletonItem}></div>
          </div>
        </div>
        <div className={detailStyles.skeletonSection}>
          <div className={detailStyles.skeletonLine} style={{ width: '160px', height: '20px', marginBottom: '20px' }}></div>
          <div className={detailStyles.skeletonBox} style={{ height: '120px' }}></div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className={styles.dashboardPage}>
        <Sidebar />
        <main className={styles.mainContent}>
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <Link href="/dashboard/bookings" className={detailStyles.backLink}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
                Back to Bookings
              </Link>
              <h1>Booking Details</h1>
            </div>
          </header>
          <SkeletonLoader />
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={styles.dashboardPage}>
        <Sidebar />
        <main className={styles.mainContent}>
          <SkeletonLoader />
        </main>
      </div>
    )
  }

  const isMultiCity = booking?.tripType === 'multi-city'

  return (
    <div className={styles.dashboardPage}>
      {/* Incoming Call Listener */}
      {user && (
        <IncomingCallListener
          userId={user.uid}
          userName={userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : 'Customer'}
        />
      )}

      <Sidebar />
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/dashboard/bookings" className={detailStyles.backLink}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
              Back to Bookings
            </Link>
            <h1>Booking Details</h1>
          </div>
        </header>

        {loadingBooking ? (
          <SkeletonLoader />
        ) : !booking ? (
          <div className={detailStyles.notFound}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <h3>Booking not found</h3>
            <p>The booking you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Link href="/dashboard/bookings" className={detailStyles.backBtn}>Back to Bookings</Link>
          </div>
        ) : (
          <div className={`${detailStyles.detailContent} ${detailStyles.fadeIn}`}>
            <div className={detailStyles.mainCard}>
              <div className={detailStyles.cardHeader}>
                <div className={detailStyles.refSection}>
                  <span className={detailStyles.refLabel}>Booking Reference</span>
                  <span className={detailStyles.refValue}>{booking.bookingRef || booking.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className={detailStyles.statusSection}>
                  {isMultiCity && <span className={detailStyles.tripBadge}>Multi-City</span>}
                  <span className={`${detailStyles.status} ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
              </div>

              {isMultiCity ? (
                <div className={detailStyles.multiCitySection}>
                  <h3>Trip Stops</h3>
                  <div className={detailStyles.stopsTimeline}>
                    {booking.multiCityStops?.map((stop, index) => (
                      <div key={index} className={detailStyles.stopItem}>
                        <div className={detailStyles.stopNumber}>{index + 1}</div>
                        <div className={detailStyles.stopContent}>
                          <div className={detailStyles.stopRoute}>
                            <div className={detailStyles.stopPoint}>
                              <span className={detailStyles.pointLabel}>From</span>
                              <span className={detailStyles.pointValue}>{stop.from}</span>
                            </div>
                            <div className={detailStyles.stopArrow}>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                              </svg>
                            </div>
                            <div className={detailStyles.stopPoint}>
                              <span className={detailStyles.pointLabel}>To</span>
                              <span className={detailStyles.pointValue}>{stop.to}</span>
                            </div>
                          </div>
                          <div className={detailStyles.stopMeta}>
                            <span><strong>Date:</strong> {formatDate(stop.date)}</span>
                            <span><strong>Time:</strong> {formatTime(stop.time)}</span>
                            {stop.vehicleName && <span><strong>Vehicle:</strong> {stop.vehicleName}</span>}
                            {stop.vehiclePrice && <span><strong>Price:</strong> {formatPrice(stop.vehiclePrice)}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={detailStyles.routeSection}>
                  <h3>Trip Details</h3>
                  <div className={detailStyles.routeCard}>
                    <div className={detailStyles.routePoint}>
                      <div className={detailStyles.pointDot}></div>
                      <div>
                        <span className={detailStyles.pointLabel}>Pickup Location</span>
                        <span className={detailStyles.pointValue}>{booking.fromLocation || booking.from || 'N/A'}</span>
                      </div>
                    </div>
                    <div className={detailStyles.routeLine}></div>
                    <div className={detailStyles.routePoint}>
                      <div className={`${detailStyles.pointDot} ${detailStyles.destination}`}></div>
                      <div>
                        <span className={detailStyles.pointLabel}>Drop-off Location</span>
                        <span className={detailStyles.pointValue}>{booking.toLocation || booking.to || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className={detailStyles.tripMeta}>
                    <div className={detailStyles.metaItem}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                      </svg>
                      <div>
                        <span className={detailStyles.metaLabel}>Date</span>
                        <span className={detailStyles.metaValue}>{formatDate(booking.departureDate)}</span>
                      </div>
                    </div>
                    <div className={detailStyles.metaItem}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                      </svg>
                      <div>
                        <span className={detailStyles.metaLabel}>Time</span>
                        <span className={detailStyles.metaValue}>{formatTime(booking.departureTime)}</span>
                      </div>
                    </div>
                    <div className={detailStyles.metaItem}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" />
                      </svg>
                      <div>
                        <span className={detailStyles.metaLabel}>Vehicle</span>
                        <span className={detailStyles.metaValue}>{booking.vehicleName || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className={detailStyles.passengerSection}>
                <h3>Passenger Information</h3>
                <div className={detailStyles.infoGrid}>
                  <div className={detailStyles.infoItem}>
                    <span className={detailStyles.infoLabel}>Passengers</span>
                    <span className={detailStyles.infoValue}>{booking.passengers || 1}</span>
                  </div>
                  <div className={detailStyles.infoItem}>
                    <span className={detailStyles.infoLabel}>Luggage</span>
                    <span className={detailStyles.infoValue}>{booking.luggage || 0} bags</span>
                  </div>
                  {booking.passengerName && (
                    <div className={detailStyles.infoItem}>
                      <span className={detailStyles.infoLabel}>Name</span>
                      <span className={detailStyles.infoValue}>{booking.passengerName}</span>
                    </div>
                  )}
                  {booking.passengerEmail && (
                    <div className={detailStyles.infoItem}>
                      <span className={detailStyles.infoLabel}>Email</span>
                      <span className={detailStyles.infoValue}>{booking.passengerEmail}</span>
                    </div>
                  )}
                  {booking.passengerPhone && (
                    <div className={detailStyles.infoItem}>
                      <span className={detailStyles.infoLabel}>Phone</span>
                      <span className={detailStyles.infoValue}>{booking.passengerPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={detailStyles.priceSection}>
                <h3>Payment Summary</h3>
                <div className={detailStyles.priceBreakdown}>
                  <div className={detailStyles.priceRow}>
                    <span>Vehicle Fare</span>
                    <span>{formatPrice(booking.vehiclePrice || booking.totalPrice || 0)}</span>
                  </div>
                  {booking.extras && booking.extras > 0 && (
                    <div className={detailStyles.priceRow}>
                      <span>Extras</span>
                      <span>{formatPrice(booking.extras)}</span>
                    </div>
                  )}
                  <div className={`${detailStyles.priceRow} ${detailStyles.total}`}>
                    <span>Total Amount</span>
                    <span>{formatPrice(booking.totalPrice || 0)}</span>
                  </div>
                </div>
              </div>

              <div className={detailStyles.bookingMeta}>
                <span>Booked on: {booking.createdAt?.toDate ? booking.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
              </div>
            </div>

            {/* Chat with Driver/Owner */}
            {booking.status !== 'cancelled' && (
              <Chat
                bookingId={booking.id}
                isSupport={true}
                driverId={booking.driverAssigned || booking.vehicleOwnerId}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default BookingDetailPage
