'use client'

import { useState, useEffect } from 'react'
import { db } from '../../../lib/firebase'
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore'
import VoiceCall from './VoiceCall'

const IncomingCallListener = ({ userId, userName }) => {
  const [incomingCall, setIncomingCall] = useState(null)

  useEffect(() => {
    if (!userId) return

    // Listen for incoming calls where this user is the receiver
    // We check for calls that are in 'calling' status and were created recently
    const callsQuery = query(
      collection(db, 'calls'),
      where('status', '==', 'calling'),
      orderBy('createdAt', 'desc'),
      limit(5)
    )

    const unsubscribe = onSnapshot(callsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const callData = change.doc.data()
          
          // Check if this call is for this user (not the caller)
          // Either receiverId matches OR callerId doesn't match (for backward compatibility)
          const isForMe = callData.receiverId === userId || 
                         (callData.callerId !== userId && !callData.receiverId)
          
          if (isForMe && callData.status === 'calling') {
            // Check if call is recent (within last 30 seconds)
            const createdAt = callData.createdAt?.toDate?.() || new Date()
            const now = new Date()
            const diffSeconds = (now - createdAt) / 1000
            
            if (diffSeconds < 30) {
              setIncomingCall({
                callId: change.doc.id,
                callerName: callData.callerName,
                callerId: callData.callerId
              })
            }
          }
        }
      })
    }, (error) => {
      console.error('Error listening for calls:', error)
    })

    return () => unsubscribe()
  }, [userId])

  const handleCallEnd = () => {
    setIncomingCall(null)
  }

  if (!incomingCall) return null

  return (
    <VoiceCall
      callId={incomingCall.callId}
      currentUserId={userId}
      currentUserName={userName}
      otherUserName={incomingCall.callerName}
      isIncoming={true}
      onEnd={handleCallEnd}
    />
  )
}

export default IncomingCallListener
