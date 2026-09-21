'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../../context/AuthContext'
import { signOutUser, db, sendMessage, subscribeToMessages, markMessagesAsRead } from '../../../../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import Logo from '../../../components/Logo/Logo'
import styles from '../../dashboard.module.scss'
import chatStyles from './chat.module.scss'

const ChatPage = () => {
  const router = useRouter()
  const params = useParams()
  const { user, userData, loading } = useAuth()
  const [booking, setBooking] = useState(null)
  const [vehicleOwner, setVehicleOwner] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingChat, setLoadingChat] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      if (user && params.bookingId) {
        try {
          const bookingDoc = await getDoc(doc(db, 'bookings', params.bookingId))
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
              router.push('/dashboard/messages')
            }
          } else {
            router.push('/dashboard/messages')
          }
        } catch (error) {
          console.error('Error fetching booking:', error)
        }
        setLoadingChat(false)
      }
    }
    
    if (user) {
      fetchBooking()
    }
  }, [user, params.bookingId, router])

  // Subscribe to messages
  useEffect(() => {
    if (!params.bookingId || !user) return

    const unsubscribe = subscribeToMessages(params.bookingId, (msgs) => {
      setMessages(msgs)
      markMessagesAsRead(params.bookingId, user.uid)
    })

    return () => unsubscribe()
  }, [params.bookingId, user])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on load
  useEffect(() => {
    if (!loadingChat && inputRef.current) {
      inputRef.current.focus()
    }
  }, [loadingChat])

  const handleLogout = async () => {
    await signOutUser()
    router.push('/')
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !user) return

    setSending(true)
    const senderName = userData?.firstName 
      ? `${userData.firstName} ${userData.lastName || ''}`.trim()
      : user.displayName || 'User'

    const result = await sendMessage(
      params.bookingId,
      user.uid,
      senderName,
      'user',
      newMessage.trim()
    )

    if (result.success) {
      setNewMessage('')
    }
    setSending(false)
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.createdAt)
    if (!groups[date]) groups[date] = []
    groups[date].push(msg)
    return groups
  }, {})

  // Get the vehicle owner name for this booking
  const getOwnerName = () => {
    if (booking?.vehicleOwnerName) {
      return booking.vehicleOwnerName
    }
    if (vehicleOwner) {
      return vehicleOwner
    }
    if (booking?.driverName) {
      return booking.driverName
    }
    return 'Driver'
  }

  const ownerName = getOwnerName()

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
        <div className={chatStyles.chatPage}>
          {/* Chat Header */}
          <div className={chatStyles.chatHeader}>
            <Link href="/dashboard/messages" className={chatStyles.backBtn}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </Link>
            <div className={chatStyles.headerInfo}>
              <div className={chatStyles.avatar}>
                {ownerName[0]}
              </div>
              <div>
                <h2>{ownerName}</h2>
                <span className={chatStyles.bookingRef}>
                  Booking #{booking?.bookingRef || params.bookingId?.slice(0, 8).toUpperCase()}
                </span>
              </div>
            </div>
            <Link href={`/dashboard/bookings/${params.bookingId}`} className={chatStyles.viewBookingBtn}>
              View Booking
            </Link>
          </div>

          {/* Messages Area */}
          <div className={chatStyles.messagesArea}>
            {loadingChat ? (
              <div className={chatStyles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading chat...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className={chatStyles.emptyChat}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                </svg>
                <h3>No messages yet</h3>
                <p>Start a conversation about your booking</p>
              </div>
            ) : (
              <div className={chatStyles.messagesList}>
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    <div className={chatStyles.dateDivider}>
                      <span>{date}</span>
                    </div>
                    {msgs.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`${chatStyles.message} ${msg.senderId === user?.uid ? chatStyles.sent : chatStyles.received}`}
                      >
                        <div className={chatStyles.messageContent}>
                          <p>{msg.message || msg.text}</p>
                          <span className={chatStyles.time}>
                            {formatTime(msg.createdAt)}
                            {msg.senderId === user?.uid && (
                              <span className={chatStyles.readStatus}>
                                {msg.read ? '✓✓' : '✓'}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <form className={chatStyles.inputArea} onSubmit={handleSend}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
            />
            <button type="submit" disabled={!newMessage.trim() || sending}>
              {sending ? (
                <div className={chatStyles.sendingSpinner}></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default ChatPage
