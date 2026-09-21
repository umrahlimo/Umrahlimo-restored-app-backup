'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AdminLayout from '../../components/AdminLayout'
import styles from './adminDocuments.module.scss'
import { db } from '../../../../lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

export default function AdminDocumentsView() {
    const params = useParams()
    const bookingId = params.bookingId

    const [booking, setBooking] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBookingDocuments()
    }, [bookingId])

    const fetchBookingDocuments = async () => {
        try {
            const bookingRef = doc(db, 'bookings', bookingId)
            const bookingSnap = await getDoc(bookingRef)

            if (bookingSnap.exists()) {
                setBooking({ id: bookingSnap.id, ...bookingSnap.data() })
            } else {
                alert('Booking not found')
            }
        } catch (error) {
            console.error('Error fetching documents:', error)
            alert('Error loading documents')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyDocuments = async () => {
        if (!confirm('Mark all documents as verified?')) return

        try {
            const bookingRef = doc(db, 'bookings', bookingId)
            await updateDoc(bookingRef, {
                documentsStatus: 'verified',
                documentsVerifiedAt: new Date().toISOString(),
                documentsVerifiedBy: 'admin'
            })
            alert('Documents verified successfully!')
            fetchBookingDocuments()
        } catch (error) {
            console.error('Error verifying documents:', error)
            alert('Error verifying documents')
        }
    }

    const handleRejectDocuments = async () => {
        const reason = prompt('Enter rejection reason:')
        if (!reason) return

        try {
            const bookingRef = doc(db, 'bookings', bookingId)
            await updateDoc(bookingRef, {
                documentsStatus: 'rejected',
                documentsRejectedAt: new Date().toISOString(),
                documentsRejectionReason: reason
            })
            alert('Documents rejected. Customer will be notified.')
            fetchBookingDocuments()
        } catch (error) {
            console.error('Error rejecting documents:', error)
            alert('Error rejecting documents')
        }
    }

    if (loading) {
        return (
            <AdminLayout pageTitle="Documents Review" pageDescription="Review passenger travel documents">
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading documents...</p>
                </div>
            </AdminLayout>
        )
    }

    if (!booking || !booking.documents || booking.documents.length === 0) {
        return (
            <AdminLayout pageTitle="Documents Review" pageDescription="Review passenger travel documents">
                <div className={styles.emptyState}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                    <p>No documents uploaded yet</p>
                    <small>Customer has not submitted travel documents</small>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout pageTitle="Documents Review" pageDescription="Review passenger travel documents">
            <div className={styles.documentsView}>
                {/* Booking Info */}
                <div className={styles.bookingHeader}>
                    <div className={styles.headerInfo}>
                        <h2>Booking #{bookingId.slice(0, 8)}</h2>
                        <p>{booking.customerName} • {booking.pickupDate} at {booking.pickupTime}</p>
                        <p className={styles.route}>{booking.pickupLocation} → {booking.dropoffLocation}</p>
                    </div>
                    <div className={styles.headerStatus}>
                        <span className={`${styles.statusBadge} ${styles[booking.documentsStatus || 'pending']}`}>
                            {booking.documentsStatus === 'verified' ? '✓ Verified' :
                             booking.documentsStatus === 'rejected' ? '✗ Rejected' :
                             booking.documentsStatus === 'submitted' ? '⏳ Pending Review' :
                             '⏳ Not Submitted'}
                        </span>
                        {booking.documentsSubmittedAt && (
                            <small>Submitted: {new Date(booking.documentsSubmittedAt).toLocaleString()}</small>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                {booking.documentsStatus === 'submitted' && (
                    <div className={styles.actionButtons}>
                        <button className={styles.verifyBtn} onClick={handleVerifyDocuments}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                            Verify All Documents
                        </button>
                        <button className={styles.rejectBtn} onClick={handleRejectDocuments}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                            Reject Documents
                        </button>
                    </div>
                )}

                {/* Passengers Documents */}
                <div className={styles.passengersGrid}>
                    {booking.documents.map((passenger, index) => (
                        <div key={index} className={styles.passengerDocCard}>
                            <div className={styles.passengerHeader}>
                                <h3>Passenger {passenger.passengerNumber}</h3>
                            </div>

                            <div className={styles.passengerInfo}>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Full Name:</span>
                                    <span className={styles.value}>{passenger.passengerName}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Passport Number:</span>
                                    <span className={styles.value}>{passenger.passportNumber}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Uploaded:</span>
                                    <span className={styles.value}>
                                        {new Date(passenger.uploadedAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.documentsGrid}>
                                {/* Passport */}
                                <div className={styles.documentItem}>
                                    <div className={styles.docHeader}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                        </svg>
                                        <span>Passport Copy</span>
                                    </div>
                                    <a 
                                        href={passenger.passportUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={styles.viewBtn}
                                    >
                                        View Document
                                    </a>
                                </div>

                                {/* Visa */}
                                <div className={styles.documentItem}>
                                    <div className={styles.docHeader}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                        </svg>
                                        <span>Visa Copy</span>
                                    </div>
                                    <a 
                                        href={passenger.visaUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={styles.viewBtn}
                                    >
                                        View Document
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Rejection Reason */}
                {booking.documentsStatus === 'rejected' && booking.documentsRejectionReason && (
                    <div className={styles.rejectionNotice}>
                        <h4>Rejection Reason</h4>
                        <p>{booking.documentsRejectionReason}</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
