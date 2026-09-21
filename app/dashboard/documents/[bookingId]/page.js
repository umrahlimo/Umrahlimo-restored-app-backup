'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../../context/AuthContext'
import PortalNavbar from '../../../components/Navbar/PortalNavbar'
import Footer from '../../../components/Footer/Footer'
import styles from './documents.module.scss'
import { db, storage } from '../../../../lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export default function DocumentsUploadPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const bookingId = params.bookingId

    const [booking, setBooking] = useState(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [passengers, setPassengers] = useState([])
    const [uploadProgress, setUploadProgress] = useState({})

    useEffect(() => {
        if (!user) {
            router.push('/login')
            return
        }
        fetchBookingDetails()
    }, [user, bookingId])

    const fetchBookingDetails = async () => {
        try {
            const bookingRef = doc(db, 'bookings', bookingId)
            const bookingSnap = await getDoc(bookingRef)

            if (bookingSnap.exists()) {
                const bookingData = { id: bookingSnap.id, ...bookingSnap.data() }
                
                // Verify booking belongs to user
                if (bookingData.userId !== user.uid) {
                    alert('Unauthorized access')
                    router.push('/dashboard')
                    return
                }

                setBooking(bookingData)

                // Initialize passengers array
                const numPassengers = bookingData.passengers || 1
                const existingDocs = bookingData.documents || []
                
                const passengersArray = Array.from({ length: numPassengers }, (_, index) => {
                    const existingDoc = existingDocs.find(d => d.passengerNumber === index + 1)
                    return {
                        passengerNumber: index + 1,
                        passportFile: null,
                        passportUrl: existingDoc?.passportUrl || null,
                        visaFile: null,
                        visaUrl: existingDoc?.visaUrl || null,
                        passengerName: existingDoc?.passengerName || '',
                        passportNumber: existingDoc?.passportNumber || '',
                        uploadedAt: existingDoc?.uploadedAt || null
                    }
                })

                setPassengers(passengersArray)
            } else {
                alert('Booking not found')
                router.push('/dashboard')
            }
        } catch (error) {
            console.error('Error fetching booking:', error)
            alert('Error loading booking details')
        } finally {
            setLoading(false)
        }
    }

    const handleFileSelect = (passengerIndex, fileType, file) => {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
        if (!allowedTypes.includes(file.type)) {
            alert('Please upload only JPG, PNG, or PDF files')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB')
            return
        }

        const updatedPassengers = [...passengers]
        if (fileType === 'passport') {
            updatedPassengers[passengerIndex].passportFile = file
        } else {
            updatedPassengers[passengerIndex].visaFile = file
        }
        setPassengers(updatedPassengers)
    }

    const handlePassengerInfoChange = (passengerIndex, field, value) => {
        const updatedPassengers = [...passengers]
        updatedPassengers[passengerIndex][field] = value
        setPassengers(updatedPassengers)
    }

    const uploadFile = async (file, path) => {
        const storageRef = ref(storage, path)
        await uploadBytes(storageRef, file)
        const downloadURL = await getDownloadURL(storageRef)
        return downloadURL
    }

    const handleSubmitDocuments = async () => {
        // Validate all passengers have required info
        for (let i = 0; i < passengers.length; i++) {
            const passenger = passengers[i]
            
            if (!passenger.passengerName.trim()) {
                alert(`Please enter name for Passenger ${i + 1}`)
                return
            }

            if (!passenger.passportNumber.trim()) {
                alert(`Please enter passport number for Passenger ${i + 1}`)
                return
            }

            // Check if documents are uploaded or already exist
            if (!passenger.passportFile && !passenger.passportUrl) {
                alert(`Please upload passport copy for Passenger ${i + 1}`)
                return
            }

            if (!passenger.visaFile && !passenger.visaUrl) {
                alert(`Please upload visa copy for Passenger ${i + 1}`)
                return
            }
        }

        setUploading(true)

        try {
            const documentsData = []

            for (let i = 0; i < passengers.length; i++) {
                const passenger = passengers[i]
                setUploadProgress({ current: i + 1, total: passengers.length })

                let passportUrl = passenger.passportUrl
                let visaUrl = passenger.visaUrl

                // Upload new passport if file selected
                if (passenger.passportFile) {
                    const passportPath = `documents/${bookingId}/passenger_${i + 1}/passport_${Date.now()}.${passenger.passportFile.name.split('.').pop()}`
                    passportUrl = await uploadFile(passenger.passportFile, passportPath)
                }

                // Upload new visa if file selected
                if (passenger.visaFile) {
                    const visaPath = `documents/${bookingId}/passenger_${i + 1}/visa_${Date.now()}.${passenger.visaFile.name.split('.').pop()}`
                    visaUrl = await uploadFile(passenger.visaFile, visaPath)
                }

                documentsData.push({
                    passengerNumber: i + 1,
                    passengerName: passenger.passengerName,
                    passportNumber: passenger.passportNumber,
                    passportUrl: passportUrl,
                    visaUrl: visaUrl,
                    uploadedAt: new Date().toISOString()
                })
            }

            // Update booking with documents
            const bookingRef = doc(db, 'bookings', bookingId)
            await updateDoc(bookingRef, {
                documents: documentsData,
                documentsStatus: 'submitted',
                documentsSubmittedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })

            alert('Documents uploaded successfully! You will receive confirmation shortly.')
            router.push('/dashboard/bookings')

        } catch (error) {
            console.error('Error uploading documents:', error)
            alert('Error uploading documents. Please try again.')
        } finally {
            setUploading(false)
            setUploadProgress({})
        }
    }

    if (loading) {
        return (
            <div className={styles.documentsPage}>
                <PortalNavbar forceDark />
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading booking details...</p>
                </div>
                <Footer />
            </div>
        )
    }

    if (!booking) {
        return null
    }

    return (
        <div className={styles.documentsPage}>
            <PortalNavbar forceDark />

            <div className={styles.container}>
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={() => router.back()}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                        </svg>
                        Back
                    </button>
                    <h1>Upload Travel Documents</h1>
                    <p className={styles.subtitle}>Ministry Requirement - All passengers must submit documents before travel</p>
                </div>

                {/* Booking Info */}
                <div className={styles.bookingInfo}>
                    <h3>Booking Details</h3>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Booking ID:</span>
                            <span className={styles.value}>#{bookingId.slice(0, 8)}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Route:</span>
                            <span className={styles.value}>{booking.pickupLocation} → {booking.dropoffLocation}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Travel Date:</span>
                            <span className={styles.value}>{booking.pickupDate} at {booking.pickupTime}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Total Passengers:</span>
                            <span className={styles.value}>{booking.passengers}</span>
                        </div>
                    </div>
                </div>

                {/* Important Notice */}
                <div className={styles.notice}>
                    <div className={styles.noticeIcon}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                    </div>
                    <div className={styles.noticeContent}>
                        <h4>Important Requirements</h4>
                        <ul>
                            <li>Upload clear, readable copies of passport and visa for each passenger</li>
                            <li>Accepted formats: JPG, PNG, or PDF (max 5MB per file)</li>
                            <li>Ensure all information is visible and not blurred</li>
                            <li>Documents must be valid for the travel date</li>
                            <li>Ministry of Transport requires these documents before airport arrival</li>
                        </ul>
                    </div>
                </div>

                {/* Passengers Documents */}
                <div className={styles.passengersSection}>
                    {passengers.map((passenger, index) => (
                        <div key={index} className={styles.passengerCard}>
                            <div className={styles.passengerHeader}>
                                <h3>Passenger {index + 1}</h3>
                                {passenger.uploadedAt && (
                                    <span className={styles.uploadedBadge}>
                                        ✓ Uploaded
                                    </span>
                                )}
                            </div>

                            <div className={styles.passengerForm}>
                                {/* Passenger Info */}
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Full Name (as per passport) *</label>
                                        <input
                                            type="text"
                                            placeholder="Enter full name"
                                            value={passenger.passengerName}
                                            onChange={(e) => handlePassengerInfoChange(index, 'passengerName', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Passport Number *</label>
                                        <input
                                            type="text"
                                            placeholder="Enter passport number"
                                            value={passenger.passportNumber}
                                            onChange={(e) => handlePassengerInfoChange(index, 'passportNumber', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Document Uploads */}
                                <div className={styles.documentsRow}>
                                    {/* Passport Upload */}
                                    <div className={styles.uploadGroup}>
                                        <label>Passport Copy *</label>
                                        <div className={styles.uploadBox}>
                                            {passenger.passportUrl ? (
                                                <div className={styles.uploadedFile}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                                    </svg>
                                                    <span>Passport uploaded</span>
                                                    <a href={passenger.passportUrl} target="_blank" rel="noopener noreferrer">
                                                        View
                                                    </a>
                                                </div>
                                            ) : passenger.passportFile ? (
                                                <div className={styles.selectedFile}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"/>
                                                    </svg>
                                                    <span>{passenger.passportFile.name}</span>
                                                    <button onClick={() => handleFileSelect(index, 'passport', null)}>×</button>
                                                </div>
                                            ) : (
                                                <label className={styles.uploadLabel}>
                                                    <input
                                                        type="file"
                                                        accept=".jpg,.jpeg,.png,.pdf"
                                                        onChange={(e) => handleFileSelect(index, 'passport', e.target.files[0])}
                                                    />
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                                    </svg>
                                                    <span>Click to upload passport</span>
                                                    <small>JPG, PNG or PDF (max 5MB)</small>
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    {/* Visa Upload */}
                                    <div className={styles.uploadGroup}>
                                        <label>Visa Copy *</label>
                                        <div className={styles.uploadBox}>
                                            {passenger.visaUrl ? (
                                                <div className={styles.uploadedFile}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                                    </svg>
                                                    <span>Visa uploaded</span>
                                                    <a href={passenger.visaUrl} target="_blank" rel="noopener noreferrer">
                                                        View
                                                    </a>
                                                </div>
                                            ) : passenger.visaFile ? (
                                                <div className={styles.selectedFile}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"/>
                                                    </svg>
                                                    <span>{passenger.visaFile.name}</span>
                                                    <button onClick={() => handleFileSelect(index, 'visa', null)}>×</button>
                                                </div>
                                            ) : (
                                                <label className={styles.uploadLabel}>
                                                    <input
                                                        type="file"
                                                        accept=".jpg,.jpeg,.png,.pdf"
                                                        onChange={(e) => handleFileSelect(index, 'visa', e.target.files[0])}
                                                    />
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                                    </svg>
                                                    <span>Click to upload visa</span>
                                                    <small>JPG, PNG or PDF (max 5MB)</small>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Submit Button */}
                <div className={styles.submitSection}>
                    <button
                        className={styles.submitBtn}
                        onClick={handleSubmitDocuments}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <>
                                <div className={styles.spinner}></div>
                                Uploading... {uploadProgress.current}/{uploadProgress.total}
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                </svg>
                                Submit All Documents
                            </>
                        )}
                    </button>
                    <p className={styles.submitNote}>
                        By submitting, you confirm that all information and documents are accurate and valid
                    </p>
                </div>
            </div>

            <Footer />
        </div>
    )
}
