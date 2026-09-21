'use client'

import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useTranslation } from '../../hooks/useTranslation'
import { fetchRoutes, matchAdminRoute } from '../../lib/firebase'
import { PREDEFINED_ROUTES } from '../../lib/routeMatcher'
import RouteKeywordHeadings from '../components/SEO/RouteKeywordHeadings'
import PortalNavbar from '../components/Navbar/PortalNavbar'
import styles from './search.module.scss'

// Lazy load heavy components
const Footer = dynamic(() => import('../components/Footer/Footer'), {
  ssr: false,
  loading: () => <div className={styles.footerPlaceholder}></div>
})

// Cache keys
const CACHE_KEY = 'umrahlimo_search_data'
const CACHE_EXPIRY = 30 * 60 * 1000 // 30 minutes

// Helper functions for caching
const saveToCache = (data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch (e) {
    console.warn('Failed to save to cache:', e)
  }
}

const loadFromCache = () => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const { data, timestamp } = JSON.parse(cached)

    // Check if cache is expired
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }

    return data
  } catch (e) {
    console.warn('Failed to load from cache:', e)
    return null
  }
}

const SearchPageContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isInitialized, setIsInitialized] = useState(false)
  const t = useTranslation()


  // Trip Type: 'one-way', 'round-trip', 'multi-city'
  const [tripType, setTripType] = useState('one-way')

  // Routes from admin (Firestore)
  const [availableRoutes, setAvailableRoutes] = useState([])
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [showRouteDropdown, setShowRouteDropdown] = useState(false)
  const [routeSearchQuery, setRouteSearchQuery] = useState('')

  // Locations for one-way and round-trip
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [fromCoords, setFromCoords] = useState(null)
  const [toCoords, setToCoords] = useState(null)

  // Autocomplete suggestions
  const [activeInput, setActiveInput] = useState(null)

  // Multi-city stops
  const [multiCityStops, setMultiCityStops] = useState([
    { from: '', to: '', date: '', time: '', fromCoords: null, toCoords: null }
  ])

  // Date & Time
  const [departureDate, setDepartureDate] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [returnTime, setReturnTime] = useState('')

  // Passengers
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)

  // Luggage
  const [largeBags, setLargeBags] = useState(1)
  const [smallBags, setSmallBags] = useState(0)

  // Dropdowns
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false)
  const [showLuggageDropdown, setShowLuggageDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Portal dropdown positions
  const [passengerMenuPos, setPassengerMenuPos] = useState(null)
  const [luggageMenuPos, setLuggageMenuPos] = useState(null)

  // Refs
  const fromInputRef = useRef(null)
  const toInputRef = useRef(null)
  const multiCityRefs = useRef([])
  const passengerDropdownRef = useRef(null)
  const luggageDropdownRef = useRef(null)
  const passengerTriggerRef = useRef(null)
  const luggageTriggerRef = useRef(null)
  const passengerMenuRef = useRef(null)
  const luggageMenuRef = useRef(null)
  const suggestionsRef = useRef(null)
  const routeDropdownRef = useRef(null)

  // Fetch available routes from Firestore
  useEffect(() => {
    const loadRoutes = async () => {
      const routes = await fetchRoutes()
      setAvailableRoutes(routes)
    }
    loadRoutes()
  }, [])

  // Close route dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (routeDropdownRef.current && !routeDropdownRef.current.contains(event.target)) {
        setShowRouteDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load cached data on mount
  useEffect(() => {
    const cached = loadFromCache()
    if (cached) {
      setTripType(cached.tripType || 'one-way')
      setFromLocation(cached.fromLocation || '')
      setToLocation(cached.toLocation || '')
      setFromCoords(cached.fromCoords || null)
      setToCoords(cached.toCoords || null)
      setMultiCityStops(cached.multiCityStops || [{ from: '', to: '', date: '', time: '', fromCoords: null, toCoords: null }])
      setDepartureDate(cached.departureDate || '')
      setDepartureTime(cached.departureTime || '')
      setReturnDate(cached.returnDate || '')
      setReturnTime(cached.returnTime || '')
      setAdults(cached.adults || 1)
      setChildren(cached.children || 0)
      setInfants(cached.infants || 0)
      setLargeBags(cached.largeBags || 1)
      setSmallBags(cached.smallBags || 0)
    }
    setIsInitialized(true)
  }, [])


  // Save to cache whenever data changes
  useEffect(() => {
    if (!isInitialized) return

    const dataToCache = {
      tripType,
      fromLocation,
      toLocation,
      fromCoords,
      toCoords,
      multiCityStops,
      departureDate,
      departureTime,
      returnDate,
      returnTime,
      adults,
      children,
      infants,
      largeBags,
      smallBags
    }

    // Debounce the save to avoid too many writes
    const timeoutId = setTimeout(() => {
      saveToCache(dataToCache)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [
    isInitialized, tripType, fromLocation, toLocation, fromCoords, toCoords,
    multiCityStops, departureDate, departureTime, returnDate, returnTime,
    adults, children, infants, largeBags, smallBags
  ])

  // Pre-fill locations from URL params (takes priority over cache)
  useEffect(() => {
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    if (fromParam) setFromLocation(fromParam)
    if (toParam) setToLocation(toParam)
  }, [searchParams])

  const getDropdownPos = useCallback((triggerEl) => {
    if (!triggerEl) return null
    const rect = triggerEl.getBoundingClientRect()
    return {
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width
    }
  }, [])

  const togglePassengerDropdown = useCallback(() => {
    setShowPassengerDropdown((prev) => {
      const next = !prev
      if (next) {
        setShowLuggageDropdown(false)
        setPassengerMenuPos(getDropdownPos(passengerTriggerRef.current))
      }
      return next
    })
  }, [getDropdownPos])

  const toggleLuggageDropdown = useCallback(() => {
    setShowLuggageDropdown((prev) => {
      const next = !prev
      if (next) {
        setShowPassengerDropdown(false)
        setLuggageMenuPos(getDropdownPos(luggageTriggerRef.current))
      }
      return next
    })
  }, [getDropdownPos])


  // Custom unique locations from routes
  const uniqueLocations = useMemo(() => {
    const locations = new Set()
    availableRoutes.forEach(route => {
      if (route.fromLabel) locations.add(route.fromLabel)
      if (route.toLabel) locations.add(route.toLabel)
      if (route.fromPlaceholder) locations.add(route.fromPlaceholder)
      if (route.toPlaceholder) locations.add(route.toPlaceholder)
    })
    return Array.from(locations).filter(Boolean).sort()
  }, [availableRoutes])

  const filterSuggestions = useCallback((query) => {
    if (!query) return uniqueLocations
    const lowerQuery = query.toLowerCase()
    return uniqueLocations.filter(loc => loc.toLowerCase().includes(lowerQuery))
  }, [uniqueLocations])

  // Custom input handlers
  const handleFromInputChange = useCallback((e) => {
    setFromLocation(e.target.value)
    setActiveInput('from')
  }, [])

  const handleToInputChange = useCallback((e) => {
    setToLocation(e.target.value)
    setActiveInput('to')
  }, [])

  const handleSelectSuggestion = useCallback((description, type) => {
    if (type === 'from') {
      setFromLocation(description)
      setFromCoords(null)
    } else if (type === 'to') {
      setToLocation(description)
      setToCoords(null)
    }
    setActiveInput(null)
  }, [])

  const handleMultiCityInputChange = useCallback((index, field, value) => {
    setMultiCityStops(prev => {
      const newStops = [...prev]
      newStops[index] = { ...newStops[index], [field]: value }
      return newStops
    })
    setActiveInput(`${field}-${index}`)
  }, [])

  const handleMultiCitySuggestionSelect = useCallback((description, index, field) => {
    setMultiCityStops(prev => {
      const newStops = [...prev]
      newStops[index] = {
        ...newStops[index],
        [field]: description,
        [`${field}Coords`]: null
      }
      return newStops
    })
    setActiveInput(null)
  }, [])

  const updateMultiCityStop = useCallback((index, field, value) => {
    setMultiCityStops(prev => {
      const newStops = [...prev]
      newStops[index] = { ...newStops[index], [field]: value }
      return newStops
    })
  }, [])


  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setActiveInput(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target

      if (showPassengerDropdown) {
        const inTrigger = passengerDropdownRef.current && passengerDropdownRef.current.contains(target)
        const inMenu = passengerMenuRef.current && passengerMenuRef.current.contains(target)
        if (!inTrigger && !inMenu) setShowPassengerDropdown(false)
      }

      if (showLuggageDropdown) {
        const inTrigger = luggageDropdownRef.current && luggageDropdownRef.current.contains(target)
        const inMenu = luggageMenuRef.current && luggageMenuRef.current.contains(target)
        if (!inTrigger && !inMenu) setShowLuggageDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPassengerDropdown, showLuggageDropdown])

  // Keep portal dropdown aligned on scroll/resize
  useEffect(() => {
    if (!showPassengerDropdown) return
    const update = () => setPassengerMenuPos(getDropdownPos(passengerTriggerRef.current))
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [showPassengerDropdown, getDropdownPos])

  useEffect(() => {
    if (!showLuggageDropdown) return
    const update = () => setLuggageMenuPos(getDropdownPos(luggageTriggerRef.current))
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [showLuggageDropdown, getDropdownPos])

  // Memoized passenger menu render
  const renderPassengerMenu = useMemo(() => {
    if (!showPassengerDropdown || !passengerMenuPos || typeof document === 'undefined') return null

    return createPortal(
      <div
        ref={passengerMenuRef}
        className={`${styles.dropdownMenu} ${styles.dropdownMenuPortal}`}
        style={{
          top: passengerMenuPos.top,
          left: passengerMenuPos.left,
          width: passengerMenuPos.width
        }}
      >
        <div className={styles.dropdownItem}>
          <div className={styles.itemInfo}>
            <span className={styles.itemLabel}>Adults</span>
            <span className={styles.itemDesc}>12+ years</span>
          </div>
          <div className={styles.counter}>
            <button onClick={() => setAdults(prev => Math.max(1, prev - 1))} disabled={adults <= 1}>−</button>
            <span>{adults}</span>
            <button onClick={() => setAdults(prev => prev < 50 ? prev + 1 : prev)}>+</button>
          </div>
        </div>
        <div className={styles.dropdownItem}>
          <div className={styles.itemInfo}>
            <span className={styles.itemLabel}>Children</span>
            <span className={styles.itemDesc}>2-11 years</span>
          </div>
          <div className={styles.counter}>
            <button onClick={() => setChildren(prev => Math.max(0, prev - 1))} disabled={children <= 0}>−</button>
            <span>{children}</span>
            <button onClick={() => setChildren(prev => prev < 50 ? prev + 1 : prev)}>+</button>
          </div>
        </div>
        <div className={styles.dropdownItem}>
          <div className={styles.itemInfo}>
            <span className={styles.itemLabel}>Infants</span>
            <span className={styles.itemDesc}>Under 2 years</span>
          </div>
          <div className={styles.counter}>
            <button onClick={() => setInfants(prev => Math.max(0, prev - 1))} disabled={infants <= 0}>−</button>
            <span>{infants}</span>
            <button onClick={() => setInfants(prev => prev < adults ? prev + 1 : prev)} disabled={infants >= adults}>+</button>
          </div>
        </div>
      </div>,
      document.body
    )
  }, [showPassengerDropdown, passengerMenuPos, adults, children, infants])


  // Memoized luggage menu render
  const renderLuggageMenu = useMemo(() => {
    if (!showLuggageDropdown || !luggageMenuPos || typeof document === 'undefined') return null

    return createPortal(
      <div
        ref={luggageMenuRef}
        className={`${styles.dropdownMenu} ${styles.dropdownMenuPortal}`}
        style={{
          top: luggageMenuPos.top,
          left: luggageMenuPos.left,
          width: luggageMenuPos.width
        }}
      >
        <div className={styles.dropdownItem}>
          <div className={styles.itemInfo}>
            <span className={styles.itemLabel}>Large Bags</span>
            <span className={styles.itemDesc}>Suitcases, large backpacks</span>
          </div>
          <div className={styles.counter}>
            <button onClick={() => setLargeBags(prev => Math.max(0, prev - 1))} disabled={largeBags <= 0}>−</button>
            <span>{largeBags}</span>
            <button onClick={() => setLargeBags(prev => prev < 20 ? prev + 1 : prev)}>+</button>
          </div>
        </div>
        <div className={styles.dropdownItem}>
          <div className={styles.itemInfo}>
            <span className={styles.itemLabel}>Small Bags</span>
            <span className={styles.itemDesc}>Handbags, small backpacks</span>
          </div>
          <div className={styles.counter}>
            <button onClick={() => setSmallBags(prev => Math.max(0, prev - 1))} disabled={smallBags <= 0}>−</button>
            <span>{smallBags}</span>
            <button onClick={() => setSmallBags(prev => prev < 20 ? prev + 1 : prev)}>+</button>
          </div>
        </div>
      </div>,
      document.body
    )
  }, [showLuggageDropdown, luggageMenuPos, largeBags, smallBags])

  // Get today's date for min attribute
  const getMinDate = useCallback(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }, [])

  // Route selection handler
  const handleRouteSelect = useCallback((route) => {
    setSelectedRoute(route)
    setShowRouteDropdown(false)
    setRouteSearchQuery('')
    // Pre-fill location inputs from the selected route
    setFromLocation(route.fromLabel || '')
    setToLocation(route.toLabel || '')
    setFromCoords(null)
    setToCoords(null)
    setActiveInput(null)
  }, [])

  // Auto-match: When user types both from/to locations without selecting a route from dropdown
  useEffect(() => {
    if (selectedRoute) return // User already picked a route from dropdown
    if (!fromLocation || !toLocation || availableRoutes.length === 0) return

    const autoMatch = async () => {
      try {
        const result = await matchAdminRoute(fromLocation, toLocation, availableRoutes)
        if (result.matched && result.route) {
          setSelectedRoute(result.route)
          console.log('Auto-matched route:', result.routeName)
        } else {
          setSelectedRoute(null)
        }
      } catch (err) {
        console.error('Auto route matching failed:', err)
      }
    }

    const timeout = setTimeout(autoMatch, 300)
    return () => clearTimeout(timeout)
  }, [fromLocation, toLocation, availableRoutes, selectedRoute])

  // Filtered routes based on search
  const filteredRoutes = useMemo(() => {
    if (!routeSearchQuery.trim()) return availableRoutes
    const query = routeSearchQuery.toLowerCase()
    return availableRoutes.filter(r => 
      r.name?.toLowerCase().includes(query) ||
      r.fromLabel?.toLowerCase().includes(query) ||
      r.toLabel?.toLowerCase().includes(query)
    )
  }, [availableRoutes, routeSearchQuery])

  // Multi-city handlers
  const addMultiCityStop = useCallback(() => {
    if (multiCityStops.length < 5) {
      setMultiCityStops(prev => [...prev, { from: '', to: '', date: '', time: '', fromCoords: null, toCoords: null }])
    }
  }, [multiCityStops.length])

  const removeMultiCityStop = useCallback((index) => {
    if (multiCityStops.length > 1) {
      setMultiCityStops(prev => prev.filter((_, i) => i !== index))
    }
  }, [multiCityStops.length])

  // Swap locations
  const handleSwapLocations = useCallback(() => {
    setFromLocation(prev => {
      const temp = prev
      setToLocation(fromLocation)
      return toLocation
    })
    setFromCoords(prev => {
      const temp = prev
      setToCoords(fromCoords)
      return toCoords
    })
  }, [fromLocation, toLocation, fromCoords, toCoords])

  // Form submission
  const handleSearch = useCallback(() => {
    // Validate based on trip type
    if (tripType === 'one-way' || tripType === 'round-trip') {
      if (!fromLocation || !toLocation) {
        alert('Please enter both pickup and drop-off locations')
        return
      }
      if (!departureDate || !departureTime) {
        alert('Please select departure date and time')
        return
      }
      if (tripType === 'round-trip' && (!returnDate || !returnTime)) {
        alert('Please select return date and time for round trip')
        return
      }
    } else if (tripType === 'multi-city') {
      const invalidStop = multiCityStops.find(stop => !stop.from || !stop.to || !stop.date || !stop.time)
      if (invalidStop) {
        alert('Please fill in all locations, dates and times for each trip')
        return
      }
    }

    // Build query parameters
    const params = new URLSearchParams()
    params.set('tripType', tripType)
    params.set('adults', adults.toString())
    params.set('children', children.toString())
    params.set('infants', infants.toString())
    params.set('largeBags', largeBags.toString())
    params.set('smallBags', smallBags.toString())

    if (tripType === 'one-way' || tripType === 'round-trip') {
      params.set('from', fromLocation)
      params.set('to', toLocation)
      params.set('departureDate', departureDate)
      params.set('departureTime', departureTime)

      // Pass coordinates for route matching
      if (fromCoords) {
        params.set('fromLat', fromCoords.lat.toString())
        params.set('fromLng', fromCoords.lng.toString())
      }
      if (toCoords) {
        params.set('toLat', toCoords.lat.toString())
        params.set('toLng', toCoords.lng.toString())
      }

      // Pass matched route name if user selected a predefined route
      if (selectedRoute) {
        params.set('matchedRoute', selectedRoute.name)
      }

      if (tripType === 'round-trip') {
        params.set('returnDate', returnDate)
        params.set('returnTime', returnTime)
      }
    } else if (tripType === 'multi-city') {
      params.set('stops', JSON.stringify(multiCityStops))
    }

    // Show loading state
    setIsSearching(true)

    // Navigate to vehicle selection page
    router.push(`/vehicles?${params.toString()}`)
  }, [tripType, fromLocation, toLocation, departureDate, departureTime, returnDate, returnTime, multiCityStops, adults, children, infants, largeBags, smallBags, router, selectedRoute])

  // Memoized totals
  const getTotalPassengers = useMemo(() => adults + children + infants, [adults, children, infants])
  const getTotalLuggage = useMemo(() => largeBags + smallBags, [largeBags, smallBags])
  const selectedRouteFromDisplay = fromLocation.trim() || selectedRoute?.fromLabel || ''
  const selectedRouteToDisplay = toLocation.trim() || selectedRoute?.toLabel || ''
  const seoRouteHeading = selectedRoute?.name || PREDEFINED_ROUTES[1]
  const headingRoutes = selectedRoute?.name
    ? [selectedRoute.name, ...PREDEFINED_ROUTES.slice(0, 4)]
    : PREDEFINED_ROUTES.slice(0, 5)


  return (
    <div className={styles.searchPage}>
      <PortalNavbar />

      <section className={styles.searchHero}>
        <div className={styles.heroBackground}>
          <div className={styles.gradientOverlay}></div>
        </div>

        <div className={styles.heroContent}>
          <h1>{t('planJourney')}</h1>
          <p>{t('planJourneySubtitle')}</p>
          <h2 className={styles.seoRouteHeading}>{seoRouteHeading}</h2>

          <div className={styles.searchContainer}>
            {/* Trip Type Selector */}
            <div className={styles.tripTypeSelector}>
              <button
                className={`${styles.tripTypeBtn} ${tripType === 'one-way' ? styles.active : ''}`}
                onClick={() => setTripType('one-way')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 16.94v-4H5.08l-.03-2.01H14V6.94l5 5z" />
                </svg>
                {t('oneWay')}
              </button>
              <button
                className={`${styles.tripTypeBtn} ${tripType === 'round-trip' ? styles.active : ''}`}
                onClick={() => setTripType('round-trip')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 11l3-3-3-3v2H4v2h5v2zm6 2l-3 3 3 3v-2h5v-2h-5v-2z" />
                </svg>
                {t('roundTrip')}
              </button>
              <button
                className={`${styles.tripTypeBtn} ${tripType === 'multi-city' ? styles.active : ''}`}
                onClick={() => setTripType('multi-city')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 1.74.5 3.37 1.41 4.84.95 1.54 2.2 2.86 3.16 4.4.47.75.81 1.45 1.17 2.26.1.24.21.48.26.76h2c.05-.28.16-.52.27-.76.36-.81.7-1.51 1.17-2.26.96-1.54 2.21-2.86 3.16-4.4C18.5 12.37 19 10.74 19 9c0-3.87-3.13-7-7-7zm0 9.75c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                {t('multiCity')}
              </button>
            </div>

            {/* One-Way & Round Trip Form */}
            {(tripType === 'one-way' || tripType === 'round-trip') && (
              <div className={styles.searchForm}>
                {/* Route Selector */}
                <div className={styles.routeSelector} ref={routeDropdownRef}>
                  <label className={styles.routeLabel}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                    </svg>
                    Select Route
                  </label>
                  <div 
                    className={`${styles.routeSelectBox} ${selectedRoute ? styles.routeSelected : ''}`}
                    onClick={() => setShowRouteDropdown(!showRouteDropdown)}
                  >
                    {selectedRoute ? (
                      <div className={styles.selectedRouteDisplay}>
                        <span className={styles.routeFromTo}>
                          <span className={styles.routeFrom}>{selectedRouteFromDisplay}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M14 16.94v-4H5.08l-.03-2.01H14V6.94l5 5z" />
                          </svg>
                          <span className={styles.routeTo}>{selectedRouteToDisplay}</span>
                        </span>
                        <button 
                          className={styles.clearRouteBtn}
                          onClick={(e) => { e.stopPropagation(); setSelectedRoute(null); setFromLocation(''); setToLocation(''); setFromCoords(null); setToCoords(null); }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span className={styles.routePlaceholder}>Choose a predefined route or type your own location below</span>
                    )}
                    <svg className={styles.routeChevron} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  </div>
                  {showRouteDropdown && (
                    <div className={styles.routeDropdownMenu}>
                      <div className={styles.routeSearchInput}>
                        <input
                          type="text"
                          placeholder="Search routes..."
                          value={routeSearchQuery}
                          onChange={(e) => setRouteSearchQuery(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className={styles.routeDropdownList}>
                        {filteredRoutes.length === 0 ? (
                          <div className={styles.noRoutes}>No routes found</div>
                        ) : (
                          filteredRoutes.map((route) => (
                            <div
                              key={route.id}
                              className={`${styles.routeOption} ${selectedRoute?.id === route.id ? styles.routeOptionActive : ''}`}
                              onClick={() => handleRouteSelect(route)}
                            >
                              <div className={styles.routeOptionName}>{route.name}</div>
                              {route.fromLabel && route.toLabel && (
                                <div className={styles.routeOptionLabels}>
                                  <span>From: {route.fromLabel}</span>
                                  <span>→</span>
                                  <span>To: {route.toLabel}</span>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.locationRow}>
                  {/* From Location */}
                  <div className={styles.inputGroup}>
                    <label>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="4" />
                      </svg>
                      {selectedRoute?.fromLabel || t('from')}
                    </label>
                    <div className={styles.autocompleteWrapper}>
                      <input
                        ref={fromInputRef}
                        type="text"
                        placeholder={selectedRoute ? `Search your ${selectedRoute.fromLabel} location` : t('pickupLocation')}
                        value={fromLocation}
                        onChange={handleFromInputChange}
                        onFocus={() => setActiveInput('from')}
                        className={styles.locationInput}
                        autoComplete="off"
                      />
                      {activeInput === 'from' && filterSuggestions(fromLocation).length > 0 && (
                        <ul className={styles.suggestionsList} ref={suggestionsRef}>
                          {filterSuggestions(fromLocation).map((loc, idx) => (
                            <li
                              key={idx}
                              onClick={() => handleSelectSuggestion(loc, 'from')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                              </svg>
                              <span>{loc}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Swap Button */}
                  <button className={styles.swapBtn} onClick={handleSwapLocations} title="Swap locations">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z" />
                    </svg>
                  </button>

                  {/* To Location */}
                  <div className={styles.inputGroup}>
                    <label>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      {selectedRoute?.toLabel || t('to')}
                    </label>
                    <div className={styles.autocompleteWrapper}>
                      <input
                        ref={toInputRef}
                        type="text"
                        placeholder={selectedRoute ? `Search your ${selectedRoute.toLabel} location` : t('dropoffLocation')}
                        value={toLocation}
                        onChange={handleToInputChange}
                        onFocus={() => setActiveInput('to')}
                        className={styles.locationInput}
                        autoComplete="off"
                      />
                      {activeInput === 'to' && filterSuggestions(toLocation).length > 0 && (
                        <ul className={styles.suggestionsList} ref={suggestionsRef}>
                          {filterSuggestions(toLocation).map((loc, idx) => (
                            <li
                              key={idx}
                              onClick={() => handleSelectSuggestion(loc, 'to')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                              </svg>
                              <span>{loc}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>


                <div className={styles.detailsRow}>
                  {/* Departure Date & Time */}
                  <div className={styles.inputGroup}>
                    <label>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                      </svg>
                      {t('departureDate')}
                    </label>
                    <input
                      type="date"
                      min={getMinDate()}
                      value={departureDate}
                      onClick={(e) => {
                        try { if (e.target.showPicker) e.target.showPicker(); } catch(err) {}
                      }}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className={styles.dateInput}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                      </svg>
                      {t('departureTime')}
                    </label>
                    <input
                      type="time"
                      value={departureTime}
                      onClick={(e) => {
                        try { if (e.target.showPicker) e.target.showPicker(); } catch(err) {}
                      }}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className={styles.timeInput}
                    />
                  </div>

                  {/* Return Date & Time (for round trip) */}
                  {tripType === 'round-trip' && (
                    <>
                      <div className={styles.inputGroup}>
                        <label>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                          </svg>
                          {t('returnDate')}
                        </label>
                        <input
                          type="date"
                          min={departureDate || getMinDate()}
                          value={returnDate}
                          onClick={(e) => {
                            try { if (e.target.showPicker) e.target.showPicker(); } catch(err) {}
                          }}
                          onChange={(e) => setReturnDate(e.target.value)}
                          className={styles.dateInput}
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <label>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                          </svg>
                          {t('returnTime')}
                        </label>
                        <input
                          type="time"
                          value={returnTime}
                          onClick={(e) => {
                            try { if (e.target.showPicker) e.target.showPicker(); } catch(err) {}
                          }}
                          onChange={(e) => setReturnTime(e.target.value)}
                          className={styles.timeInput}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className={styles.passengersRow}>
                  {/* Passengers Dropdown */}
                  <div className={styles.dropdownContainer} ref={passengerDropdownRef}>
                    <div
                      className={styles.dropdownTrigger}
                      ref={passengerTriggerRef}
                      onClick={togglePassengerDropdown}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                      </svg>
                      <span>{getTotalPassengers} Passenger{getTotalPassengers !== 1 ? 's' : ''}</span>
                      <svg className={styles.chevron} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                      </svg>
                    </div>
                  </div>

                  {/* Luggage Dropdown */}
                  <div className={styles.dropdownContainer} ref={luggageDropdownRef}>
                    <div
                      className={styles.dropdownTrigger}
                      ref={luggageTriggerRef}
                      onClick={toggleLuggageDropdown}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 6h-2V3c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v3H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2 0 .55.45 1 1 1s1-.45 1-1h6c0 .55.45 1 1 1s1-.45 1-1c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 3h4v3h-4V3z" />
                      </svg>
                      <span>{getTotalLuggage} Bag{getTotalLuggage !== 1 ? 's' : ''}</span>
                      <svg className={styles.chevron} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                      </svg>
                    </div>
                  </div>

                  {/* Search Button */}
                  <button className={`${styles.searchBtn} ${isSearching ? styles.loading : ''}`} onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? (
                      <>
                        <span className={styles.btnSpinner}></span>
                        Searching...
                      </>
                    ) : 'Search Vehicles'}
                    {!isSearching && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}


            {/* Multi-City Form */}
            {tripType === 'multi-city' && (
              <div className={styles.multiCityForm}>
                {multiCityStops.map((stop, index) => (
                  <div key={index} className={styles.multiCityStop}>
                    <div className={styles.stopHeader}>
                      <span className={styles.stopNumber}>Trip {index + 1}</span>
                      {multiCityStops.length > 1 && (
                        <button
                          className={styles.removeStopBtn}
                          onClick={() => removeMultiCityStop(index)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className={styles.stopFields}>
                      <div className={styles.inputGroup}>
                        <label>From</label>
                        <div className={styles.autocompleteWrapper}>
                          <input
                            ref={(el) => multiCityRefs.current[`from-${index}`] = el}
                            type="text"
                            placeholder="Pickup location"
                            value={stop.from}
                            onChange={(e) => handleMultiCityInputChange(index, 'from', e.target.value)}
                            onFocus={() => setActiveInput(`from-${index}`)}
                            autoComplete="off"
                          />
                          {activeInput === `from-${index}` && filterSuggestions(stop.from).length > 0 && (
                            <ul className={styles.suggestionsList}>
                              {filterSuggestions(stop.from).map((loc, idx) => (
                                <li
                                  key={idx}
                                  onClick={() => handleMultiCitySuggestionSelect(loc, index, 'from')}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                  </svg>
                                  <span>{loc}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      <div className={styles.inputGroup}>
                        <label>To</label>
                        <div className={styles.autocompleteWrapper}>
                          <input
                            ref={(el) => multiCityRefs.current[`to-${index}`] = el}
                            type="text"
                            placeholder="Drop-off location"
                            value={stop.to}
                            onChange={(e) => handleMultiCityInputChange(index, 'to', e.target.value)}
                            onFocus={() => setActiveInput(`to-${index}`)}
                            autoComplete="off"
                          />
                          {activeInput === `to-${index}` && filterSuggestions(stop.to).length > 0 && (
                            <ul className={styles.suggestionsList}>
                              {filterSuggestions(stop.to).map((loc, idx) => (
                                <li
                                  key={idx}
                                  onClick={() => handleMultiCitySuggestionSelect(loc, index, 'to')}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                  </svg>
                                  <span>{loc}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      <div className={styles.inputGroup}>
                        <label>Date</label>
                        <input
                          type="date"
                          min={index > 0 ? multiCityStops[index - 1].date || getMinDate() : getMinDate()}
                          value={stop.date}
                          onChange={(e) => updateMultiCityStop(index, 'date', e.target.value)}
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <label>Time</label>
                        <input
                          type="time"
                          value={stop.time}
                          onChange={(e) => updateMultiCityStop(index, 'time', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {multiCityStops.length < 5 && (
                  <button className={styles.addStopBtn} onClick={addMultiCityStop}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    Add Another Trip
                  </button>
                )}


                <div className={styles.multiCityPassengers}>
                  {/* Passengers Dropdown */}
                  <div className={styles.dropdownContainer} ref={passengerDropdownRef}>
                    <div
                      className={styles.dropdownTrigger}
                      ref={passengerTriggerRef}
                      onClick={togglePassengerDropdown}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                      </svg>
                      <span>{getTotalPassengers} Passenger{getTotalPassengers !== 1 ? 's' : ''}</span>
                      <svg className={styles.chevron} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                      </svg>
                    </div>
                  </div>

                  {/* Luggage Dropdown */}
                  <div className={styles.dropdownContainer} ref={luggageDropdownRef}>
                    <div
                      className={styles.dropdownTrigger}
                      ref={luggageTriggerRef}
                      onClick={toggleLuggageDropdown}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 6h-2V3c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v3H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2 0 .55.45 1 1 1s1-.45 1-1h6c0 .55.45 1 1 1s1-.45 1-1c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 3h4v3h-4V3z" />
                      </svg>
                      <span>{getTotalLuggage} Bag{getTotalLuggage !== 1 ? 's' : ''}</span>
                      <svg className={styles.chevron} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                      </svg>
                    </div>
                  </div>

                  {/* Search Button */}
                  <button className={`${styles.searchBtn} ${isSearching ? styles.loading : ''}`} onClick={handleSearch} disabled={!isLoaded || isSearching}>
                    {isSearching ? (
                      <>
                        <span className={styles.btnSpinner}></span>
                        Searching...
                      </>
                    ) : !isLoaded ? 'Loading...' : 'Search Vehicles'}
                    {!isSearching && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <RouteKeywordHeadings
            title="Exact Route Keywords for Umrah Taxi Booking"
            routes={headingRoutes}
            compact
          />
        </div>
      </section>

      {renderPassengerMenu}
      {renderLuggageMenu}

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
              </svg>
            </div>
            <h3>{t('safeReliable')}</h3>
            <p>{t('safeReliableDesc')}</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
              </svg>
            </div>
            <h3>{t('service247')}</h3>
            <p>{t('service247Desc')}</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm4 8h-3v3h-2v-3H8V8h3V5h2v3h3v2z" />
              </svg>
            </div>
            <h3>{t('multipleRoutes')}</h3>
            <p>{t('multipleRoutesDesc')}</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
              </svg>
            </div>
            <h3>{t('airportTransfers')}</h3>
            <p>{t('airportTransfersDesc')}</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

const SearchLoading = () => (
  <div className={styles.searchPage}>
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '20px' }}>
      <div style={{ width: '50px', height: '50px', border: '4px solid #e2e8f0', borderTopColor: '#1D6F42', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <p style={{ color: '#6B7280' }}>Loading...</p>
    </div>
  </div>
)

const SearchPage = () => {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchPageContent />
    </Suspense>
  )
}

export default SearchPage