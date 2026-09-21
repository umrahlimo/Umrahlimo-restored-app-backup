'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import styles from '../admin.module.scss'
import { db } from '../../../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalVehicles: 0,
        totalBookings: 0,
        totalBanners: 0,
        pendingBookings: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch vehicles count
                const vehiclesSnap = await getDocs(collection(db, 'vehicles'))
                const vehiclesCount = vehiclesSnap.size

                // Fetch bookings count
                const bookingsSnap = await getDocs(collection(db, 'bookings'))
                const bookingsCount = bookingsSnap.size
                const pendingCount = bookingsSnap.docs.filter(
                    doc => doc.data().status === 'pending'
                ).length

                // Fetch banners count
                let bannersCount = 0
                try {
                    const bannersSnap = await getDocs(collection(db, 'admin_banners'))
                    bannersCount = bannersSnap.size
                } catch (e) {
                    // Collection might not exist yet
                }

                setStats({
                    totalVehicles: vehiclesCount,
                    totalBookings: bookingsCount,
                    totalBanners: bannersCount,
                    pendingBookings: pendingCount
                })
            } catch (error) {
                console.error('Error fetching stats:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    return (
        <AdminLayout
            pageTitle="Dashboard"
            pageDescription="Welcome to UmrahLimo Admin Panel"
        >
            {loading ? (
                <div className={styles.loadingState}>
                    <div className={styles.loadingSpinner}></div>
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statHeader}>
                                <div className={styles.statIcon}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                                    </svg>
                                </div>
                            </div>
                            <div className={styles.statValue}>{stats.totalVehicles}</div>
                            <div className={styles.statLabel}>Total Vehicles</div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statHeader}>
                                <div className={styles.statIcon}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                                    </svg>
                                </div>
                            </div>
                            <div className={styles.statValue}>{stats.totalBookings}</div>
                            <div className={styles.statLabel}>Total Bookings</div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statHeader}>
                                <div className={styles.statIcon}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                </div>
                            </div>
                            <div className={styles.statValue}>{stats.pendingBookings}</div>
                            <div className={styles.statLabel}>Pending Bookings</div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statHeader}>
                                <div className={styles.statIcon}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                                    </svg>
                                </div>
                            </div>
                            <div className={styles.statValue}>{stats.totalBanners}</div>
                            <div className={styles.statLabel}>Active Banners</div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className={styles.tableContainer}>
                        <div className={styles.tableHeader}>
                            <h3 className={styles.tableTitle}>Quick Actions</h3>
                        </div>
                        <div style={{ padding: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                            <a href="/admin/prices" className={styles.addBtn} style={{ textDecoration: 'none', justifyContent: 'center' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                                </svg>
                                Manage Prices
                            </a>
                            <a href="/admin/banners" className={styles.addBtn} style={{ textDecoration: 'none', justifyContent: 'center' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                                </svg>
                                Manage Banners
                            </a>
                        </div>
                    </div>
                </>
            )}
        </AdminLayout>
    )
}
