'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../context/AuthContext'
import { getUserChats, signOutUser } from '../../../lib/firebase'
import IncomingCallListener from '../../components/Chat/IncomingCallListener'
import Logo from '../../components/Logo/Logo'
import styles from '../dashboard.module.scss'
import msgStyles from './messages.module.scss'

const MessagesPage = () => {
  const router = useRouter()
  const { user, userData, loading } = useAuth()
  const [chats, setChats] = useState([])
  const [loadingChats, setLoadingChats] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchChats = async () => {
      if (user) {
        const result = await getUserChats(user.uid)
        if (result.success) {
          setChats(result.chats)
        }
        setLoadingChats(false)
      }
    }
    
    if (user) {
      fetchChats()
    }
  }, [user])

  const handleLogout = async () => {
    await signOutUser()
    router.push('/')
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    if (diff < 604800000) return date.toLocaleDateString('en-US', { weekday: 'short' })
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
          <Link href="/dashboard/messages" className={`${styles.navItem} ${styles.active}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            Messages
          </Link>
          <Link href="/dashboard/profile" className={styles.navItem}>
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

      {/* Main Content */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Messages</h1>
            <p>Chat with your drivers</p>
          </div>
        </header>

        <div className={msgStyles.messagesContainer}>
          {loadingChats ? (
            <div className={msgStyles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading conversations...</p>
            </div>
          ) : chats.length === 0 ? (
            <div className={msgStyles.emptyState}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
              <h3>No conversations yet</h3>
              <p>When you book a ride, you can chat with your driver here</p>
              <Link href="/search" className={msgStyles.bookBtn}>Book a Ride</Link>
            </div>
          ) : (
            <div className={msgStyles.chatList}>
              {chats.map((chat) => {
                // Get the vehicle owner name for this booking
                const ownerName = chat.booking?.vehicleOwnerName || 'Driver'
                
                return (
                  <Link 
                    key={chat.bookingId} 
                    href={`/dashboard/messages/${chat.bookingId}`}
                    className={msgStyles.chatItem}
                  >
                    <div className={msgStyles.chatAvatar}>
                      {ownerName[0]}
                    </div>
                    <div className={msgStyles.chatInfo}>
                      <div className={msgStyles.chatHeader}>
                        <h4>{ownerName}</h4>
                        <span className={msgStyles.time}>{formatTime(chat.lastMessageAt)}</span>
                      </div>
                      <div className={msgStyles.chatPreview}>
                        <p>{chat.lastMessage || 'No messages'}</p>
                        <span className={msgStyles.bookingRef}>#{chat.bookingRef}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default MessagesPage
