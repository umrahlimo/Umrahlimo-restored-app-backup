'use client'

import { useState, useEffect, useRef } from 'react'
import { db } from '../../../lib/firebase'
import { doc, setDoc, onSnapshot, updateDoc, getDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import styles from './VoiceCall.module.scss'

// STUN/TURN servers for WebRTC
// IMPORTANT: For production, create your own FREE account at https://www.metered.ca/stun-turn
// and replace credentials below with your own
const servers = {
  iceServers: [
    // Google STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Twilio STUN
    { urls: 'stun:global.stun.twilio.com:3478' },

    // OpenRelay TURN servers (Free, working as of 2024)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:80?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turns:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },

    // Backup: Metered.ca Standard TURN
    {
      urls: 'turn:standard.relay.metered.ca:80',
      username: 'e8dd65c92ae130293bc12801',
      credential: 'uWwJjpLWb5ehLSM0'
    },
    {
      urls: 'turn:standard.relay.metered.ca:443',
      username: 'e8dd65c92ae130293bc12801',
      credential: 'uWwJjpLWb5ehLSM0'
    },
    {
      urls: 'turns:standard.relay.metered.ca:443?transport=tcp',
      username: 'e8dd65c92ae130293bc12801',
      credential: 'uWwJjpLWb5ehLSM0'
    }
  ],
  iceCandidatePoolSize: 10,
  // IMPORTANT: Set to 'relay' to FORCE TURN usage (for testing different networks)
  // Change to 'all' for production after confirming TURN works
  iceTransportPolicy: 'all'
}

const VoiceCall = ({
  callId,
  currentUserId,
  currentUserName,
  otherUserName,
  receiverId = null,
  isIncoming = false,
  onEnd
}) => {
  const [callStatus, setCallStatus] = useState(isIncoming ? 'incoming' : 'calling')
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  const peerConnection = useRef(null)
  const localStream = useRef(null)
  const remoteStream = useRef(null)
  const remoteAudio = useRef(null)
  const timerRef = useRef(null)
  const iceCandidatesQueue = useRef([])
  const hasRemoteDescription = useRef(false)

  // Play remote audio with proper error handling
  const playRemoteAudio = async () => {
    if (remoteAudio.current && remoteStream.current) {
      remoteAudio.current.srcObject = remoteStream.current
      remoteAudio.current.muted = false
      remoteAudio.current.volume = 1.0

      try {
        await remoteAudio.current.play()
        console.log('✅ Remote audio playing successfully')
      } catch (error) {
        console.error('Audio play failed:', error)
        // Retry on user interaction
        document.addEventListener('click', async () => {
          try {
            await remoteAudio.current?.play()
            console.log('✅ Audio started after user interaction')
          } catch (e) {
            console.error('Retry play failed:', e)
          }
        }, { once: true })
      }
    }
  }

  // Process queued ICE candidates
  const processQueuedCandidates = async () => {
    if (peerConnection.current && hasRemoteDescription.current) {
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift()
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate))
          console.log('✅ Added queued ICE candidate')
        } catch (e) {
          console.error('Error adding queued ICE candidate:', e)
        }
      }
    }
  }

  // Add ICE candidate (queue if remote description not set yet)
  const addIceCandidate = async (candidate) => {
    if (!candidate) return

    if (peerConnection.current && hasRemoteDescription.current) {
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate))
        console.log('✅ Added ICE candidate directly')
      } catch (e) {
        console.error('Error adding ICE candidate:', e)
      }
    } else {
      // Queue candidate for later
      iceCandidatesQueue.current.push(candidate)
      console.log('📋 Queued ICE candidate for later')
    }
  }

  useEffect(() => {
    let isMounted = true

    // Initialize remote stream
    remoteStream.current = new MediaStream()

    if (isIncoming) {
      // Wait for user to accept
    } else {
      if (isMounted) startCall()
    }

    return () => {
      isMounted = false
      cleanup()
    }
  }, [isIncoming])

  useEffect(() => {
    if (!callId) return

    let unsubscribed = false

    // Listen for call document changes (including ICE candidates from other party)
    const unsubscribe = onSnapshot(doc(db, 'calls', callId), async (snapshot) => {
      if (unsubscribed) return

      const data = snapshot.data()
      if (!data) return

      console.log('📞 Call update:', data.status)

      if (data.status === 'ended' || data.status === 'rejected') {
        cleanup()
        onEnd()
      } else if (data.status === 'accepted' && callStatus === 'calling') {
        setCallStatus('connected')
        startTimer()
        playRemoteAudio()
      } else if (data.answer && !peerConnection.current?.currentRemoteDescription) {
        await handleAnswer(data.answer)
      }

      // Process ICE candidates from the OTHER party
      // If we're the caller, get receiver's candidates
      // If we're the receiver, get caller's candidates
      if (isIncoming && data.iceCandidates_caller) {
        for (const candidate of data.iceCandidates_caller) {
          await addIceCandidate(candidate)
        }
      } else if (!isIncoming && data.iceCandidates_receiver) {
        for (const candidate of data.iceCandidates_receiver) {
          await addIceCandidate(candidate)
        }
      }
    }, (error) => {
      console.error('Call listener error:', error)
    })

    return () => {
      unsubscribed = true
      unsubscribe()
    }
  }, [callId, callStatus, onEnd, isIncoming])

  const startCall = async () => {
    try {
      console.log('🎤 Starting call...')
      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      console.log('✅ Got local audio stream')

      peerConnection.current = new RTCPeerConnection(servers)

      // Add local tracks
      localStream.current.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, localStream.current)
        console.log('✅ Added local track:', track.kind)
      })

      // Handle remote tracks
      peerConnection.current.ontrack = (event) => {
        console.log('🔊 Remote track received:', event.track.kind)
        event.streams[0].getTracks().forEach(track => {
          console.log('Adding track to remote stream:', track.kind, track.readyState)
          remoteStream.current.addTrack(track)
        })
        playRemoteAudio()
      }

      // Log connection state changes
      peerConnection.current.onconnectionstatechange = () => {
        console.log('📡 Connection state:', peerConnection.current?.connectionState)
        if (peerConnection.current?.connectionState === 'connected') {
          playRemoteAudio()
        }
      }

      peerConnection.current.oniceconnectionstatechange = () => {
        console.log('🧊 ICE connection state:', peerConnection.current?.iceConnectionState)
      }

      // Handle ICE candidates - save to Firestore as array
      peerConnection.current.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log('🧊 Got local ICE candidate (caller)')
          try {
            await updateDoc(doc(db, 'calls', callId), {
              iceCandidates_caller: arrayUnion(event.candidate.toJSON())
            })
          } catch (e) {
            console.error('Error saving ICE candidate:', e)
          }
        }
      }

      const offer = await peerConnection.current.createOffer()
      await peerConnection.current.setLocalDescription(offer)
      console.log('✅ Created and set local offer')

      await setDoc(doc(db, 'calls', callId), {
        offer: { type: offer.type, sdp: offer.sdp },
        callerId: currentUserId,
        callerName: currentUserName,
        receiverId: receiverId || null,
        receiverName: otherUserName,
        status: 'calling',
        iceCandidates_caller: [],
        iceCandidates_receiver: [],
        createdAt: serverTimestamp()
      })

      console.log('✅ Call document created')

    } catch (error) {
      console.error('Error starting call:', error)
      alert('Could not access microphone. Please allow microphone access.')
      onEnd()
    }
  }

  const acceptCall = async () => {
    try {
      console.log('📞 Accepting call...')
      setCallStatus('connecting')

      // Initialize remote stream if not already
      if (!remoteStream.current) {
        remoteStream.current = new MediaStream()
      }

      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      console.log('✅ Got local audio stream')

      peerConnection.current = new RTCPeerConnection(servers)

      // Add local tracks
      localStream.current.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, localStream.current)
        console.log('✅ Added local track:', track.kind)
      })

      // Handle remote tracks
      peerConnection.current.ontrack = (event) => {
        console.log('🔊 Remote track received:', event.track.kind)
        event.streams[0].getTracks().forEach(track => {
          console.log('Adding track to remote stream:', track.kind, track.readyState)
          remoteStream.current.addTrack(track)
        })
        playRemoteAudio()
      }

      // Log connection state changes
      peerConnection.current.onconnectionstatechange = () => {
        console.log('📡 Connection state:', peerConnection.current?.connectionState)
        if (peerConnection.current?.connectionState === 'connected') {
          playRemoteAudio()
        }
      }

      peerConnection.current.oniceconnectionstatechange = () => {
        console.log('🧊 ICE connection state:', peerConnection.current?.iceConnectionState)
      }

      // Handle ICE candidates - save to Firestore as array (receiver's candidates)
      peerConnection.current.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log('🧊 Got local ICE candidate (receiver)')
          try {
            await updateDoc(doc(db, 'calls', callId), {
              iceCandidates_receiver: arrayUnion(event.candidate.toJSON())
            })
          } catch (e) {
            console.error('Error saving ICE candidate:', e)
          }
        }
      }

      // Get the call document with offer
      const callDocSnap = await getDoc(doc(db, 'calls', callId))
      const callData = callDocSnap.data()

      if (!callData?.offer) {
        throw new Error('No offer found')
      }

      // Set remote description (offer from caller)
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(callData.offer))
      hasRemoteDescription.current = true
      console.log('✅ Set remote description (offer)')

      // Process any queued ICE candidates
      await processQueuedCandidates()

      // Add any existing caller ICE candidates
      if (callData.iceCandidates_caller) {
        for (const candidate of callData.iceCandidates_caller) {
          await addIceCandidate(candidate)
        }
      }

      const answer = await peerConnection.current.createAnswer()
      await peerConnection.current.setLocalDescription(answer)
      console.log('✅ Created and set local answer')

      await updateDoc(doc(db, 'calls', callId), {
        answer: { type: answer.type, sdp: answer.sdp },
        status: 'accepted',
        acceptedAt: serverTimestamp()
      })

      setCallStatus('connected')
      startTimer()

      // Try to play audio after accepting
      setTimeout(() => playRemoteAudio(), 500)

    } catch (error) {
      console.error('Error accepting call:', error)
      alert('Could not accept call. Please check microphone permissions.')
      endCall()
    }
  }

  const handleAnswer = async (answer) => {
    if (!peerConnection.current) return
    try {
      console.log('📞 Handling answer...')
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer))
      hasRemoteDescription.current = true
      console.log('✅ Set remote description (answer)')

      // Process any queued ICE candidates
      await processQueuedCandidates()

      // Try to play audio after answer is set
      setTimeout(() => playRemoteAudio(), 500)
    } catch (error) {
      console.error('Error handling answer:', error)
    }
  }

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)
  }

  const toggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  const endCall = async () => {
    try {
      await updateDoc(doc(db, 'calls', callId), {
        status: 'ended',
        endedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error ending call:', error)
    }
    cleanup()
    onEnd()
  }

  const rejectCall = async () => {
    try {
      await updateDoc(doc(db, 'calls', callId), {
        status: 'rejected',
        rejectedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error rejecting call:', error)
    }
    cleanup()
    onEnd()
  }

  const cleanup = () => {
    console.log('🧹 Cleaning up call resources...')
    if (timerRef.current) clearInterval(timerRef.current)
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop())
    }
    if (remoteStream.current) {
      remoteStream.current.getTracks().forEach(track => track.stop())
    }
    if (peerConnection.current) {
      peerConnection.current.close()
    }
    iceCandidatesQueue.current = []
    hasRemoteDescription.current = false
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.voiceCallOverlay}>
      <div className={styles.voiceCallModal}>
        {/* Audio element with playsInline for mobile */}
        <audio
          ref={remoteAudio}
          autoPlay
          playsInline
          style={{ display: 'none' }}
        />

        <div className={styles.callAvatar}>
          {otherUserName?.charAt(0) || 'U'}
        </div>

        <h3>{otherUserName}</h3>

        <p className={styles.callStatus}>
          {callStatus === 'incoming' && 'Incoming call...'}
          {callStatus === 'calling' && 'Calling...'}
          {callStatus === 'connecting' && 'Connecting...'}
          {callStatus === 'connected' && formatDuration(callDuration)}
        </p>

        <div className={styles.callActions}>
          {callStatus === 'incoming' ? (
            <>
              <button className={styles.btnAcceptCall} onClick={acceptCall}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
              </button>
              <button className={styles.btnRejectCall} onClick={rejectCall}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button className={`${styles.btnMute} ${isMuted ? styles.muted : ''}`} onClick={toggleMute}>
                {isMuted ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
                    <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                )}
              </button>
              <button className={styles.btnEndCall} onClick={endCall}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default VoiceCall
