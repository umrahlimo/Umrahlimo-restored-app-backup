'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '../../../context/AuthContext'
import { signOutUser, db, storage, getUserBookings } from '../../../lib/firebase'
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import IncomingCallListener from '../../components/Chat/IncomingCallListener'
import Logo from '../../components/Logo/Logo'
import styles from '../dashboard.module.scss'
import profileStyles from './profile.module.scss'

const ProfilePage = () => {
  const router = useRouter()
  const { user, userData, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('personal')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [stats, setStats] = useState({ total: 0, completed: 0, upcoming: 0 })
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+966',
    photoURL: ''
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || user?.email || '',
        phone: userData.phone || '',
        countryCode: userData.countryCode || '+966',
        photoURL: userData.photoURL || ''
      })
      setImagePreview(userData.photoURL || null)
    } else if (user && !loading) {
      // If userData is null but user exists, use user data
      const nameParts = user.displayName?.split(' ') || ['', '']
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        countryCode: '+966',
        photoURL: user.photoURL || ''
      })
      setImagePreview(user.photoURL || null)
    }
  }, [userData, user, loading])

  useEffect(() => {
    const fetchStats = async () => {
      if (user) {
        const result = await getUserBookings(user.uid)
        if (result.success) {
          const bookings = result.bookings
          const now = new Date()
          setStats({
            total: bookings.length,
            completed: bookings.filter(b => b.status === 'completed').length,
            upcoming: bookings.filter(b => {
              const date = b.departureDate ? new Date(b.departureDate) : null
              return date && date >= now && b.status !== 'cancelled'
            }).length
          })
        }
      }
    }
    if (user) fetchStats()
  }, [user])

  const handleLogout = async () => {
    await signOutUser()
    router.push('/')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select a valid image file' })
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size should be less than 5MB' })
        return
      }
      
      setProfileImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUpload = async () => {
    if (!profileImage || !user) return null
    
    try {
      setIsUploadingImage(true)
      
      // Create unique filename with timestamp
      const timestamp = Date.now()
      const imageRef = ref(storage, `profile-images/${user.uid}_${timestamp}`)
      
      console.log('Uploading image to:', `profile-images/${user.uid}_${timestamp}`)
      
      // Upload new image
      const uploadResult = await uploadBytes(imageRef, profileImage)
      console.log('Upload successful:', uploadResult)
      
      const photoURL = await getDownloadURL(imageRef)
      console.log('Download URL:', photoURL)
      
      // Delete old image if exists (optional, don't fail if it doesn't exist)
      if (formData.photoURL && formData.photoURL.includes('firebase')) {
        try {
          // Extract old image path from URL
          const oldPath = formData.photoURL.split('/o/')[1]?.split('?')[0]
          if (oldPath) {
            const decodedPath = decodeURIComponent(oldPath)
            const oldImageRef = ref(storage, decodedPath)
            await deleteObject(oldImageRef)
            console.log('Old image deleted')
          }
        } catch (deleteError) {
          console.log('Could not delete old image:', deleteError.message)
          // Don't fail the upload if delete fails
        }
      }
      
      return photoURL
    } catch (error) {
      console.error('Image upload error:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      setMessage({ type: 'error', text: `Failed to upload image: ${error.message}` })
      return null
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setProfileImage(null)
    setImagePreview(null)
    setFormData(prev => ({ ...prev, photoURL: '' }))
  }

  const handleSave = async () => {
    if (!user) return
    
    setIsSaving(true)
    setMessage({ type: '', text: '' })
    
    try {
      let photoURL = formData.photoURL
      
      // Upload image if new image selected
      if (profileImage) {
        try {
          const uploadedURL = await handleImageUpload()
          if (uploadedURL) {
            photoURL = uploadedURL
          }
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError)
          // Continue with profile update even if image upload fails
          setMessage({ type: 'error', text: 'Image upload failed, but profile will be updated' })
        }
      }
      
      // Prepare update data
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        countryCode: formData.countryCode,
        email: formData.email,
        updatedAt: new Date()
      }
      
      // Only add photoURL if it exists
      if (photoURL) {
        updateData.photoURL = photoURL
      }
      
      // Check if document exists, if not create it
      const userDocRef = doc(db, 'customers_login', user.uid)
      const userDocSnap = await getDoc(userDocRef)
      
      if (!userDocSnap.exists()) {
        // Document doesn't exist, create it
        console.log('User document does not exist, creating new one...')
        await setDoc(userDocRef, {
          ...updateData,
          uid: user.uid,
          createdAt: new Date()
        })
        console.log('User document created successfully')
      } else {
        // Document exists, update it
        await updateDoc(userDocRef, updateData)
        console.log('User document updated successfully')
      }
      
      setFormData(prev => ({ ...prev, photoURL }))
      setProfileImage(null)
      setImagePreview(photoURL || null)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setIsEditing(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      console.error('Error details:', error.message, error.code)
      setMessage({ type: 'error', text: `Failed to update profile: ${error.message}` })
    } finally {
      setIsSaving(false)
    }
  }

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
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
          </svg>
          Dashboard
        </Link>
        <Link href="/dashboard/bookings" className={styles.navItem}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
          </svg>
          My Bookings
        </Link>
        <Link href="/dashboard/messages" className={styles.navItem}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
          Messages
        </Link>
        <Link href="/dashboard/profile" className={`${styles.navItem} ${styles.active}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          Profile
        </Link>
        <Link href="/search" className={styles.navItem}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          Book a Ride
        </Link>
      </nav>
      <div className={styles.sidebarFooter}>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
          Logout
        </button>
      </div>
    </aside>
  )

  if (loading || !user) {
    return (
      <div className={styles.dashboardPage}>
        <Sidebar />
        <main className={styles.mainContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading...</p>
          </div>
        </main>
      </div>
    )
  }

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
        <div className={profileStyles.profilePage}>
          {/* Redesigned Profile Header - Split Layout */}
          <div className={profileStyles.profileHeader}>
            {/* Left Card - Avatar & Stats */}
            <div className={profileStyles.profileCard}>
              <div className={profileStyles.avatarSection}>
                <div className={profileStyles.avatarWrapper}>
                  {imagePreview || formData.photoURL ? (
                    <div className={profileStyles.avatarImage}>
                      <Image 
                        src={imagePreview || formData.photoURL} 
                        alt="Profile" 
                        width={130} 
                        height={130}
                        className={profileStyles.avatarImg}
                      />
                    </div>
                  ) : (
                    <div className={profileStyles.avatar}>
                      {formData.firstName?.[0] || user?.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <div className={profileStyles.avatarBadge}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                </div>
                {isEditing && (
                  <div className={profileStyles.avatarEdit}>
                    <input
                      type="file"
                      id="profileImage"
                      accept="image/*"
                      onChange={handleImageSelect}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="profileImage" className={profileStyles.uploadBtn}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10h3zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-3.2-5c0 1.77 1.43 3.2 3.2 3.2s3.2-1.43 3.2-3.2-1.43-3.2-3.2-3.2-3.2 1.43-3.2 3.2z"/>
                      </svg>
                      {isUploadingImage ? 'Uploading...' : 'Upload'}
                    </label>
                    {(imagePreview || formData.photoURL) && (
                      <button 
                        type="button"
                        onClick={handleRemoveImage} 
                        className={profileStyles.removeBtn}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className={profileStyles.userBasicInfo}>
                <h1>{formData.firstName} {formData.lastName}</h1>
                <p>{formData.email}</p>
                <div className={profileStyles.memberBadge}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  Verified Member
                </div>
              </div>

              <div className={profileStyles.profileStats}>
                <div className={profileStyles.statItem}>
                  <span className={profileStyles.statNum}>{stats.total}</span>
                  <span className={profileStyles.statLabel}>Total</span>
                </div>
                <div className={profileStyles.statItem}>
                  <span className={profileStyles.statNum}>{stats.completed}</span>
                  <span className={profileStyles.statLabel}>Done</span>
                </div>
                <div className={profileStyles.statItem}>
                  <span className={profileStyles.statNum}>{stats.upcoming}</span>
                  <span className={profileStyles.statLabel}>Upcoming</span>
                </div>
              </div>
            </div>

            {/* Right Card - Account Info */}
            <div className={profileStyles.quickInfoCard}>
              <div className={profileStyles.quickInfoHeader}>
                <h3>Account Information</h3>
                <p>Your account details and status</p>
              </div>
              
              <div className={profileStyles.accountMetaGrid}>
                <div className={profileStyles.metaCard}>
                  <div className={profileStyles.metaIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                    </svg>
                  </div>
                  <div className={profileStyles.metaLabel}>Member Since</div>
                  <div className={profileStyles.metaValue}>
                    {userData?.createdAt?.toDate ? userData.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                  </div>
                </div>
                
                <div className={profileStyles.metaCard}>
                  <div className={profileStyles.metaIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div className={profileStyles.metaLabel}>Status</div>
                  <div className={`${profileStyles.metaValue} ${profileStyles.activeStatus}`}>Active</div>
                </div>
                
                <div className={profileStyles.metaCard}>
                  <div className={profileStyles.metaIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                  </div>
                  <div className={profileStyles.metaLabel}>Phone</div>
                  <div className={profileStyles.metaValue}>
                    {formData.phone ? `${formData.countryCode} ${formData.phone}` : 'Not set'}
                  </div>
                </div>
                
                <div className={profileStyles.metaCard}>
                  <div className={profileStyles.metaIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <div className={profileStyles.metaLabel}>Location</div>
                  <div className={profileStyles.metaValue}>Saudi Arabia</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className={profileStyles.tabsWrapper}>
            <button 
              className={`${profileStyles.tab} ${activeTab === 'personal' ? profileStyles.active : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              Personal Info
            </button>
            <button 
              className={`${profileStyles.tab} ${activeTab === 'security' ? profileStyles.active : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
              Security
            </button>
            <button 
              className={`${profileStyles.tab} ${activeTab === 'preferences' ? profileStyles.active : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
              </svg>
              Preferences
            </button>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`${profileStyles.alert} ${profileStyles[message.type]}`}>
              {message.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Content */}
          <div className={profileStyles.contentWrapper}>
            {activeTab === 'personal' && (
              <div className={profileStyles.card}>
                <div className={profileStyles.cardHeader}>
                  <div>
                    <h2>Personal Information</h2>
                    <p>Update your personal details here</p>
                  </div>
                  {!isEditing ? (
                    <button className={profileStyles.editBtn} onClick={() => setIsEditing(true)}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                      Edit Profile
                    </button>
                  ) : (
                    <div className={profileStyles.editActions}>
                      <button className={profileStyles.cancelBtn} onClick={() => setIsEditing(false)}>Cancel</button>
                      <button className={profileStyles.saveBtn} onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>

                <div className={profileStyles.formGrid}>
                  <div className={profileStyles.formGroup}>
                    <label>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/>
                      </svg>
                      First Name
                    </label>
                    {isEditing ? (
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Enter first name" />
                    ) : (
                      <div className={profileStyles.fieldValue}>{formData.firstName || 'Not set'}</div>
                    )}
                  </div>

                  <div className={profileStyles.formGroup}>
                    <label>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/>
                      </svg>
                      Last Name
                    </label>
                    {isEditing ? (
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Enter last name" />
                    ) : (
                      <div className={profileStyles.fieldValue}>{formData.lastName || 'Not set'}</div>
                    )}
                  </div>

                  <div className={profileStyles.formGroup}>
                    <label>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                      Email Address
                    </label>
                    <div className={`${profileStyles.fieldValue} ${profileStyles.locked}`}>
                      {formData.email}
                      <span className={profileStyles.lockIcon}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                        </svg>
                      </span>
                    </div>
                  </div>

                  <div className={profileStyles.formGroup}>
                    <label>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                      </svg>
                      Phone Number
                    </label>
                    {isEditing ? (
                      <div className={profileStyles.phoneInput}>
                        <select name="countryCode" value={formData.countryCode} onChange={handleChange}>
                          <option value="+966">🇸🇦 +966</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+92">🇵🇰 +92</option>
                          <option value="+971">🇦🇪 +971</option>
                        </select>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="5XX XXX XXXX" />
                      </div>
                    ) : (
                      <div className={profileStyles.fieldValue}>
                        {formData.phone ? `${formData.countryCode} ${formData.phone}` : 'Not set'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className={profileStyles.card}>
                <div className={profileStyles.cardHeader}>
                  <div>
                    <h2>Security Settings</h2>
                    <p>Manage your account security</p>
                  </div>
                </div>
                <div className={profileStyles.securityList}>
                  <div className={profileStyles.securityItem}>
                    <div className={profileStyles.securityIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                      </svg>
                    </div>
                    <div className={profileStyles.securityInfo}>
                      <h4>Password</h4>
                      <p>Last changed: Never</p>
                    </div>
                    <button className={profileStyles.securityBtn}>Change Password</button>
                  </div>
                  <div className={profileStyles.securityItem}>
                    <div className={profileStyles.securityIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
                      </svg>
                    </div>
                    <div className={profileStyles.securityInfo}>
                      <h4>Two-Factor Authentication</h4>
                      <p>Add an extra layer of security</p>
                    </div>
                    <button className={profileStyles.securityBtn}>Enable</button>
                  </div>
                  <div className={profileStyles.securityItem}>
                    <div className={profileStyles.securityIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                      </svg>
                    </div>
                    <div className={profileStyles.securityInfo}>
                      <h4>Login Activity</h4>
                      <p>View your recent login sessions</p>
                    </div>
                    <button className={profileStyles.securityBtn}>View</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className={profileStyles.card}>
                <div className={profileStyles.cardHeader}>
                  <div>
                    <h2>Preferences</h2>
                    <p>Customize your experience</p>
                  </div>
                </div>
                <div className={profileStyles.preferencesList}>
                  <div className={profileStyles.preferenceItem}>
                    <div>
                      <h4>Email Notifications</h4>
                      <p>Receive booking confirmations and updates</p>
                    </div>
                    <label className={profileStyles.toggle}>
                      <input type="checkbox" defaultChecked />
                      <span className={profileStyles.slider}></span>
                    </label>
                  </div>
                  <div className={profileStyles.preferenceItem}>
                    <div>
                      <h4>SMS Notifications</h4>
                      <p>Get text messages for trip reminders</p>
                    </div>
                    <label className={profileStyles.toggle}>
                      <input type="checkbox" defaultChecked />
                      <span className={profileStyles.slider}></span>
                    </label>
                  </div>
                  <div className={profileStyles.preferenceItem}>
                    <div>
                      <h4>Promotional Emails</h4>
                      <p>Receive offers and discounts</p>
                    </div>
                    <label className={profileStyles.toggle}>
                      <input type="checkbox" />
                      <span className={profileStyles.slider}></span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default ProfilePage
