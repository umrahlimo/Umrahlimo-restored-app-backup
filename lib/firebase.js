import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, query, where, orderBy, limit, startAfter, doc, setDoc, getDoc, addDoc, serverTimestamp, onSnapshot, updateDoc } from 'firebase/firestore'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import { getFunctions, httpsCallable } from 'firebase/functions'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase only if we have valid config (avoid build-time errors)
let app, db, auth, storage, googleProvider, functionsInstance

if (typeof window !== 'undefined' || process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  db = getFirestore(app)
  auth = getAuth(app)
  storage = getStorage(app)
  googleProvider = new GoogleAuthProvider()
  if (typeof window !== 'undefined') {
    functionsInstance = getFunctions(app)
  }
}

const recordLoginAndMaybeSendWelcomeBack = async () => {
  if (!functionsInstance) return
  try {
    const callable = httpsCallable(functionsInstance, 'recordLoginAndMaybeSendWelcomeBack')
    await callable({})
  } catch (error) {
    console.warn('Login tracking failed:', error)
  }
}

// ============ AUTH FUNCTIONS ============

// Sign up new user
export const signUpUser = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Update display name
    await updateProfile(user, {
      displayName: `${userData.firstName} ${userData.lastName}`
    })
    
    // Store user data in customers_login collection
    await setDoc(doc(db, 'customers_login', user.uid), {
      uid: user.uid,
      email: user.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone || '',
      countryCode: userData.countryCode || '+966',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    await recordLoginAndMaybeSendWelcomeBack()
    
    return { success: true, user }
  } catch (error) {
    console.error('Signup error:', error)
    return { success: false, error: error.message, code: error.code }
  }
}

// Sign in existing user
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    await recordLoginAndMaybeSendWelcomeBack()
    return { success: true, user: userCredential.user }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: error.message, code: error.code }
  }
}

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    
    // Check if user exists in database
    const userDoc = await getDoc(doc(db, 'customers_login', user.uid))
    
    if (!userDoc.exists()) {
      // Create new user document
      const nameParts = user.displayName?.split(' ') || ['User']
      await setDoc(doc(db, 'customers_login', user.uid), {
        uid: user.uid,
        email: user.email,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || '',
        phone: user.phoneNumber || '',
        countryCode: '+966',
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }

    await recordLoginAndMaybeSendWelcomeBack()
    
    return { success: true, user }
  } catch (error) {
    console.error('Google sign in error:', error)
    return { success: false, error: error.message, code: error.code }
  }
}

// Sign out user
export const signOutUser = async () => {
  try {
    await signOut(auth)
    return { success: true }
  } catch (error) {
    console.error('Signout error:', error)
    return { success: false, error: error.message }
  }
}

// Reset password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email)
    return { success: true }
  } catch (error) {
    console.error('Password reset error:', error)
    return { success: false, error: error.message, code: error.code }
  }
}

// Get current user data from database
export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'customers_login', uid))
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() }
    }
    return { success: false, error: 'User not found' }
  } catch (error) {
    console.error('Get user data error:', error)
    return { success: false, error: error.message }
  }
}

// ============ PAYMENT SETTINGS FUNCTIONS ============

// Get payment settings
export const getPaymentSettings = async () => {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'payment'))
    if (settingsDoc.exists()) {
      return {
        success: true,
        settings: {
          ...settingsDoc.data(),
          currency: 'USD'
        }
      }
    }
    // Return default settings if not found
    return {
      success: true,
      settings: {
        depositPercentage: 50,
        currency: 'USD',
        taxPercentage: 0,
        serviceFeePercentage: 0,
        cancellationPolicy: {
          fullRefundHours: 24,
          partialRefundHours: 12,
          partialRefundPercentage: 50
        }
      }
    }
  } catch (error) {
    console.error('Get payment settings error:', error)
    return { success: false, error: error.message }
  }
}

// ============ BOOKING FUNCTIONS ============

// Create new booking
export const createBooking = async (bookingData, userId) => {
  try {
    const bookingRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      userId,
      status: 'pending',
      adminApproval: 'pending',
      driverAssigned: null,
      driverApproval: 'pending',
      paymentStatus: 'deposit_paid',
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date().toISOString(),
          note: 'Booking created - Awaiting admin approval'
        }
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { success: true, bookingId: bookingRef.id }
  } catch (error) {
    console.error('Create booking error:', error)
    return { success: false, error: error.message }
  }
}

// Admin approve booking and assign to driver
export const adminApproveBooking = async (bookingId, driverId, driverName, adminNotes = '') => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId)
    const bookingDoc = await getDoc(bookingRef)
    
    if (!bookingDoc.exists()) {
      return { success: false, error: 'Booking not found' }
    }
    
    const currentHistory = bookingDoc.data().statusHistory || []
    
    await updateDoc(bookingRef, {
      status: 'admin_approved',
      adminApproval: 'approved',
      driverAssigned: driverId,
      driverName: driverName,
      adminNotes: adminNotes,
      statusHistory: [
        ...currentHistory,
        {
          status: 'admin_approved',
          timestamp: new Date().toISOString(),
          note: `Admin approved - Assigned to driver: ${driverName}`,
          adminNotes: adminNotes
        }
      ],
      updatedAt: serverTimestamp()
    })
    
    return { success: true }
  } catch (error) {
    console.error('Admin approve booking error:', error)
    return { success: false, error: error.message }
  }
}

// Driver accept booking
export const driverAcceptBooking = async (bookingId, driverId, driverNotes = '') => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId)
    const bookingDoc = await getDoc(bookingRef)
    
    if (!bookingDoc.exists()) {
      return { success: false, error: 'Booking not found' }
    }
    
    const currentHistory = bookingDoc.data().statusHistory || []
    
    await updateDoc(bookingRef, {
      status: 'confirmed',
      driverApproval: 'accepted',
      driverNotes: driverNotes,
      statusHistory: [
        ...currentHistory,
        {
          status: 'confirmed',
          timestamp: new Date().toISOString(),
          note: 'Driver accepted - Booking confirmed',
          driverNotes: driverNotes
        }
      ],
      updatedAt: serverTimestamp()
    })
    
    return { success: true }
  } catch (error) {
    console.error('Driver accept booking error:', error)
    return { success: false, error: error.message }
  }
}

// Driver reject booking
export const driverRejectBooking = async (bookingId, driverId, reason = '') => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId)
    const bookingDoc = await getDoc(bookingRef)
    
    if (!bookingDoc.exists()) {
      return { success: false, error: 'Booking not found' }
    }
    
    const currentHistory = bookingDoc.data().statusHistory || []
    
    await updateDoc(bookingRef, {
      status: 'driver_rejected',
      driverApproval: 'rejected',
      driverRejectionReason: reason,
      statusHistory: [
        ...currentHistory,
        {
          status: 'driver_rejected',
          timestamp: new Date().toISOString(),
          note: `Driver rejected - Reason: ${reason}`,
          rejectionReason: reason
        }
      ],
      updatedAt: serverTimestamp()
    })
    
    return { success: true }
  } catch (error) {
    console.error('Driver reject booking error:', error)
    return { success: false, error: error.message }
  }
}

// Admin reject booking
export const adminRejectBooking = async (bookingId, reason = '') => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId)
    const bookingDoc = await getDoc(bookingRef)
    
    if (!bookingDoc.exists()) {
      return { success: false, error: 'Booking not found' }
    }
    
    const currentHistory = bookingDoc.data().statusHistory || []
    
    await updateDoc(bookingRef, {
      status: 'admin_rejected',
      adminApproval: 'rejected',
      adminRejectionReason: reason,
      statusHistory: [
        ...currentHistory,
        {
          status: 'admin_rejected',
          timestamp: new Date().toISOString(),
          note: `Admin rejected - Reason: ${reason}`,
          rejectionReason: reason
        }
      ],
      updatedAt: serverTimestamp()
    })
    
    return { success: true }
  } catch (error) {
    console.error('Admin reject booking error:', error)
    return { success: false, error: error.message }
  }
}

// Get booking status info
export const getBookingStatus = (booking) => {
  if (!booking) return { status: 'unknown', label: 'Unknown', color: '#94a3b8' }
  
  const statusMap = {
    'pending': { label: 'Pending Admin Approval', color: '#f59e0b', icon: 'clock' },
    'admin_approved': { label: 'Awaiting Driver Acceptance', color: '#3b82f6', icon: 'user-check' },
    'confirmed': { label: 'Confirmed', color: '#10b981', icon: 'check-circle' },
    'admin_rejected': { label: 'Rejected by Admin', color: '#ef4444', icon: 'x-circle' },
    'driver_rejected': { label: 'Rejected by Driver', color: '#f97316', icon: 'x-circle' },
    'completed': { label: 'Completed', color: '#6366f1', icon: 'flag' },
    'cancelled': { label: 'Cancelled', color: '#64748b', icon: 'ban' }
  }
  
  return statusMap[booking.status] || { label: booking.status, color: '#94a3b8', icon: 'circle' }
}


// Get user bookings
export const getUserBookings = async (userId) => {
  try {
    let bookings = []
    
    // Try with orderBy first
    try {
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (indexError) {
      // If index is missing, try without orderBy
      console.warn('Index might be missing, trying without orderBy:', indexError.message)
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', userId)
      )
      const snapshot = await getDocs(q)
      bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Sort manually
      bookings.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
        return dateB - dateA
      })
    }
    
    return { success: true, bookings }
  } catch (error) {
    console.error('Get bookings error:', error)
    return { success: false, error: error.message, bookings: [] }
  }
}

export { auth, onAuthStateChanged }

// Cache for vehicles data
const vehiclesCache = {
  data: null,
  timestamp: null,
  CACHE_DURATION: 5 * 60 * 1000 // 5 minutes cache
}

const extractStoragePathFromUrl = (url = '') => {
  if (!url || typeof url !== 'string') return null
  const marker = '/o/'
  const markerIndex = url.indexOf(marker)
  if (markerIndex === -1) return null
  const start = markerIndex + marker.length
  const end = url.indexOf('?', start)
  const encodedPath = end === -1 ? url.slice(start) : url.slice(start, end)
  try {
    return decodeURIComponent(encodedPath)
  } catch {
    return null
  }
}

const normalizeVehicleImages = (vehicle = {}) => {
  const normalize = (images) => {
    const list = (images || [])
      .filter((img) => img && img.url)
      .map((img, index) => ({
        id: img.id || `${vehicle.id || 'vehicle'}-${index}`,
        url: img.url,
        storagePath: img.storagePath || null,
        isPrimary: Boolean(img.isPrimary),
        order: Number.isFinite(img.order) ? img.order : index,
        createdAt: img.createdAt || new Date().toISOString()
      }))
      .sort((a, b) => a.order - b.order)
      .map((img, index) => ({ ...img, order: index }))

    if (list.length === 0) return []
    const hasPrimary = list.some((img) => img.isPrimary)
    return list.map((img, index) => ({ ...img, isPrimary: hasPrimary ? img.isPrimary : index === 0 }))
  }

  if (Array.isArray(vehicle.images) && vehicle.images.length > 0) {
    return normalize(vehicle.images)
  }

  if (vehicle.imageUrl) {
    return normalize([
      {
        id: `${vehicle.id || 'vehicle'}-legacy-0`,
        url: vehicle.imageUrl,
        storagePath: extractStoragePathFromUrl(vehicle.imageUrl),
        isPrimary: true,
        order: 0,
        createdAt: vehicle.createdAt || new Date().toISOString()
      }
    ])
  }

  return []
}

const withNormalizedVehicleImages = (vehicle = {}) => {
  const images = normalizeVehicleImages(vehicle)
  const primaryImage = images.find((img) => img.isPrimary) || images[0] || null
  return {
    ...vehicle,
    images,
    primaryImageUrl: primaryImage?.url || vehicle.imageUrl || '/logobg.png',
    imageUrl: primaryImage?.url || vehicle.imageUrl || '/logobg.png'
  }
}

// Check if cache is valid
const isCacheValid = () => {
  return vehiclesCache.data && 
         vehiclesCache.timestamp && 
         (Date.now() - vehiclesCache.timestamp) < vehiclesCache.CACHE_DURATION
}

// ============ FETCH ROUTES ============
let routesCache = null
let routesCacheTimestamp = 0
const ROUTES_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const fetchRoutes = async () => {
  // Return cache if fresh
  if (routesCache && (Date.now() - routesCacheTimestamp < ROUTES_CACHE_DURATION)) {
    return routesCache
  }

  try {
    const snapshot = await getDocs(query(collection(db, 'routes'), orderBy('createdAt', 'desc')))
    const routes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    routesCache = routes
    routesCacheTimestamp = Date.now()
    return routes
  } catch (error) {
    console.error('Error fetching routes:', error)
    return []
  }
}

/**
 * Match user's selected from/to text against admin-configured routes
 * Admin stores Google Maps addresses in fromPlaceholder/toPlaceholder as keywords
 * Uses keyword extraction to find the best matching admin route
 * 
 * @param {string} fromText - User's selected from location
 * @param {string} toText - User's selected to location
 * @param {Array} adminRoutes - Admin routes from fetchRoutes() (optional, will fetch if not provided)
 * @returns {Object} { matched: boolean, routeName: string|null, route: Object|null }
 */
export const matchAdminRoute = async (fromText, toText, adminRoutes = null) => {
  if (!fromText || !toText) return { matched: false, routeName: null, route: null }

  const routes = adminRoutes || await fetchRoutes()
  if (!routes || routes.length === 0) return { matched: false, routeName: null, route: null }

  const fromLower = fromText.toLowerCase()
  const toLower = toText.toLowerCase()

  // Helper to ensure cities don't mismatch
  const checkCityMismatch = (text1, text2) => {
    const t1 = (text1 || '').toLowerCase()
    const t2 = (text2 || '').toLowerCase()
    const cities = [
      ['makkah', 'makka'],
      ['madinah', 'madina', 'med'],
      ['jeddah'],
      ['taif'],
      ['islamabad', 'isb']
    ]
    for (const aliases of cities) {
      const hasCity1 = aliases.some(a => t1.includes(a))
      const hasCity2 = aliases.some(a => t2.includes(a))
      if (hasCity1 !== hasCity2) return true // Mismatch found
    }
    return false
  }

  // Extract meaningful keywords from text
  const extractKeywords = (text) => {
    if (!text) return []
    return text.toLowerCase()
      .replace(/[,\.]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .filter(w => !['saudi', 'arabia', 'hotel'].includes(w))
      .filter(w => !/^\d+$/.test(w))        // remove pure numbers
      .filter(w => !/^[a-z0-9]{4}\+/.test(w)) // remove plus codes like CR9F+
  }

  let bestMatch = null
  let bestScore = 0

  for (const route of routes) {
    const routeFromText = (route.fromPlaceholder || '') + ' ' + (route.fromLabel || '')
    const routeToText = (route.toPlaceholder || '') + ' ' + (route.toLabel || '')

    // Filter out obvious city mismatches
    if (checkCityMismatch(fromLower, routeFromText) || checkCityMismatch(toLower, routeToText)) {
      continue
    }

    const routeFromKeywords = extractKeywords(routeFromText)
    const routeToKeywords = extractKeywords(routeToText)
    const fromLabel = (route.fromLabel || '').toLowerCase()
    const toLabel = (route.toLabel || '').toLowerCase()

    let fromScore = 0
    let toScore = 0

    // Exact match gets massive points
    if (fromLabel === fromLower || (route.fromPlaceholder || '').toLowerCase() === fromLower) fromScore += 10
    if (toLabel === toLower || (route.toPlaceholder || '').toLowerCase() === toLower) toScore += 10

    // Check route's "from" keywords against user's "from" text
    for (const kw of routeFromKeywords) {
      if (fromLower.includes(kw) || routeFromKeywords.includes(fromLower)) fromScore++
    }
    // Also check label words
    if (fromLabel && (fromLower.includes(fromLabel) || fromLabel.includes(fromLower))) fromScore += 3

    // Check route's "to" keywords against user's "to" text
    for (const kw of routeToKeywords) {
      if (toLower.includes(kw) || routeToKeywords.includes(toLower)) toScore++
    }
    // Also check label words
    if (toLabel && (toLower.includes(toLabel) || toLabel.includes(toLower))) toScore += 3

    // Both sides must have at least some match
    const totalScore = fromScore + toScore
    if (fromScore >= 1 && toScore >= 1 && totalScore > bestScore) {
      bestScore = totalScore
      bestMatch = route
    }
  }

  if (bestMatch && bestScore >= 3) {
    return {
      matched: true,
      routeName: bestMatch.name,
      route: bestMatch
    }
  }

  return { matched: false, routeName: null, route: null }
}

// Fetch vehicles with caching and lazy loading
export const fetchVehicles = async (options = {}) => {
  const { 
    pageSize = 10, 
    lastDoc = null, 
    category = null,
    status = null,  // Changed default to null to fetch all vehicles
    forceRefresh = false 
  } = options

  // Return cached data if valid and no pagination/filter
  if (!forceRefresh && !lastDoc && !category && isCacheValid()) {
    return { vehicles: vehiclesCache.data, lastDoc: null, hasMore: false }
  }

  try {
    let q = collection(db, 'vehicles')
    const constraints = []

    // Filter by status only if explicitly provided
    if (status) {
      constraints.push(where('status', '==', status))
    }

    // Filter by category if provided
    if (category) {
      constraints.push(where('category', '==', category))
    }

    // Order by creation date (if field exists)
    // Note: This requires a Firestore composite index if filtering by status/category
    constraints.push(orderBy('createdAt', 'desc'))
    
    // Limit for lazy loading
    constraints.push(limit(pageSize))

    // Pagination - start after last document
    if (lastDoc) {
      constraints.push(startAfter(lastDoc))
    }

    q = query(q, ...constraints)
    
    let snapshot
    try {
      snapshot = await getDocs(q)
    } catch (indexError) {
      // If composite index is missing, try without ordering
      console.warn('Index might be missing, trying without orderBy:', indexError.message)
      const fallbackConstraints = []
      if (status) fallbackConstraints.push(where('status', '==', status))
      if (category) fallbackConstraints.push(where('category', '==', category))
      fallbackConstraints.push(limit(pageSize))
      if (lastDoc) fallbackConstraints.push(startAfter(lastDoc))
      
      q = query(collection(db, 'vehicles'), ...fallbackConstraints)
      snapshot = await getDocs(q)
    }
    
    const vehicles = snapshot.docs.map(doc => withNormalizedVehicleImages({
      id: doc.id,
      ...doc.data()
    }))

    const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null
    const hasMore = snapshot.docs.length === pageSize

    // Update cache only for initial load without filters
    if (!lastDoc && !category) {
      vehiclesCache.data = vehicles
      vehiclesCache.timestamp = Date.now()
    }

    return { vehicles, lastDoc: newLastDoc, hasMore }
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    // Return empty array instead of throwing to prevent UI crash
    return { vehicles: [], lastDoc: null, hasMore: false }
  }
}

// Clear cache manually if needed
export const clearVehiclesCache = () => {
  vehiclesCache.data = null
  vehiclesCache.timestamp = null
}

// ============ REVIEWS & RATINGS FUNCTIONS ============

const resolveDriverIdentityFromBooking = (booking = {}) => {
  const driverId = booking.assignedDriverId || booking.driverAssigned || booking.driverId || null
  const driverName = booking.assignedDriverName || booking.driverName || booking.vehicleOwnerName || 'Driver'
  return { driverId, driverName }
}

const aggregateDriverRatings = (reviews = []) => {
  const totalReviews = reviews.length
  if (totalReviews === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { five: 0, four: 0, three: 0, two: 0, one: 0 }
    }
  }

  const distribution = { five: 0, four: 0, three: 0, two: 0, one: 0 }
  let ratingSum = 0

  reviews.forEach((review) => {
    const rating = Math.max(1, Math.min(5, Number(review.rating) || 0))
    ratingSum += rating
    if (rating >= 5) distribution.five += 1
    else if (rating >= 4) distribution.four += 1
    else if (rating >= 3) distribution.three += 1
    else if (rating >= 2) distribution.two += 1
    else distribution.one += 1
  })

  return {
    totalReviews,
    averageRating: Number((ratingSum / totalReviews).toFixed(2)),
    ratingDistribution: distribution
  }
}

export const getReviewsForBookings = async (bookingIds = []) => {
  try {
    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      return { success: true, reviewsByBooking: {} }
    }

    const ids = bookingIds.filter(Boolean)
    const reviewPromises = ids.map(async (bookingId) => {
      const snap = await getDocs(query(collection(db, 'reviews'), where('bookingId', '==', bookingId), limit(1)))
      if (snap.empty) return [bookingId, null]
      return [bookingId, { id: snap.docs[0].id, ...snap.docs[0].data() }]
    })

    const entries = await Promise.all(reviewPromises)
    const reviewsByBooking = entries.reduce((acc, [bookingId, review]) => {
      if (review) acc[bookingId] = review
      return acc
    }, {})

    return { success: true, reviewsByBooking }
  } catch (error) {
    console.error('Get reviews for bookings error:', error)
    return { success: false, reviewsByBooking: {}, error: error.message }
  }
}

export const getDriverRatingsMap = async (driverIds = []) => {
  try {
    const ids = [...new Set((driverIds || []).filter(Boolean))]
    if (ids.length === 0) return { success: true, ratings: {} }

    const entries = await Promise.all(ids.map(async (driverId) => {
      const ratingDoc = await getDoc(doc(db, 'driverRatings', driverId))
      return [driverId, ratingDoc.exists() ? ratingDoc.data() : null]
    }))

    const ratings = entries.reduce((acc, [driverId, rating]) => {
      if (rating) acc[driverId] = rating
      return acc
    }, {})

    return { success: true, ratings }
  } catch (error) {
    console.error('Get driver ratings map error:', error)
    return { success: false, ratings: {}, error: error.message }
  }
}

export const submitRideReview = async ({ booking, customerId, customerName, rating, reviewText = '' }) => {
  try {
    if (!booking?.id) return { success: false, error: 'Invalid booking.' }
    if (!customerId) return { success: false, error: 'Customer not authenticated.' }

    const normalizedRating = Number(rating)
    if (!normalizedRating || normalizedRating < 1 || normalizedRating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5.' }
    }

    const { driverId, driverName } = resolveDriverIdentityFromBooking(booking)
    if (!driverId) {
      return { success: false, error: 'No assigned driver found for this booking yet.' }
    }

    const existingReviewSnap = await getDocs(
      query(collection(db, 'reviews'), where('bookingId', '==', booking.id), limit(1))
    )

    if (!existingReviewSnap.empty) {
      return { success: false, error: 'Review already submitted for this ride.' }
    }

    const reviewPayload = {
      bookingId: booking.id,
      bookingRef: booking.bookingRef || booking.id.slice(0, 8).toUpperCase(),
      customerId,
      customerName: customerName || 'Customer',
      driverId,
      driverName,
      rating: normalizedRating,
      reviewText: (reviewText || '').trim(),
      visibleToPublic: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    const reviewRef = await addDoc(collection(db, 'reviews'), reviewPayload)

    await updateDoc(doc(db, 'bookings', booking.id), {
      hasSubmittedReview: true,
      reviewId: reviewRef.id,
      reviewRating: normalizedRating,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    const driverReviewsSnap = await getDocs(query(collection(db, 'reviews'), where('driverId', '==', driverId)))
    const driverReviews = driverReviewsSnap.docs.map((d) => d.data())
    const aggregates = aggregateDriverRatings(driverReviews)

    await setDoc(doc(db, 'driverRatings', driverId), {
      driverId,
      driverName,
      ...aggregates,
      updatedAt: serverTimestamp()
    }, { merge: true })

    return {
      success: true,
      review: {
        id: reviewRef.id,
        ...reviewPayload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Submit ride review error:', error)
    return { success: false, error: error.message }
  }
}

// ============ CHAT FUNCTIONS ============

// Send a message in a booking chat
export const sendMessage = async (bookingId, senderId, senderName, senderType, message) => {
  try {
    // Use driver_customer_{bookingId} format for chat ID (matching portal format)
    const chatId = `driver_customer_${bookingId}`
    const chatRef = collection(db, 'chats', chatId, 'messages')
    await addDoc(chatRef, {
      senderId,
      senderName,
      senderType, // 'user' or 'driver'
      message,
      text: message, // For portal-side compatibility
      createdAt: serverTimestamp(),
      read: false
    })
    
    // Update last message in chat metadata
    await setDoc(doc(db, 'chats', chatId), {
      lastMessage: message,
      lastMessageAt: serverTimestamp(),
      lastSenderId: senderId,
      updatedAt: serverTimestamp()
    }, { merge: true })
    
    return { success: true }
  } catch (error) {
    console.error('Send message error:', error)
    return { success: false, error: error.message }
  }
}

// Subscribe to chat messages (real-time)
export const subscribeToMessages = (bookingId, callback) => {
  // Use driver_customer_{bookingId} format for chat ID (matching portal format)
  const chatId = `driver_customer_${bookingId}`
  const messagesRef = collection(db, 'chats', chatId, 'messages')
  const q = query(messagesRef, orderBy('createdAt', 'asc'))
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(messages)
  }, (error) => {
    console.error('Chat subscription error:', error)
    callback([])
  })
}

// Mark messages as read
export const markMessagesAsRead = async (bookingId, userId) => {
  try {
    // Use driver_customer_{bookingId} format for chat ID (matching portal format)
    const chatId = `driver_customer_${bookingId}`
    const messagesRef = collection(db, 'chats', chatId, 'messages')
    const q = query(messagesRef, where('read', '==', false), where('senderId', '!=', userId))
    const snapshot = await getDocs(q)
    
    const updates = snapshot.docs.map(docSnap => 
      updateDoc(doc(db, 'chats', chatId, 'messages', docSnap.id), { read: true })
    )
    await Promise.all(updates)
    
    return { success: true }
  } catch (error) {
    console.error('Mark read error:', error)
    return { success: false, error: error.message }
  }
}

// Get user's chat list (all bookings with chats)
export const getUserChats = async (userId) => {
  try {
    // Get user's bookings first
    const bookingsResult = await getUserBookings(userId)
    if (!bookingsResult.success) {
      return { success: false, chats: [] }
    }
    
    const chats = []
    for (const booking of bookingsResult.bookings) {
      // Use driver_customer_{bookingId} format for chat ID (matching portal format)
      const chatId = `driver_customer_${booking.id}`
      const chatDoc = await getDoc(doc(db, 'chats', chatId))
      if (chatDoc.exists()) {
        // Get vehicle owner name if not in booking
        let vehicleOwnerName = booking.vehicleOwnerName || booking.driverName || booking.assignedDriverName
        if (!vehicleOwnerName && booking.vehicleId) {
          try {
            const vehicleDoc = await getDoc(doc(db, 'vehicles', booking.vehicleId))
            if (vehicleDoc.exists()) {
              vehicleOwnerName = vehicleDoc.data().ownerName
            }
          } catch (err) {
            console.error('Error fetching vehicle owner:', err)
          }
        }
        
        chats.push({
          bookingId: booking.id,
          chatId: chatId,
          bookingRef: booking.bookingRef || booking.id.slice(0, 8).toUpperCase(),
          ...chatDoc.data(),
          booking: {
            ...booking,
            vehicleOwnerName: vehicleOwnerName || 'Driver'
          }
        })
      }
    }
    
    // Sort by last message time
    chats.sort((a, b) => {
      const timeA = a.lastMessageAt?.toDate?.() || new Date(0)
      const timeB = b.lastMessageAt?.toDate?.() || new Date(0)
      return timeB - timeA
    })
    
    return { success: true, chats }
  } catch (error) {
    console.error('Get chats error:', error)
    return { success: false, chats: [], error: error.message }
  }
}

// Get unread message count for a user
export const getUnreadCount = async (userId) => {
  try {
    const bookingsResult = await getUserBookings(userId)
    if (!bookingsResult.success) return 0
    
    let totalUnread = 0
    for (const booking of bookingsResult.bookings) {
      // Use driver_customer_{bookingId} format for chat ID (matching portal format)
      const chatId = `driver_customer_${booking.id}`
      const messagesRef = collection(db, 'chats', chatId, 'messages')
      const q = query(messagesRef, where('read', '==', false), where('senderId', '!=', userId))
      const snapshot = await getDocs(q)
      totalUnread += snapshot.size
    }
    
    return totalUnread
  } catch (error) {
    console.error('Get unread count error:', error)
    return 0
  }
}

export { db, storage }
