'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { sendMessage, subscribeToMessages, markMessagesAsRead } from '../../../lib/firebase'
import VoiceCall from './VoiceCall'
import styles from './Chat.module.scss'

const Chat = ({ bookingId, driverName = 'Driver', driverId, isSupport = false }) => {
  const { user, userData } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showVoiceCall, setShowVoiceCall] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!bookingId || !user) return

    const unsubscribe = subscribeToMessages(bookingId, (msgs) => {
      setMessages(msgs)
      // Mark messages as read when chat is open
      if (isOpen) {
        markMessagesAsRead(bookingId, user.uid)
      }
    })

    return () => unsubscribe()
  }, [bookingId, user, isOpen])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !user) return

    setSending(true)
    const senderName = userData?.firstName 
      ? `${userData.firstName} ${userData.lastName || ''}`.trim()
      : user.displayName || 'User'

    const result = await sendMessage(
      bookingId,
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

  return (
    <>
      {/* Chat Toggle Button */}
      <button 
        className={`${styles.chatToggle} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
        )}
        <span>{isSupport ? 'Chat with Support' : `Chat with ${driverName}`}</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.headerInfo}>
              <div className={styles.avatar}>
                {(isSupport ? 'Support' : driverName)[0]}
              </div>
              <div>
                <h4>{isSupport ? 'Support' : driverName}</h4>
                <span className={styles.status}>{isSupport ? 'Support' : 'Vehicle Owner'}</span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button 
                className={styles.callBtn} 
                onClick={() => setShowVoiceCall(true)}
                title="Voice Call"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                </svg>
              </button>
              <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>

          <div className={styles.messagesContainer}>
            {messages.length === 0 ? (
              <div className={styles.emptyChat}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                </svg>
                <p>No messages yet</p>
                <span>Start a conversation about your booking</span>
              </div>
            ) : (
              Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  <div className={styles.dateDivider}>
                    <span>{date}</span>
                  </div>
                  {msgs.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`${styles.message} ${msg.senderId === user?.uid ? styles.sent : styles.received}`}
                    >
                      <div className={styles.messageContent}>
                        <p>{msg.message || msg.text}</p>
                        <span className={styles.time}>
                          {formatTime(msg.createdAt)}
                          {msg.senderId === user?.uid && (
                            <span className={styles.readStatus}>
                              {msg.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className={styles.inputContainer} onSubmit={handleSend}>
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
                <div className={styles.sendingSpinner}></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Voice Call */}
      {showVoiceCall && user && (
        <VoiceCall
          callId={`call_${bookingId}_${Date.now()}`}
          currentUserId={user.uid}
          currentUserName={userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : 'Customer'}
          otherUserName={driverName}
          receiverId={driverId}
          isIncoming={false}
          onEnd={() => setShowVoiceCall(false)}
        />
      )}
    </>
  )
}

export default Chat
