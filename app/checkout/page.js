'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { db, createBooking, getPaymentSettings } from '../../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { fetchRouteCostPrices, fetchRouteMarkups, getRouteBasedPrice } from '../../lib/pricing'
import { useAuth } from '../../context/AuthContext'
import PortalNavbar from '../components/Navbar/PortalNavbar'
import Footer from '../components/Footer/Footer'
import styles from './checkout.module.scss'
import { useTranslation } from '../../hooks/useTranslation'
import { useCurrency } from '../../context/CurrencyContext'
import { PREDEFINED_ROUTES } from '../../lib/routeMatcher'
import { validateCoupon, redeemCoupon } from '../../lib/coupons'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import RouteKeywordHeadings from '../components/SEO/RouteKeywordHeadings'
import TripAdvisorBadge from '../components/TripAdvisorBadge/TripAdvisorBadge'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

// Stripe Payment Form Component
const StripePaymentForm = ({ onSuccess, onCancel, amount, formatPrice, t }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState(null)

  const handlePayment = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsProcessing(true)
    setPaymentError(null)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })

      if (error) {
        setPaymentError(error.message)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id)
      }
    } catch (err) {
      setPaymentError('An unexpected error occurred. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handlePayment} className={styles.stripeForm}>
      <div className={styles.paymentElementWrapper}>
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {paymentError && (
        <div className={styles.paymentError}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>{paymentError}</span>
        </div>
      )}

      <div className={styles.stripeActions}>
        <button
          type="button"
          className={styles.stripeCancelBtn}
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.stripePayBtn}
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            <>
              <div className={styles.btnSpinner}></div>
              Processing...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
              Pay {formatPrice(amount)}
            </>
          )}
        </button>
      </div>

      <div className={styles.stripeSecurityBadge}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
        </svg>
        <span>Secured by Stripe — Your payment information is encrypted</span>
      </div>
    </form>
  )
}

const CheckoutPageContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, userData, loading: authLoading } = useAuth()
  const t = useTranslation()
  const { formatPrice, currency } = useCurrency()

  // Ref to track if data was loaded from sessionStorage (prevents URL parsing from overwriting)
  const loadedFromStorageRef = useRef(false)

  // Trip Details
  const [tripType, setTripType] = useState('one-way')
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [returnTime, setReturnTime] = useState('')
  const [distance, setDistance] = useState('')
  const [duration, setDuration] = useState('')

  // Multi-city stops
  const [multiCityStops, setMultiCityStops] = useState([])
  const [multiCityTotalPrice, setMultiCityTotalPrice] = useState(0)

  // Passengers & Luggage
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)
  const [largeBags, setLargeBags] = useState(1)
  const [smallBags, setSmallBags] = useState(0)

  // Vehicle
  const [vehicle, setVehicle] = useState(null)
  const [vehiclePrice, setVehiclePrice] = useState(0)
  const [loading, setLoading] = useState(true)

  // Route-based pricing
  const [matchedRouteName, setMatchedRouteName] = useState(null)
  const [costPrices, setCostPrices] = useState({})
  const [routeMarkups, setRouteMarkups] = useState({})

  // Contact Information
  const [contactInfo, setContactInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+966',
    specialRequests: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  const [bookingRef, setBookingRef] = useState('')

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    depositPercentage: 50,
    currency: 'USD'
  })

  // Terms & Agreement
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [pendingBookingData, setPendingBookingData] = useState(null)

  // Stripe Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [clientSecret, setClientSecret] = useState(null)
  const [pendingBookingRef, setPendingBookingRef] = useState(null)

  // Coupon
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  // Pre-fill contact info from user data
  useEffect(() => {
    if (userData) {
      setContactInfo(prev => ({
        ...prev,
        firstName: userData.firstName || prev.firstName,
        lastName: userData.lastName || prev.lastName,
        email: userData.email || prev.email,
        phone: userData.phone || prev.phone,
        countryCode: userData.countryCode || prev.countryCode
      }))
    }
  }, [userData])

  // Load payment settings
  useEffect(() => {
    const loadPaymentSettings = async () => {
      const result = await getPaymentSettings()
      if (result.success) {
        setPaymentSettings(result.settings)
      }
    }
    loadPaymentSettings()
  }, [])

  // Load pricing data for route-based pricing
  useEffect(() => {
    const loadPricingData = async () => {
      try {
        const [prices, markups] = await Promise.all([
          fetchRouteCostPrices(),
          fetchRouteMarkups()
        ])
        setCostPrices(prices)
        setRouteMarkups(markups)
      } catch (error) {
        console.error('Error loading pricing data:', error)
      }
    }
    loadPricingData()
  }, [])

  // Load from sessionStorage if coming back from login
  useEffect(() => {
    const pendingData = sessionStorage.getItem('pendingCheckoutData')
    if (pendingData) {
      try {
        const data = JSON.parse(pendingData)
        setTripType(data.tripType || 'one-way')
        setFromLocation(data.fromLocation || '')
        setToLocation(data.toLocation || '')
        setDepartureDate(data.departureDate || '')
        setDepartureTime(data.departureTime || '')
        setReturnDate(data.returnDate || '')
        setReturnTime(data.returnTime || '')
        setDistance(data.distance || '')
        setDuration(data.duration || '')
        setAdults(data.adults || 1)
        setChildren(data.children || 0)
        setInfants(data.infants || 0)
        setLargeBags(data.largeBags || 1)
        setSmallBags(data.smallBags || 0)
        setVehiclePrice(data.vehiclePrice || 0)
        setMultiCityTotalPrice(data.multiCityTotalPrice || 0)
        setMultiCityStops(data.multiCityStops || [])
        if (data.vehicle) {
          setVehicle(data.vehicle)
        }
        if (data.appliedCoupon) {
          setAppliedCoupon(data.appliedCoupon)
          setCouponCode(data.appliedCoupon.code || '')
        }
        // Clear the pending data after loading
        sessionStorage.removeItem('pendingCheckoutData')
        loadedFromStorageRef.current = true
        setLoading(false)
        return // Skip URL parsing if we loaded from sessionStorage
      } catch (e) {
        console.error('Error loading pending checkout data:', e)
        sessionStorage.removeItem('pendingCheckoutData')
      }
    }
  }, [])

  // Parse URL parameters
  useEffect(() => {
    // Skip if data was already loaded from sessionStorage (login redirect flow)
    if (loadedFromStorageRef.current) {
      return
    }

    // Skip if no URL params (might be loading from sessionStorage)
    if (!searchParams.get('tripType') && !searchParams.get('vehicleId')) {
      // Check if we already have data from sessionStorage
      if (vehicle || multiCityStops.length > 0) {
        return
      }
    }

    const type = searchParams.get('tripType') || 'one-way'
    setTripType(type)
    setFromLocation(searchParams.get('from') || '')
    setToLocation(searchParams.get('to') || '')
    setDepartureDate(searchParams.get('departureDate') || '')
    setDepartureTime(searchParams.get('departureTime') || '')
    setReturnDate(searchParams.get('returnDate') || '')
    setReturnTime(searchParams.get('returnTime') || '')
    setDistance(searchParams.get('distance') || '')
    setDuration(searchParams.get('duration') || '')
    // Read matched route name from URL
    const matchedRoute = searchParams.get('matchedRoute')
    if (matchedRoute) setMatchedRouteName(matchedRoute)
    setAdults(parseInt(searchParams.get('adults')) || 1)
    setChildren(parseInt(searchParams.get('children')) || 0)
    setInfants(parseInt(searchParams.get('infants')) || 0)
    setLargeBags(parseInt(searchParams.get('largeBags')) || 1)
    setSmallBags(parseInt(searchParams.get('smallBags')) || 0)

    // Get price from URL
    const priceFromUrl = parseFloat(searchParams.get('vehiclePrice')) || 0
    setVehiclePrice(priceFromUrl)

    // Handle multi-city
    if (type === 'multi-city') {
      const stopsParam = searchParams.get('stops')
      const totalPriceParam = parseFloat(searchParams.get('totalPrice')) || 0
      setMultiCityTotalPrice(totalPriceParam)

      if (stopsParam) {
        try {
          const stops = JSON.parse(stopsParam)
          setMultiCityStops(stops)
          // Set first stop as main display
          if (stops.length > 0) {
            setFromLocation(stops[0].from || '')
            setToLocation(stops[stops.length - 1].to || '')
          }
        } catch (e) {
          console.error('Error parsing stops:', e)
        }
      }
      setLoading(false)
    } else {
      // Load vehicle details for single/round trip
      const vehicleId = searchParams.get('vehicleId')
      const vehicleName = searchParams.get('vehicleName')
      const vehicleImage = searchParams.get('vehicleImage')
      const vehicleCategory = searchParams.get('vehicleCategory')
      const vehicleCapacity = searchParams.get('vehicleCapacity')
      const vehicleYear = searchParams.get('vehicleYear')
      const vehicleOwner = searchParams.get('vehicleOwner')

      if (vehicleId) {
        loadVehicle(vehicleId, vehicleName, priceFromUrl, {
          imageUrl: vehicleImage,
          category: vehicleCategory,
          capacity: vehicleCapacity,
          year: vehicleYear,
          ownerName: vehicleOwner
        })
      } else {
        setLoading(false)
      }
    }
  }, [searchParams])

  const loadVehicle = async (vehicleId, vehicleName, priceFromUrl, urlVehicleData = {}) => {
    try {
      const docRef = doc(db, 'vehicles', vehicleId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const vehicleData = { id: docSnap.id, ...docSnap.data() }
        setVehicle(vehicleData)
        // Use price from URL if available, otherwise calculate from vehicle data
        if (!priceFromUrl) {
          // Route-based pricing
          if (matchedRouteName) {
            const result = getRouteBasedPrice(vehicleData, matchedRouteName, costPrices, routeMarkups)
            setVehiclePrice(result.price)
          } else {
            let price = 0
            if (vehicleData.routePricing && vehicleData.routePricing.length > 0) {
              price = parseFloat(vehicleData.routePricing[0].price) || 0
            } else {
              price = parseFloat(vehicleData.pricePerDay) || 0
            }
            if (vehicleData.isHajjSeason && vehicleData.hajjSeasonPrice) {
              price = parseFloat(vehicleData.hajjSeasonPrice)
            } else if (vehicleData.isUmrahSeason && vehicleData.umrahSeasonPrice) {
              price = parseFloat(vehicleData.umrahSeasonPrice)
            }
            if (vehicleData.discountPercent && vehicleData.discountPercent > 0) {
              price = price * (1 - vehicleData.discountPercent / 100)
            } else if (vehicleData.discountAmount && vehicleData.discountAmount > 0) {
              price = price - vehicleData.discountAmount
            }
            setVehiclePrice(Math.max(0, price))
          }
        }
      } else if (vehicleName && priceFromUrl) {
        // If vehicle not found in DB but we have name and price from URL
        setVehicle({
          id: vehicleId,
          vehicleTypeName: vehicleName,
          name: vehicleName,
          imageUrl: urlVehicleData.imageUrl || '',
          category: urlVehicleData.category || '',
          capacity: urlVehicleData.capacity || '',
          year: urlVehicleData.year || '',
          ownerName: urlVehicleData.ownerName || ''
        })
      }
    } catch (error) {
      console.error('Error loading vehicle:', error)
      // Still show data from URL if Firebase fails
      if (vehicleName && priceFromUrl) {
        setVehicle({
          id: vehicleId,
          vehicleTypeName: vehicleName,
          name: vehicleName,
          imageUrl: urlVehicleData.imageUrl || '',
          category: urlVehicleData.category || '',
          capacity: urlVehicleData.capacity || '',
          year: urlVehicleData.year || '',
          ownerName: urlVehicleData.ownerName || ''
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getTotalPassengers = () => adults + children + infants
  const getTotalLuggage = () => largeBags + smallBags

  const getVehiclePrice = () => {
    return vehiclePrice
  }

  const getSubtotalPrice = () => {
    if (tripType === 'multi-city') {
      return multiCityTotalPrice
    }
    let price = vehiclePrice
    if (tripType === 'round-trip') {
      price *= 2
    }
    return price
  }

  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0
    return (getSubtotalPrice() * appliedCoupon.discountPercent) / 100
  }

  const getTotalPrice = () => {
    return Math.max(0, getSubtotalPrice() - getDiscountAmount())
  }

  const getDepositAmount = () => {
    const total = getTotalPrice()
    return (total * paymentSettings.depositPercentage) / 100
  }

  const getRemainingAmount = () => {
    const total = getTotalPrice()
    const deposit = getDepositAmount()
    return total - deposit
  }

  const seoRouteHeading = matchedRouteName || PREDEFINED_ROUTES[1]
  const headingRoutes = matchedRouteName
    ? [matchedRouteName, ...PREDEFINED_ROUTES.slice(0, 4)]
    : PREDEFINED_ROUTES.slice(0, 5)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setContactInfo(prev => ({ ...prev, [name]: value }))
  }

  const handleApplyCoupon = async () => {
    const code = couponCode.trim()
    if (!code) {
      setCouponError(t('enterCouponCode'))
      return
    }

    setCouponLoading(true)
    setCouponError('')
    const result = await validateCoupon(code)
    setCouponLoading(false)

    if (!result.valid) {
      setAppliedCoupon(null)
      setCouponError(result.error)
      return
    }

    setAppliedCoupon(result.coupon)
    setCouponCode(result.coupon.code)
    setCouponError('')
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  const generateBookingRef = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let ref = 'UL'
    for (let i = 0; i < 6; i++) {
      ref += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return ref
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Check if user is logged in
    if (!user) {
      // Save checkout data to sessionStorage for after login
      const checkoutData = {
        tripType,
        fromLocation,
        toLocation,
        departureDate,
        departureTime,
        returnDate,
        returnTime,
        distance,
        duration,
        adults,
        children,
        infants,
        largeBags,
        smallBags,
        vehiclePrice,
        multiCityTotalPrice,
        multiCityStops,
        vehicle: vehicle ? {
          id: vehicle.id,
          vehicleTypeName: vehicle.vehicleTypeName,
          name: vehicle.name,
          category: vehicle.category,
          capacity: vehicle.capacity,
          year: vehicle.year,
          ownerName: vehicle.ownerName,
          imageUrl: vehicle.imageUrl || vehicle.image || ''
        } : null,
        appliedCoupon: appliedCoupon || null
      }
      sessionStorage.setItem('pendingCheckoutData', JSON.stringify(checkoutData))
      // Include current query params in the redirect URL so they persist
      const currentParams = searchParams.toString()
      const redirectPath = currentParams ? `/checkout?${currentParams}` : '/checkout'
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`)
      return
    }

    // Validate form
    if (!contactInfo.firstName || !contactInfo.lastName || !contactInfo.email || !contactInfo.phone) {
      alert(t('fillRequiredFields'))
      return
    }

    // Show terms and conditions modal
    setShowTermsModal(true)
  }

  const handleAcceptTerms = async () => {
    setTermsAccepted(true)
    setShowTermsModal(false)
    setIsSubmitting(true)

    try {
      if (appliedCoupon) {
        const revalidation = await validateCoupon(appliedCoupon.code)
        if (!revalidation.valid) {
          setAppliedCoupon(null)
          setCouponError(revalidation.error)
          alert(revalidation.error)
          return
        }
        setAppliedCoupon(revalidation.coupon)
      }

      const ref = generateBookingRef()
      setPendingBookingRef(ref)

      if (DEMO_MODE) {
        await handlePaymentSuccess(`demo_payment_${Date.now()}`)
        return
      }

      // Create PaymentIntent via API
      const depositAmount = getDepositAmount()
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: depositAmount,
          currency: 'usd',
          bookingRef: ref,
          customerEmail: contactInfo.email,
        }),
      })

      const data = await response.json()

      if (data.error) {
        alert(`Payment setup failed: ${data.error}`)
        return
      }

      setClientSecret(data.clientSecret)
      setShowPaymentModal(true)
    } catch (error) {
      console.error('Payment setup error:', error)
      alert('Failed to set up payment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentSuccess = async (paymentIntentId) => {
    setShowPaymentModal(false)
    setIsSubmitting(true)

    try {
      const ref = pendingBookingRef

      // Prepare booking data
      const bookingData = {
        bookingRef: ref,
        tripType,
        fromLocation,
        toLocation,
        departureDate,
        departureTime,
        returnDate: tripType === 'round-trip' ? returnDate : null,
        returnTime: tripType === 'round-trip' ? returnTime : null,
        distance,
        duration,
        adults,
        children,
        infants,
        largeBags,
        smallBags,
        vehicleId: vehicle?.id || null,
        vehicleName: vehicle?.vehicleTypeName || vehicle?.name || null,
        vehicleOwnerName: vehicle?.ownerName || null,
        vehiclePrice,
        subtotalPrice: getSubtotalPrice(),
        discountAmount: getDiscountAmount(),
        coupon: appliedCoupon
          ? {
              id: appliedCoupon.id,
              code: appliedCoupon.code,
              discountPercent: appliedCoupon.discountPercent
            }
          : null,
        totalPrice: getTotalPrice(),
        depositAmount: getDepositAmount(),
        remainingAmount: getRemainingAmount(),
        depositPercentage: paymentSettings.depositPercentage,
        displayCurrency: currency,
        baseCurrency: 'USD',
        paymentStatus: 'deposit_paid',
        stripePaymentIntentId: paymentIntentId,
        paymentTimeline: [
          {
            type: 'deposit_paid',
            amount: getDepositAmount(),
            currency: 'USD',
            at: new Date().toISOString(),
            reference: paymentIntentId
          }
        ],
        paymentSummary: {
          totalAmount: getTotalPrice(),
          totalPaid: getDepositAmount(),
          totalRemaining: getRemainingAmount(),
          settlementStatus: 'partial',
          currency: 'USD'
        },
        paymentPlan: {
          policy: 'deposit_and_driver_balance',
          depositPercentage: paymentSettings.depositPercentage,
          remainingPercentage: 100 - paymentSettings.depositPercentage,
          depositAmount: getDepositAmount(),
          remainingAmount: getRemainingAmount(),
          currency: 'USD'
        },
        invoiceSnapshot: {
          invoiceNumber: ref,
          generatedAt: new Date().toISOString(),
          routeName: `${fromLocation} to ${toLocation}`,
          route: {
            fromLocation,
            toLocation,
            tripType,
            departureDate,
            departureTime,
            returnDate: tripType === 'round-trip' ? returnDate : null,
            returnTime: tripType === 'round-trip' ? returnTime : null,
            multiCityStops: tripType === 'multi-city' ? multiCityStops : []
          },
          vehicle: {
            id: vehicle?.id || null,
            name: vehicle?.vehicleTypeName || vehicle?.name || null,
            ownerName: vehicle?.ownerName || null
          },
          pricing: {
            subtotalAmount: getSubtotalPrice(),
            discountAmount: getDiscountAmount(),
            couponCode: appliedCoupon?.code || null,
            couponDiscountPercent: appliedCoupon?.discountPercent || null,
            totalAmount: getTotalPrice(),
            depositAmount: getDepositAmount(),
            remainingAmount: getRemainingAmount(),
            depositPercentage: paymentSettings.depositPercentage,
            currency: 'USD'
          },
          stripePaymentIntentId: paymentIntentId,
          paymentStatus: 'deposit_paid'
        },
        multiCityStops: tripType === 'multi-city' ? multiCityStops : null,
        // Route-based pricing audit trail
        matchedRouteName: matchedRouteName || null,
        pricingInfo: matchedRouteName ? (() => {
          const vehicleTypeName = vehicle?.vehicleTypeName || vehicle?.name || ''
          const costPrice = costPrices[vehicleTypeName]?.[matchedRouteName] || 0
          const markupData = routeMarkups[vehicleTypeName]
          const markupPercent = markupData?.markups?.[matchedRouteName] ?? markupData?.globalMarkup ?? 0
          return { costPrice, markupPercent, sellingPrice: vehiclePrice }
        })() : null,
        contactInfo: {
          firstName: contactInfo.firstName,
          lastName: contactInfo.lastName,
          email: contactInfo.email,
          phone: `${contactInfo.countryCode}${contactInfo.phone}`,
          specialRequests: contactInfo.specialRequests
        },
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString()
      }

      // Redeem coupon before saving booking to prevent double-use
      if (appliedCoupon?.id) {
        try {
          await redeemCoupon(appliedCoupon.id, ref)
        } catch (couponError) {
          console.error('Coupon redemption error:', couponError)
          alert('Payment received but the coupon could not be applied. Please contact support with your reference: ' + ref)
          return
        }
      }

      // Save to database
      const result = await createBooking(bookingData, user.uid)

      if (result.success) {
        setBookingRef(ref)
        setBookingComplete(true)

        // Google Ads — Purchase conversion
        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
          window.gtag('event', 'conversion', {
            send_to: 'AW-18135545857/afrdCPDXw6YcEIHw2cdD',
            value: getDepositAmount(),
            currency: 'USD',
            transaction_id: ref,
          })
        }

        // TikTok Pixel — CompletePayment event
        if (typeof window !== 'undefined' && typeof window.ttq !== 'undefined') {
          window.ttq.track('CompletePayment', {
            contents: [
              {
                content_id: ref,
                content_name: `${fromLocation} to ${toLocation}`,
                quantity: 1,
                price: getDepositAmount(),
              },
            ],
            value: getDepositAmount(),
            currency: 'USD',
          })
        }
      } else {
        alert('Booking was paid but failed to save. Please contact support with your booking reference: ' + ref)
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('Payment was successful but booking failed to save. Please contact support.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentCancel = () => {
    setShowPaymentModal(false)
    setClientSecret(null)
  }

  const handleDeclineTerms = () => {
    setShowTermsModal(false)
    setTermsAccepted(false)
  }

  if (loading || authLoading) {
    return (
      <div className={styles.checkoutPage}>
        <PortalNavbar forceDark />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>{t('loadingBookingDetails')}</p>
        </div>
      </div>
    )
  }

  if (bookingComplete) {
    return (
      <div className={styles.checkoutPage}>
        <PortalNavbar forceDark />
        <section className={styles.successSection}>
          <div className={styles.successCard}>
            <div className={styles.successIconPending}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
              </svg>
            </div>
            <h1>{t('bookingRequestSubmitted')}</h1>
            <div className={styles.statusBadge}>
              <span className={styles.pendingBadge}>{t('pendingApproval')}</span>
            </div>
            <p className={styles.bookingRefLabel}>{t('yourBookingReference')}</p>
            <p className={styles.bookingRef}>{bookingRef}</p>

            <div className={styles.successDetails}>
              <div className={styles.successRow}>
                <span>{t('vehicle')}</span>
                <span>{vehicle?.vehicleTypeName || vehicle?.name}</span>
              </div>
              <div className={styles.successRow}>
                <span>{t('route')}</span>
                <span>{fromLocation} → {toLocation}</span>
              </div>
              <div className={styles.successRow}>
                <span>{t('dateAndTime')}</span>
                <span>{formatDate(departureDate)} {t('at')} {formatTime(departureTime)}</span>
              </div>
              <div className={styles.successRow}>
                <span>{t('passengers')}</span>
                <span>{getTotalPassengers()} ({adults} {t('adults')}{children > 0 ? `, ${children} ${t('children')}` : ''}{infants > 0 ? `, ${infants} ${t('infants')}` : ''})</span>
              </div>
              <div className={`${styles.successRow} ${styles.highlight}`}>
                <span>{t('depositPaid')} ({paymentSettings.depositPercentage}%)</span>
                <span>{formatPrice(getDepositAmount())}</span>
              </div>
              <div className={`${styles.successRow} ${styles.highlight}`} style={{ color: '#C9A227' }}>
                <span>{t('remainingBalance')} (Pay to Driver)</span>
                <span>{formatPrice(getRemainingAmount())}</span>
              </div>
              <div className={`${styles.successRow} ${styles.total}`}>
                <span>{t('totalAmount')}</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
            </div>

            <div className={styles.pendingInfo}>
              <div className={styles.infoBox}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <div>
                  <h4>{t('bookingConfirmed')}</h4>
                  <p>{t('bookingConfirmedDesc')}</p>
                </div>
              </div>
            </div>

            <p className={styles.confirmationNote}>
              {t('confirmationEmailSent')} <strong>{contactInfo.email}</strong>
            </p>

            <div className={styles.successActions}>
              <button className={styles.primaryBtn} onClick={() => router.push('/dashboard')}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                </svg>
                {t('goToDashboard')}
              </button>
              <button className={styles.secondaryBtn} onClick={() => window.print()}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
                </svg>
                {t('print')}
              </button>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  return (
    <div className={styles.checkoutPage}>
      <PortalNavbar forceDark />

      <section className={styles.checkoutSection}>
        <div className={styles.checkoutContainer}>
          <div className={styles.checkoutHeader}>
            <h1>{t('completeBooking')}</h1>
            <p>{t('reviewTripDetails')}</p>
            <h2 className={styles.seoRouteHeading}>{seoRouteHeading}</h2>
          </div>

          <div className={styles.seoAssistBlocks}>
            <RouteKeywordHeadings
              title="Exact Route Keywords for Checkout"
              routes={headingRoutes}
              compact
            />
          </div>

          <div className={styles.checkoutGrid}>
            {/* Left Column - Form */}
            <div className={styles.formColumn}>
              {/* Trip Summary Card */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  </svg>
                  {t('tripDetails')}
                  {tripType === 'multi-city' && <span className={styles.tripTypeBadge}>{t('multiCityBadge')}</span>}
                </h3>

                <div className={styles.tripSummary}>
                  {tripType === 'multi-city' ? (
                    // Multi-city trips display
                    <div className={styles.multiCityTrips}>
                      {multiCityStops.map((stop, index) => (
                        <div key={index} className={styles.multiCityTrip}>
                          <div className={styles.tripHeader}>
                            <span className={styles.tripNumber}>{t('trip')} {index + 1}</span>
                            {stop.vehicleName && <span className={styles.tripVehicle}>{stop.vehicleName}</span>}
                          </div>
                          <div className={styles.tripRoute}>
                            <div className={styles.routePoint}>
                              <span className={styles.pointDot}></span>
                              <div>
                                <span className={styles.pointLabel}>{t('fromLabel')}</span>
                                <span className={styles.pointLocation}>{stop.from}</span>
                              </div>
                            </div>
                            <div className={styles.routeLineV}></div>
                            <div className={styles.routePoint}>
                              <span className={`${styles.pointDot} ${styles.destination}`}></span>
                              <div>
                                <span className={styles.pointLabel}>{t('toLabel')}</span>
                                <span className={styles.pointLocation}>{stop.to}</span>
                              </div>
                            </div>
                          </div>
                          <div className={styles.tripMeta}>
                            <span>{formatDate(stop.date)} {t('at')} {formatTime(stop.time)}</span>
                            {stop.vehiclePrice > 0 && <span className={styles.tripPrice}>{formatPrice(stop.vehiclePrice)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Single/Round trip display
                    <div className={styles.tripRoute}>
                      <div className={styles.routePoint}>
                        <span className={styles.pointDot}></span>
                        <div>
                          <span className={styles.pointLabel}>{t('pickup')}</span>
                          <span className={styles.pointLocation}>{fromLocation}</span>
                        </div>
                      </div>
                      <div className={styles.routeLineV}></div>
                      <div className={styles.routePoint}>
                        <span className={`${styles.pointDot} ${styles.destination}`}></span>
                        <div>
                          <span className={styles.pointLabel}>{t('dropoff')}</span>
                          <span className={styles.pointLocation}>{toLocation}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={styles.tripMeta}>
                    {tripType !== 'multi-city' && (
                      <>
                        <div className={styles.metaItem}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                          </svg>
                          <div>
                            <span className={styles.metaLabel}>{t('departure')}</span>
                            <span className={styles.metaValue}>{formatDate(departureDate)}</span>
                            <span className={styles.metaTime}>{formatTime(departureTime)}</span>
                          </div>
                        </div>

                        {tripType === 'round-trip' && returnDate && (
                          <div className={styles.metaItem}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 11l3-3-3-3v2H4v2h5v2zm6 2l-3 3 3 3v-2h5v-2h-5v-2z" />
                            </svg>
                            <div>
                              <span className={styles.metaLabel}>{t('returnLabel')}</span>
                              <span className={styles.metaValue}>{formatDate(returnDate)}</span>
                              <span className={styles.metaTime}>{formatTime(returnTime)}</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className={styles.metaItem}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3z" />
                      </svg>
                      <div>
                        <span className={styles.metaLabel}>{t('passengers')}</span>
                        <span className={styles.metaValue}>{getTotalPassengers()} {t('total')}</span>
                        <span className={styles.metaTime}>{adults} {t('adults')}{children > 0 ? `, ${children} ${t('children')}` : ''}{infants > 0 ? `, ${infants} ${t('infants')}` : ''}</span>
                      </div>
                    </div>

                    <div className={styles.metaItem}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 6h-2V3c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v3H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
                      </svg>
                      <div>
                        <span className={styles.metaLabel}>{t('luggage')}</span>
                        <span className={styles.metaValue}>{getTotalLuggage()} {t('bags')}</span>
                        <span className={styles.metaTime}>{largeBags} {t('largeBag')}, {smallBags} {t('smallBag')}</span>
                      </div>
                    </div>
                  </div>

                  {tripType !== 'multi-city' && (distance || duration) && (
                    <div className={styles.routeStats}>
                      {distance && (
                        <div className={styles.statBadge}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                          </svg>
                          {distance}
                        </div>
                      )}
                      {duration && (
                        <div className={styles.statBadge}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                          </svg>
                          {duration}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information Form */}
              <form onSubmit={handleSubmit} className={styles.card}>
                <h3 className={styles.cardTitle}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  Contact Information
                </h3>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={contactInfo.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={contactInfo.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={contactInfo.email}
                      onChange={handleInputChange}
                      placeholder="email@example.com"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Phone Number *</label>
                    <div className={styles.phoneInput}>
                      <select
                        name="countryCode"
                        value={contactInfo.countryCode}
                        onChange={handleInputChange}
                      >
                        <option value="+966">🇸🇦 +966</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+92">🇵🇰 +92</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+20">🇪🇬 +20</option>
                        <option value="+62">🇮🇩 +62</option>
                        <option value="+60">🇲🇾 +60</option>
                        <option value="+90">🇹🇷 +90</option>
                      </select>
                      <input
                        type="tel"
                        name="phone"
                        value={contactInfo.phone}
                        onChange={handleInputChange}
                        placeholder="5XX XXX XXXX"
                        required
                      />
                    </div>
                  </div>

                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>{t('specialRequests')} ({t('optional')})</label>
                    <textarea
                      name="specialRequests"
                      value={contactInfo.specialRequests}
                      onChange={handleInputChange}
                      placeholder={t('specialRequestsPlaceholder')}
                      rows={3}
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column - Summary & Payment */}
            <div className={styles.summaryColumn}>
              {/* Vehicle Card - for single/round trip */}
              {tripType !== 'multi-city' && vehicle && (
                <div className={styles.vehicleCard}>
                  <div className={styles.vehicleImage}>
                    <img
                      src={vehicle.imageUrl}
                      alt={vehicle.vehicleTypeName || vehicle.name}
                      onError={(e) => { e.target.src = '/logobg.png' }}
                    />
                  </div>
                  <div className={styles.vehicleInfo}>
                    <h4>{vehicle.vehicleTypeName || vehicle.name}</h4>
                    <p>{vehicle.category} • {vehicle.capacity} {t('seats')} • {vehicle.year}</p>
                    <div className={styles.vehicleOwner}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z" />
                      </svg>
                      {vehicle.ownerName}
                    </div>
                  </div>
                </div>
              )}

              {/* Price Summary */}
              <div className={styles.priceSummary}>
                <h3>{t('priceSummary')}</h3>

                <div className={styles.priceRows}>
                  {tripType === 'multi-city' ? (
                    // Multi-city price breakdown
                    <>
                      {multiCityStops.map((stop, index) => (
                        <div key={index} className={styles.priceRow}>
                          <span>{t('trip')} {index + 1}: {stop.vehicleName || t('vehicle')}</span>
                          <span>{formatPrice(stop.vehiclePrice || 0)}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    // Single/Round trip price
                    <>
                      <div className={styles.priceRow}>
                        <span>{t('baseFare')} ({tripType === 'round-trip' ? t('roundTripTrip') : t('oneWayTrip')})</span>
                        <span>{formatPrice(getVehiclePrice())}</span>
                      </div>
                      {tripType === 'round-trip' && (
                        <div className={styles.priceRow}>
                          <span>{t('returnTrip')}</span>
                          <span>{formatPrice(getVehiclePrice())}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className={styles.priceRow}>
                    <span>{t('serviceFee')}</span>
                    <span>{t('included')}</span>
                  </div>

                  <div className={styles.couponSection}>
                    <label className={styles.couponLabel}>
                      {t('discountCode')} ({t('optional')})
                    </label>
                    <div className={styles.couponInputRow}>
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value)
                          if (couponError) setCouponError('')
                        }}
                        placeholder={t('enterCouponCode')}
                        disabled={!!appliedCoupon || couponLoading}
                        className={styles.couponInput}
                      />
                      {appliedCoupon ? (
                        <button
                          type="button"
                          className={styles.couponRemoveBtn}
                          onClick={handleRemoveCoupon}
                        >
                          {t('remove')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.couponApplyBtn}
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                        >
                          {couponLoading ? t('processing') : t('apply')}
                        </button>
                      )}
                    </div>
                    {couponError && (
                      <p className={styles.couponError}>{couponError}</p>
                    )}
                    {appliedCoupon && (
                      <p className={styles.couponSuccess}>
                        {t('couponApplied')}: {appliedCoupon.code} ({appliedCoupon.discountPercent}% {t('off')})
                      </p>
                    )}
                  </div>

                  {appliedCoupon && (
                    <div className={`${styles.priceRow} ${styles.discountRow}`}>
                      <span>{t('discount')} ({appliedCoupon.discountPercent}%)</span>
                      <span>-{formatPrice(getDiscountAmount())}</span>
                    </div>
                  )}

                  <div className={`${styles.priceRow} ${styles.totalRow}`}>
                    <span>{t('total')}</span>
                    <span className={styles.totalAmount}>{formatPrice(getTotalPrice())}</span>
                  </div>

                  <div className={styles.paymentBreakdown}>
                    <div className={styles.breakdownHeader}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                      <span>Payment Breakdown</span>
                    </div>
                    <div className={styles.breakdownItem}>
                      <div className={styles.breakdownLabel}>
                        <span>Deposit ({paymentSettings.depositPercentage}%)</span>
                        <span className={styles.breakdownBadge}>Pay Now</span>
                      </div>
                      <span className={styles.breakdownAmount}>{formatPrice(getDepositAmount())}</span>
                    </div>
                    <div className={styles.breakdownItem}>
                      <div className={styles.breakdownLabel}>
                        <span>Remaining Balance ({100 - paymentSettings.depositPercentage}%)</span>
                        <span className={styles.breakdownBadge} style={{ background: 'rgba(201, 162, 39, 0.15)', color: '#C9A227' }}>Pay to Driver</span>
                      </div>
                      <span className={styles.breakdownAmount}>{formatPrice(getRemainingAmount())}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.payButton}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className={styles.btnSpinner}></div>
                      {t('processing')}
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                      </svg>
                      {t('confirmAndPay')} {formatPrice(getDepositAmount())}
                    </>
                  )}
                </button>

                <div className={styles.securityNote}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                  </svg>
                  <span>{t('securityNote')}</span>
                </div>

                <div className={styles.trustShieldCard}>
                  <span className={styles.trustShieldLabel}>Trusted Secure Checkout</span>
                  <img
                    src="/trust%20sheild.png"
                    alt="Trust Shield - Secure Payment"
                    className={styles.trustShieldImage}
                  />
                </div>

                {/* TripAdvisor Rating Badge */}
                <div className={styles.taBadgeCard}>
                  <span className={styles.taBadgeLabel}>Rated on TripAdvisor</span>
                  <TripAdvisorBadge />
                </div>
              </div>

              {/* Cancellation Policy */}
              <div className={styles.policyCard}>
                <h4>{t('cancellationPolicy')}</h4>
                <ul>
                  <li>{t('freeCancellation')}</li>
                  <li>{t('fiftyPercentRefund')}</li>
                  <li>{t('noRefundNoShow')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.termsModal}>
            <div className={styles.modalHeader}>
              <h2>{t('termsAndConditions')}</h2>
              <button
                className={styles.closeBtn}
                onClick={handleDeclineTerms}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.termsContent}>
                <h3>1. Booking Agreement</h3>
                <p>By confirming this booking, you agree to the terms and conditions set forth by UmrahLimo. This agreement is legally binding and governs the provision of transportation services.</p>

                <h3>2. Payment Terms</h3>
                <p>Payment is required at the time of booking. The total amount displayed includes all applicable fees and charges. All base prices are in US Dollars (USD), and display currency conversions are shown for convenience.</p>

                <h3>3. Cancellation Policy</h3>
                <ul>
                  <li>Free cancellation up to 24 hours before scheduled pickup time</li>
                  <li>50% refund for cancellations made within 24 hours of pickup</li>
                  <li>No refund for no-shows or cancellations made after scheduled pickup time</li>
                  <li>Refunds will be processed within 7-10 business days</li>
                </ul>

                <h3>4. Passenger Responsibilities</h3>
                <ul>
                  <li>Arrive at pickup location 5 minutes before scheduled time</li>
                  <li>Provide accurate contact information</li>
                  <li>Respect the vehicle and driver</li>
                  <li>Comply with safety regulations including seatbelt usage</li>
                  <li>No smoking, eating, or drinking in the vehicle without permission</li>
                </ul>

                <h3>5. Luggage Policy</h3>
                <p>Luggage allowance is based on the vehicle capacity selected. Additional luggage beyond the specified limit may incur extra charges or require a larger vehicle.</p>

                <h3>6. Driver and Vehicle</h3>
                <ul>
                  <li>All drivers are licensed, insured, and professionally trained</li>
                  <li>Vehicles are regularly maintained and inspected for safety</li>
                  <li>Driver has the right to refuse service if passenger behavior is inappropriate</li>
                </ul>

                <h3>7. Service Modifications</h3>
                <p>UmrahLimo reserves the right to modify pickup times or assign alternative vehicles due to unforeseen circumstances. Customers will be notified immediately of any changes.</p>

                <h3>8. Liability</h3>
                <p>UmrahLimo is not liable for delays caused by traffic, weather, or other circumstances beyond our control. Personal belongings are the passenger&apos;s responsibility.</p>

                <h3>9. Special Requests</h3>
                <p>Special requests are accommodated when possible but cannot be guaranteed. Please communicate all requirements at the time of booking.</p>

                <h3>10. Privacy Policy</h3>
                <p>Your personal information will be handled in accordance with our Privacy Policy and will not be shared with third parties except as necessary to provide the service.</p>

                <h3>11. Dispute Resolution</h3>
                <p>Any disputes arising from this agreement shall be resolved in accordance with the laws of Saudi Arabia.</p>

                <div className={styles.agreementBox}>
                  <p><strong>By clicking &quot;Accept & Confirm Booking&quot;, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions.</strong></p>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.declineBtn}
                onClick={handleDeclineTerms}
              >
                {t('decline')}
              </button>
              <button
                className={styles.acceptBtn}
                onClick={handleAcceptTerms}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                {t('acceptAndConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {DEMO_MODE && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: '#f59e0b', color: '#1c1917', padding: '8px 16px', textAlign: 'center', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span>⚠️ DEMO MODE — No real payment will be charged</span>
          <span style={{ fontWeight: 400, opacity: 0.8 }}>Set NEXT_PUBLIC_DEMO_MODE=false to enable real payments</span>
        </div>
      )}

      {/* Stripe Payment Modal */}
      {showPaymentModal && clientSecret && (
        <div className={styles.modalOverlay}>
          <div className={styles.paymentModal}>
            <div className={styles.modalHeader}>
              <h2>Complete Payment</h2>
              <button
                className={styles.closeBtn}
                onClick={handlePaymentCancel}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <div className={styles.paymentModalBody}>
              <div className={styles.paymentSummary}>
                <div className={styles.paymentSummaryRow}>
                  <span>Deposit ({paymentSettings.depositPercentage}%)</span>
                  <span className={styles.paymentAmount}>{formatPrice(getDepositAmount())}</span>
                </div>
                <p className={styles.paymentNote}>Remaining balance of {formatPrice(getRemainingAmount())} will be paid to the driver</p>
              </div>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#C9A227',
                      colorBackground: '#1a1a2e',
                      colorText: '#ffffff',
                      colorDanger: '#ff4444',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      borderRadius: '8px',
                    },
                  },
                }}
              >
                <StripePaymentForm
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                  amount={getDepositAmount()}
                  formatPrice={formatPrice}
                  t={t}
                />
              </Elements>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

const CheckoutLoading = () => (
  <div className={styles.checkoutPage}>
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '20px' }}>
      <div className={styles.spinner}></div>
      <p style={{ color: '#6B7280' }}>Loading...</p>
    </div>
  </div>
)

const CheckoutPage = () => {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutPageContent />
    </Suspense>
  )
}

export default CheckoutPage
