'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import styles from './dispatch.module.scss'
import { db, getDriverRatingsMap } from '../../../lib/firebase'
import { collection, updateDoc, doc, onSnapshot } from 'firebase/firestore'

export default function DispatchPanel() {
    const [activeTab, setActiveTab] = useState('overview')
    const [rides, setRides] = useState([])
    const [stats, setStats] = useState({
        totalBooked: 0,
        onTheWay: 0,
        upcoming: 0,
        todayRides: 0,
        completed: 0,
        cancelled: 0,
        expired: 0
    })
    const [loading, setLoading] = useState(true)
    const [selectedRide, setSelectedRide] = useState(null)
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [cancelReason, setCancelReason] = useState('')
    const [driverRatings, setDriverRatings] = useState({})

    const getRideDriverId = (ride) => ride.assignedDriverId || ride.driverAssigned || ride.driverId || null

    useEffect(() => {
        // Real-time listener for bookings
        const unsubscribe = onSnapshot(collection(db, 'bookings'), async (snapshot) => {
            const ridesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setRides(ridesData)
            calculateStats(ridesData)
            setLoading(false)

            const driverIds = [...new Set(ridesData.map(getRideDriverId).filter(Boolean))]
            if (driverIds.length > 0) {
                const ratingsResult = await getDriverRatingsMap(driverIds)
                if (ratingsResult.success) {
                    setDriverRatings(ratingsResult.ratings)
                }
            }
        })

        return () => unsubscribe()
    }, [])

    const calculateStats = (ridesData) => {
        const today = new Date().toISOString().split('T')[0]
        const now = new Date()

        // Check for expired rides (past date/time and still pending/confirmed)
        const expiredRides = ridesData.filter(r => {
            if (r.status === 'completed' || r.status === 'cancelled') return false

            const rideDateTime = new Date(`${r.pickupDate}T${r.pickupTime || '00:00'}`)
            return rideDateTime < now
        })

        setStats({
            totalBooked: ridesData.filter(r => r.status !== 'cancelled').length,
            onTheWay: ridesData.filter(r => r.status === 'on-the-way').length,
            upcoming: ridesData.filter(r => {
                const rideDateTime = new Date(`${r.pickupDate}T${r.pickupTime || '00:00'}`)
                return (r.status === 'confirmed' || r.status === 'pending') && rideDateTime > now
            }).length,
            todayRides: ridesData.filter(r => r.pickupDate === today && r.status !== 'cancelled').length,
            completed: ridesData.filter(r => r.status === 'completed').length,
            cancelled: ridesData.filter(r => r.status === 'cancelled').length,
            expired: expiredRides.length
        })
    }

    const handleCancelRide = async () => {
        if (!selectedRide || !cancelReason.trim()) {
            alert('Please provide a cancellation reason')
            return
        }

        try {
            const rideRef = doc(db, 'bookings', selectedRide.id)
            await updateDoc(rideRef, {
                status: 'cancelled',
                cancelledAt: new Date().toISOString(),
                cancelReason: cancelReason,
                cancelledBy: 'admin'
            })
            setShowCancelModal(false)
            setSelectedRide(null)
            setCancelReason('')
            alert('Ride cancelled successfully')
        } catch (error) {
            console.error('Error cancelling ride:', error)
            alert('Failed to cancel ride')
        }
    }

    const handleUpdateStatus = async (rideId, newStatus) => {
        try {
            const rideRef = doc(db, 'bookings', rideId)
            await updateDoc(rideRef, {
                status: newStatus,
                updatedAt: new Date().toISOString()
            })
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    if (loading) {
        return (
            <AdminLayout pageTitle="Dispatch Panel" pageDescription="Real-time ride management and tracking">
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading dispatch data...</p>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout pageTitle="Dispatch Panel" pageDescription="Real-time ride management and tracking">
            {/* Stats Overview */}
            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.booked}`}>
                    <div className={styles.statIcon}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                        </svg>
                    </div>
                    <div className={styles.statValue}>{stats.totalBooked}</div>
                    <div className={styles.statLabel}>Total Booked Rides</div>
                </div>

                <div className={`${styles.statCard} ${styles.today}`}>
                    <div className={styles.statIcon}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" />
                        </svg>
                    </div>
                    <div className={styles.statValue}>{stats.todayRides}</div>
                    <div className={styles.statLabel}>Today&apos;s Rides</div>
                </div>

                <div className={`${styles.statCard} ${styles.onway}`}>
                    <div className={styles.statIcon}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                        </svg>
                    </div>
                    <div className={styles.statValue}>{stats.onTheWay}</div>
                    <div className={styles.statLabel}>Riders On The Way</div>
                </div>

                <div className={`${styles.statCard} ${styles.upcoming}`}>
                    <div className={styles.statIcon}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                        </svg>
                    </div>
                    <div className={styles.statValue}>{stats.upcoming}</div>
                    <div className={styles.statLabel}>Upcoming Rides</div>
                </div>

                <div className={`${styles.statCard} ${styles.completed}`}>
                    <div className={styles.statIcon}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                    </div>
                    <div className={styles.statValue}>{stats.completed}</div>
                    <div className={styles.statLabel}>Completed</div>
                </div>

                <div className={`${styles.statCard} ${styles.cancelled}`}>
                    <div className={styles.statIcon}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                        </svg>
                    </div>
                    <div className={styles.statValue}>{stats.cancelled}</div>
                    <div className={styles.statLabel}>Cancelled</div>
                </div>

                <div className={`${styles.statCard} ${styles.expired}`}>
                    <div className={styles.statIcon}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                        </svg>
                    </div>
                    <div className={styles.statValue}>{stats.expired}</div>
                    <div className={styles.statLabel}>Expired/Overdue</div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className={styles.tabsContainer}>
                <button
                    className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                    </svg>
                    Overview
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'today' ? styles.active : ''}`}
                    onClick={() => setActiveTab('today')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" />
                    </svg>
                    Today&apos;s Rides
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'upcoming' ? styles.active : ''}`}
                    onClick={() => setActiveTab('upcoming')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                    </svg>
                    Upcoming
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'map' ? styles.active : ''}`}
                    onClick={() => setActiveTab('map')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
                    </svg>
                    Live Tracking
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'pending' ? styles.active : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    Pending Approval
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'expired' ? styles.active : ''}`}
                    onClick={() => setActiveTab('expired')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                    </svg>
                    Expired
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'logs' ? styles.active : ''}`}
                    onClick={() => setActiveTab('logs')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                    </svg>
                    Communication Logs
                </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
                {activeTab === 'overview' && <OverviewTab rides={rides} onSelectRide={setSelectedRide} onUpdateStatus={handleUpdateStatus} onCancelRide={(ride) => { setSelectedRide(ride); setShowCancelModal(true); }} />}
                {activeTab === 'today' && <TodayRidesTab rides={rides} driverRatings={driverRatings} onSelectRide={setSelectedRide} onUpdateStatus={handleUpdateStatus} onCancelRide={(ride) => { setSelectedRide(ride); setShowCancelModal(true); }} />}
                {activeTab === 'upcoming' && <UpcomingTab rides={rides} onCancelRide={(ride) => { setSelectedRide(ride); setShowCancelModal(true); }} />}
                {activeTab === 'pending' && <PendingTab rides={rides} onUpdateStatus={handleUpdateStatus} onCancelRide={(ride) => { setSelectedRide(ride); setShowCancelModal(true); }} />}
                {activeTab === 'expired' && <ExpiredTab rides={rides} onCancelRide={(ride) => { setSelectedRide(ride); setShowCancelModal(true); }} />}
                {activeTab === 'map' && <MapTab rides={rides} />}
                {activeTab === 'logs' && <CommunicationLogs rides={rides} />}
            </div>

            {/* Cancel Ride Modal */}
            {showCancelModal && selectedRide && (
                <div className={styles.modal} onClick={() => setShowCancelModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Cancel Ride</h3>
                            <button onClick={() => setShowCancelModal(false)}>×</button>
                        </div>
                        <div className={styles.modalBody}>
                            <p><strong>Booking ID:</strong> {selectedRide.id}</p>
                            <p><strong>Customer:</strong> {selectedRide.customerName}</p>
                            <p><strong>Route:</strong> {selectedRide.pickupLocation} → {selectedRide.dropoffLocation}</p>
                            <p><strong>Date:</strong> {selectedRide.pickupDate} at {selectedRide.pickupTime}</p>

                            <div className={styles.inputGroup}>
                                <label>Cancellation Reason *</label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Enter reason for cancellation..."
                                    rows="4"
                                    required
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button className={styles.cancelBtn} onClick={() => setShowCancelModal(false)}>
                                    Close
                                </button>
                                <button className={styles.confirmBtn} onClick={handleCancelRide}>
                                    Confirm Cancellation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}

// Overview Tab Component
function OverviewTab({ rides, onSelectRide, onUpdateStatus, onCancelRide }) {
    const allRides = rides.filter(r => r.status !== 'cancelled').slice(0, 20)

    return (
        <div className={styles.overviewGrid}>
            <div className={styles.section}>
                <h3>All Active Bookings</h3>
                <div className={styles.ridesList}>
                    {allRides.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No active rides</p>
                        </div>
                    ) : (
                        allRides.map(ride => (
                            <div key={ride.id} className={styles.rideCard}>
                                <div className={styles.rideHeader}>
                                    <span className={`${styles.status} ${styles[ride.status]}`}>
                                        {ride.status === 'on-the-way' ? 'On The Way' : ride.status}
                                    </span>
                                    <span className={styles.bookingId}>#{ride.id.slice(0, 8)}</span>
                                </div>
                                <div className={styles.rideInfo}>
                                    <p><strong>{ride.customerName || 'N/A'}</strong></p>
                                    <p className={styles.dateTime}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                                        </svg>
                                        {ride.pickupDate} at {ride.pickupTime}
                                    </p>
                                    <p className={styles.route}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                        </svg>
                                        {ride.pickupLocation} → {ride.dropoffLocation}
                                    </p>
                                    <p className={styles.vehicle}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" />
                                        </svg>
                                        {ride.vehicleType} • {ride.passengers} passengers
                                    </p>
                                </div>
                                <div className={styles.actions}>
                                    {ride.status === 'confirmed' && (
                                        <button className={styles.actionBtn} onClick={() => onUpdateStatus(ride.id, 'on-the-way')}>
                                            Mark On The Way
                                        </button>
                                    )}
                                    {ride.status === 'on-the-way' && (
                                        <button className={styles.actionBtn} onClick={() => onUpdateStatus(ride.id, 'completed')}>
                                            Complete Ride
                                        </button>
                                    )}
                                    {ride.status !== 'completed' && (
                                        <button className={styles.cancelActionBtn} onClick={() => onCancelRide(ride)}>
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

// Today's Rides Tab
function TodayRidesTab({ rides, driverRatings, onSelectRide, onUpdateStatus, onCancelRide }) {
    const today = new Date().toISOString().split('T')[0]
    const todayRides = rides.filter(r => r.pickupDate === today && r.status !== 'cancelled')

    return (
        <div className={styles.todayGrid}>
            <div className={styles.section}>
                <h3>Today&apos;s Schedule - {today}</h3>
                <div className={styles.ridesList}>
                    {todayRides.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No rides scheduled for today</p>
                        </div>
                    ) : (
                        todayRides.map(ride => (
                            <div key={ride.id} className={styles.rideCard}>
                                <div className={styles.rideHeader}>
                                    <span className={`${styles.status} ${styles[ride.status]}`}>
                                        {ride.status === 'on-the-way' ? 'On The Way' : ride.status}
                                    </span>
                                    <span className={styles.time}>{ride.pickupTime}</span>
                                </div>
                                <div className={styles.rideInfo}>
                                    <p><strong>{ride.customerName || 'N/A'}</strong></p>
                                    <p className={styles.route}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                        </svg>
                                        {ride.pickupLocation} → {ride.dropoffLocation}
                                    </p>
                                    <p className={styles.vehicle}>{ride.vehicleType} • {ride.passengers} pax</p>
                                    {(ride.assignedDriverId || ride.driverAssigned || ride.driverId) && (
                                        <p className={styles.driver}>
                                            Driver: {ride.assignedDriverName || ride.driverName || ride.assignedDriverId || ride.driverAssigned || ride.driverId}
                                            {driverRatings[ride.assignedDriverId || ride.driverAssigned || ride.driverId] && (
                                                <span className={styles.driverRating}>
                                                    ★ {driverRatings[ride.assignedDriverId || ride.driverAssigned || ride.driverId].averageRating?.toFixed?.(1) || driverRatings[ride.assignedDriverId || ride.driverAssigned || ride.driverId].averageRating || 0}
                                                </span>
                                            )}
                                        </p>
                                    )}
                                </div>
                                <div className={styles.actions}>
                                    {ride.status === 'confirmed' && (
                                        <button className={styles.actionBtn} onClick={() => onUpdateStatus(ride.id, 'on-the-way')}>
                                            Start Ride
                                        </button>
                                    )}
                                    {ride.status === 'on-the-way' && (
                                        <button className={styles.actionBtn} onClick={() => onUpdateStatus(ride.id, 'completed')}>
                                            Complete
                                        </button>
                                    )}
                                    {ride.status !== 'completed' && (
                                        <button className={styles.cancelActionBtn} onClick={() => onCancelRide(ride)}>
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

// Upcoming Rides Tab
function UpcomingTab({ rides, onCancelRide }) {
    const today = new Date().toISOString().split('T')[0]
    const upcomingRides = rides.filter(r => r.pickupDate > today && r.status !== 'cancelled').sort((a, b) => a.pickupDate.localeCompare(b.pickupDate))

    return (
        <div className={styles.upcomingList}>
            <h3>Upcoming Bookings</h3>
            {upcomingRides.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No upcoming rides</p>
                </div>
            ) : (
                upcomingRides.map(ride => (
                    <div key={ride.id} className={styles.upcomingCard}>
                        <div className={styles.upcomingDate}>
                            <div className={styles.dateBox}>
                                <span className={styles.day}>{new Date(ride.pickupDate).getDate()}</span>
                                <span className={styles.month}>{new Date(ride.pickupDate).toLocaleString('default', { month: 'short' })}</span>
                            </div>
                        </div>
                        <div className={styles.upcomingInfo}>
                            <h4>{ride.customerName || 'N/A'}</h4>
                            <p className={styles.time}>{ride.pickupTime}</p>
                            <p className={styles.route}>{ride.pickupLocation} → {ride.dropoffLocation}</p>
                            <p className={styles.vehicle}>{ride.vehicleType} • {ride.passengers} passengers</p>
                            <span className={`${styles.badge} ${styles[ride.status]}`}>{ride.status}</span>
                        </div>
                        <div className={styles.upcomingActions}>
                            <button className={styles.cancelBtn} onClick={() => onCancelRide(ride)}>
                                Cancel Booking
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}

// Pending Tab Component
function PendingTab({ rides, onUpdateStatus, onCancelRide }) {
    const pendingRides = rides.filter(r => r.status === 'pending').sort((a, b) => {
        const dateA = new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt)
        const dateB = new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt)
        return dateB - dateA // Newest first
    })

    return (
        <div className={styles.pendingList}>
            <h3>Pending Approval ({pendingRides.length})</h3>
            <p className={styles.tabDescription}>New bookings awaiting admin approval</p>

            {pendingRides.length === 0 ? (
                <div className={styles.emptyState}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    <p>No pending bookings</p>
                    <small>All bookings have been processed</small>
                </div>
            ) : (
                <div className={styles.detailedList}>
                    {pendingRides.map(ride => (
                        <div key={ride.id} className={styles.detailedCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.headerLeft}>
                                    <span className={`${styles.statusBadge} ${styles.pending}`}>
                                        ⏳ Pending Approval
                                    </span>
                                    <span className={styles.bookingId}>#{ride.id.slice(0, 8)}</span>
                                </div>
                                <div className={styles.headerRight}>
                                    <span className={styles.timestamp}>
                                        {new Date(ride.createdAt?.seconds ? ride.createdAt.seconds * 1000 : ride.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.infoSection}>
                                    <h4>Customer Information</h4>
                                    <div className={styles.infoGrid}>
                                        <div className={styles.infoItem}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                            </svg>
                                            <div>
                                                <span className={styles.label}>Name</span>
                                                <span className={styles.value}>{ride.customerName || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                                            </svg>
                                            <div>
                                                <span className={styles.label}>Phone</span>
                                                <span className={styles.value}>{ride.customerPhone || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                            </svg>
                                            <div>
                                                <span className={styles.label}>Email</span>
                                                <span className={styles.value}>{ride.customerEmail || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                            </svg>
                                            <div>
                                                <span className={styles.label}>Passengers</span>
                                                <span className={styles.value}>{ride.passengers || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.infoSection}>
                                    <h4>Trip Details</h4>
                                    <div className={styles.routeDetails}>
                                        <div className={styles.routePoint}>
                                            <div className={styles.routeIcon}>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <circle cx="12" cy="12" r="4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <span className={styles.label}>Pickup Location</span>
                                                <span className={styles.location}>{ride.pickupLocation || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className={styles.routeLine}></div>
                                        <div className={styles.routePoint}>
                                            <div className={styles.routeIcon}>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <span className={styles.label}>Dropoff Location</span>
                                                <span className={styles.location}>{ride.dropoffLocation || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.tripMeta}>
                                        <div className={styles.metaItem}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                                            </svg>
                                            <span>{ride.pickupDate}</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                                            </svg>
                                            <span>{ride.pickupTime}</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" />
                                            </svg>
                                            <span>{ride.vehicleType || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Documents Status */}
                                {ride.documents && ride.documents.length > 0 && (
                                    <div className={styles.infoSection}>
                                        <h4>Travel Documents</h4>
                                        <div className={styles.documentsStatus}>
                                            <span className={`${styles.docBadge} ${styles[ride.documentsStatus || 'pending']}`}>
                                                {ride.documentsStatus === 'submitted' ? '✓ Documents Submitted' :
                                                    ride.documentsStatus === 'verified' ? '✓ Verified' :
                                                        '⏳ Pending'}
                                            </span>
                                            <button
                                                className={styles.viewDocsBtn}
                                                onClick={() => window.open(`/admin/documents/${ride.id}`, '_blank')}
                                            >
                                                View Documents
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {ride.specialRequests && (
                                    <div className={styles.infoSection}>
                                        <h4>Special Requests</h4>
                                        <p className={styles.specialRequests}>{ride.specialRequests}</p>
                                    </div>
                                )}
                            </div>

                            <div className={styles.cardActions}>
                                <button
                                    className={styles.approveBtn}
                                    onClick={() => onUpdateStatus(ride.id, 'confirmed')}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                    Approve Booking
                                </button>
                                <button
                                    className={styles.rejectBtn}
                                    onClick={() => onCancelRide(ride)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                    </svg>
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// Expired Tab Component
function ExpiredTab({ rides, onCancelRide }) {
    const now = new Date()
    const expiredRides = rides.filter(r => {
        if (r.status === 'completed' || r.status === 'cancelled') return false
        const rideDateTime = new Date(`${r.pickupDate}T${r.pickupTime || '00:00'}`)
        return rideDateTime < now
    }).sort((a, b) => {
        const dateA = new Date(`${a.pickupDate}T${a.pickupTime || '00:00'}`)
        const dateB = new Date(`${b.pickupDate}T${b.pickupTime || '00:00'}`)
        return dateB - dateA
    })

    return (
        <div className={styles.expiredList}>
            <h3>Expired/Overdue Bookings ({expiredRides.length})</h3>
            <p className={styles.tabDescription}>Bookings that have passed their scheduled time</p>

            {expiredRides.length === 0 ? (
                <div className={styles.emptyState}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    <p>No expired bookings</p>
                    <small>All bookings are up to date</small>
                </div>
            ) : (
                <div className={styles.expiredGrid}>
                    {expiredRides.map(ride => {
                        const rideDateTime = new Date(`${ride.pickupDate}T${ride.pickupTime || '00:00'}`)
                        const hoursOverdue = Math.floor((now - rideDateTime) / (1000 * 60 * 60))

                        return (
                            <div key={ride.id} className={styles.expiredCard}>
                                <div className={styles.expiredHeader}>
                                    <span className={`${styles.statusBadge} ${styles.expired}`}>
                                        ⚠️ Expired
                                    </span>
                                    <span className={styles.overdueTime}>
                                        {hoursOverdue < 24
                                            ? `${hoursOverdue}h overdue`
                                            : `${Math.floor(hoursOverdue / 24)}d overdue`}
                                    </span>
                                </div>

                                <div className={styles.expiredBody}>
                                    <p className={styles.customerName}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                        </svg>
                                        {ride.customerName || 'N/A'}
                                    </p>
                                    <p className={styles.scheduledTime}>
                                        Scheduled: {ride.pickupDate} at {ride.pickupTime}
                                    </p>
                                    <p className={styles.route}>
                                        {ride.pickupLocation} → {ride.dropoffLocation}
                                    </p>
                                    <p className={styles.vehicle}>{ride.vehicleType} • {ride.passengers} pax</p>
                                    <span className={`${styles.currentStatus} ${styles[ride.status]}`}>
                                        Current: {ride.status}
                                    </span>
                                </div>

                                <div className={styles.expiredActions}>
                                    <button
                                        className={styles.cancelExpiredBtn}
                                        onClick={() => onCancelRide(ride)}
                                    >
                                        Cancel Booking
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// Map Tab Component
function MapTab({ rides }) {
    const activeRides = rides.filter(r => r.status === 'on-the-way')

    return (
        <div className={styles.mapContainer}>
            <div className={styles.mapPlaceholder}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
                </svg>
                <h3>Live Tracking Map</h3>
                <p>Google Maps Integration</p>
                <small>Add Google Maps API key in .env.local to enable real-time driver tracking</small>
            </div>
            <div className={styles.mapSidebar}>
                <h4>Active Rides ({activeRides.length})</h4>
                <div className={styles.activeRidesList}>
                    {activeRides.map(ride => (
                        <div key={ride.id} className={styles.mapRideCard}>
                            <div className={styles.rideMarker}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" />
                                </svg>
                            </div>
                            <div>
                                <p><strong>{ride.customerName}</strong></p>
                                <p className={styles.small}>{ride.pickupLocation}</p>
                                <p className={styles.small}>→ {ride.dropoffLocation}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// Communication Logs Component
function CommunicationLogs({ rides }) {
    const logs = rides.flatMap(ride => [
        { type: 'chat', time: ride.createdAt, customer: ride.customerName, message: 'Booking confirmed' },
        ...(ride.status === 'on-the-way' ? [{ type: 'call', time: ride.updatedAt, customer: ride.customerName, message: 'Driver called customer' }] : [])
    ]).sort((a, b) => new Date(b.time) - new Date(a.time))

    return (
        <div className={styles.logsList}>
            {logs.slice(0, 20).map((log, idx) => (
                <div key={idx} className={styles.logItem}>
                    <div className={styles.logIcon}>
                        {log.type === 'chat' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                            </svg>
                        )}
                    </div>
                    <div className={styles.logContent}>
                        <p><strong>{log.customer}</strong></p>
                        <p>{log.message}</p>
                        <span className={styles.logTime}>{new Date(log.time).toLocaleString()}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}
