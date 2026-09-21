'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { fetchVehicles } from '../../lib/firebase'
import Footer from '../components/Footer/Footer'
import { useCurrency } from '../../context/CurrencyContext'
import { matchRoute, PREDEFINED_ROUTES } from '../../lib/routeMatcher'
import { fetchRouteCostPrices, fetchRouteMarkups, getRouteBasedPrice } from '../../lib/pricing'
import RouteKeywordHeadings from '../components/SEO/RouteKeywordHeadings'
import PortalNavbar from '../components/Navbar/PortalNavbar'
import styles from './booking.module.scss'
import { useTranslation } from '../../hooks/useTranslation'

const BookingPageContent = () => {
  const searchParams = useSearchParams()
  const { formatPrice } = useCurrency()
  const t = useTranslation()
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [fromCoords, setFromCoords] = useState(null)
  const [toCoords, setToCoords] = useState(null)
  const [distance, setDistance] = useState(null)
  const [duration, setDuration] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [matchedRouteName, setMatchedRouteName] = useState(null)
  const [routeMatchResult, setRouteMatchResult] = useState(null)
  const [costPrices, setCostPrices] = useState({})
  const [routeMarkups, setRouteMarkups] = useState({})
  const [pricingLoaded, setPricingLoaded] = useState(false)

  const mapRef = useRef(null)
  const visibleMapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const directionsServiceRef = useRef(null)
  const directionsRendererRef = useRef(null)
  const fromInputRef = useRef(null)
  const toInputRef = useRef(null)
  const fromAutocompleteRef = useRef(null)
  const toAutocompleteRef = useRef(null)
  const vehiclesListRef = useRef(null)
  const loadingRef = useRef(false)
  const lastDocRef = useRef(null)

  useEffect(() => {
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    if (fromParam) setFromLocation(fromParam)
    if (toParam) setToLocation(toParam)
  }, [searchParams])

  // Fetch pricing data from Firestore
  useEffect(() => {
    const loadPricingData = async () => {
      try {
        const [costs, markups] = await Promise.all([
          fetchRouteCostPrices(),
          fetchRouteMarkups()
        ])
        setCostPrices(costs)
        setRouteMarkups(markups)
        setPricingLoaded(true)
      } catch (error) {
        console.error('Error loading pricing data:', error)
        setPricingLoaded(true)
      }
    }
    loadPricingData()
  }, [])

  // Route matching when coordinates change
  useEffect(() => {
    if (fromCoords && toCoords && fromLocation && toLocation) {
      const result = matchRoute(fromCoords, toCoords, fromLocation, toLocation)
      setRouteMatchResult(result)
      setMatchedRouteName(result.matched ? result.routeName : null)
    }
  }, [fromCoords, toCoords, fromLocation, toLocation])

  // Geocode location text to coordinates
  const geocodeLocation = useCallback((address) => {
    return new Promise((resolve, reject) => {
      if (!window.google) {
        reject(new Error('Google Maps not loaded'))
        return
      }
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ address: address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve({
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
          })
        } else {
          reject(new Error('Geocoding failed'))
        }
      })
    })
  }, [])

  // Auto-geocode when locations come from URL params
  useEffect(() => {
    const geocodeFromParams = async () => {
      if (isLoaded && fromLocation && toLocation && !fromCoords && !toCoords) {
        try {
          const [fromResult, toResult] = await Promise.all([
            geocodeLocation(fromLocation),
            geocodeLocation(toLocation)
          ])
          setFromCoords(fromResult)
          setToCoords(toResult)
        } catch (error) {
          console.error('Geocoding error:', error)
        }
      }
    }
    geocodeFromParams()
  }, [isLoaded, fromLocation, toLocation, fromCoords, toCoords, geocodeLocation])

  // Auto-trigger route calculation when coordinates are available from URL params
  useEffect(() => {
    if (fromCoords && toCoords && !showResults && isLoaded && directionsServiceRef.current && directionsRendererRef.current) {
      directionsServiceRef.current.route({
        origin: fromCoords,
        destination: toCoords,
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === 'OK') {
          directionsRendererRef.current.setDirections(result)
          const route = result.routes[0]
          if (route && route.legs[0]) {
            setDistance(route.legs[0].distance.text)
            setDuration(route.legs[0].duration.text)
            setShowResults(true)
          }
        }
      })
    }
  }, [fromCoords, toCoords, showResults, isLoaded])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if script is already loaded or loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')

      if (window.google && window.google.maps) {
        setIsLoaded(true)
      } else if (!existingScript) {
        // Define callback before loading script
        window.initGoogleMaps = () => {
          setIsLoaded(true)
          delete window.initGoogleMaps
        }

        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`
        script.async = true
        script.defer = true
        script.onerror = () => {
          console.error('Failed to load Google Maps')
          delete window.initGoogleMaps
        }
        document.head.appendChild(script)
      } else {
        // Script exists but not loaded yet, wait for it
        const checkLoaded = setInterval(() => {
          if (window.google && window.google.maps) {
            setIsLoaded(true)
            clearInterval(checkLoaded)
          }
        }, 100)

        // Cleanup interval after 10 seconds
        setTimeout(() => {
          clearInterval(checkLoaded)
        }, 10000)
      }
    }
  }, [])

  const loadVehicles = useCallback(async (reset = false) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)

    try {
      const result = await fetchVehicles({
        pageSize: 10,
        lastDoc: reset ? null : lastDocRef.current,
        category: selectedCategory
      })

      if (reset) {
        setVehicles(result.vehicles)
      } else {
        setVehicles(prev => [...prev, ...result.vehicles])
      }
      lastDocRef.current = result.lastDoc
      setLastDoc(result.lastDoc)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('Error loading vehicles:', error)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [selectedCategory])

  useEffect(() => {
    if (showResults) {
      lastDocRef.current = null
      loadVehicles(true)
    }
  }, [showResults, selectedCategory, loadVehicles])

  useEffect(() => {
    if (!showResults || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadVehicles(false)
        }
      },
      { threshold: 0.1 }
    )

    const sentinel = document.getElementById('load-more-sentinel')
    if (sentinel) observer.observe(sentinel)

    return () => observer.disconnect()
  }, [showResults, hasMore, loadVehicles])

  useEffect(() => {
    if (isLoaded && mapRef.current && !mapInstanceRef.current) {
      const defaultCenter = { lat: 21.4225, lng: 39.8262 }

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 8,
        styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      })

      directionsServiceRef.current = new window.google.maps.DirectionsService()
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        polylineOptions: { strokeColor: '#1D6F42', strokeWeight: 5, strokeOpacity: 0.8 },
        markerOptions: { visible: true }
      })
    }
  }, [isLoaded])

  // Create visible map instance when results are shown
  useEffect(() => {
    if (showResults && visibleMapRef.current && isLoaded && window.google) {
      const visibleMapInstance = new window.google.maps.Map(visibleMapRef.current, {
        center: { lat: 21.4225, lng: 39.8262 },
        zoom: 8,
        styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      })

      // Copy directions to visible map
      if (directionsRendererRef.current) {
        const visibleRenderer = new window.google.maps.DirectionsRenderer({
          map: visibleMapInstance,
          polylineOptions: { strokeColor: '#1D6F42', strokeWeight: 5, strokeOpacity: 0.8 },
          markerOptions: { visible: true }
        })

        // Get existing directions and show them
        const directions = directionsRendererRef.current.getDirections()
        if (directions) {
          visibleRenderer.setDirections(directions)
        }
      }
    }
  }, [showResults, isLoaded])

  useEffect(() => {
    if (isLoaded && window.google) {
      if (fromInputRef.current && !fromAutocompleteRef.current) {
        fromAutocompleteRef.current = new window.google.maps.places.Autocomplete(
          fromInputRef.current,
          {}
        )

        fromAutocompleteRef.current.addListener('place_changed', () => {
          const place = fromAutocompleteRef.current.getPlace()
          if (place.geometry) {
            setFromCoords({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() })
            setFromLocation(place.formatted_address || place.name)
          }
        })
      }

      if (toInputRef.current && !toAutocompleteRef.current) {
        toAutocompleteRef.current = new window.google.maps.places.Autocomplete(
          toInputRef.current,
          {}
        )

        toAutocompleteRef.current.addListener('place_changed', () => {
          const place = toAutocompleteRef.current.getPlace()
          if (place.geometry) {
            setToCoords({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() })
            setToLocation(place.formatted_address || place.name)
          }
        })
      }
    }
  }, [isLoaded])

  const calculateRoute = useCallback(() => {
    if (fromCoords && toCoords && directionsServiceRef.current && directionsRendererRef.current) {
      directionsServiceRef.current.route({
        origin: fromCoords,
        destination: toCoords,
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === 'OK') {
          directionsRendererRef.current.setDirections(result)
          const route = result.routes[0]
          if (route && route.legs[0]) {
            setDistance(route.legs[0].distance.text)
            setDuration(route.legs[0].duration.text)
            setShowResults(true)
          }
        } else {
          alert('Could not calculate route. Please try different locations.')
        }
      })
    }
  }, [fromCoords, toCoords])

  const handleSearch = async () => {
    if (!fromLocation || !toLocation) {
      alert(t('bkBothLocations'))
      return
    }

    // Check if Google Maps is loaded
    if (!isLoaded || !window.google) {
      alert('Maps are still loading. Please wait a moment and try again.')
      return
    }

    // If coordinates exist, calculate route directly
    if (fromCoords && toCoords) {
      calculateRoute()
      return
    }

    // Otherwise, geocode the locations first
    try {
      setLoading(true)
      const [fromResult, toResult] = await Promise.all([
        geocodeLocation(fromLocation),
        geocodeLocation(toLocation)
      ])
      setFromCoords(fromResult)
      setToCoords(toResult)

      // Initialize directions service if not already done
      if (!directionsServiceRef.current) {
        directionsServiceRef.current = new window.google.maps.DirectionsService()
      }
      if (!directionsRendererRef.current) {
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          polylineOptions: { strokeColor: '#1D6F42', strokeWeight: 5, strokeOpacity: 0.8 },
          markerOptions: { visible: true }
        })
      }

      // Calculate route after setting coordinates
      directionsServiceRef.current.route({
        origin: fromResult,
        destination: toResult,
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === 'OK') {
          directionsRendererRef.current.setDirections(result)
          const route = result.routes[0]
          if (route && route.legs[0]) {
            setDistance(route.legs[0].distance.text)
            setDuration(route.legs[0].duration.text)
            setShowResults(true)
          }
        } else {
          alert('Could not calculate route. Please try different locations.')
        }
        setLoading(false)
      })
    } catch (error) {
      console.error('Geocoding error:', error)
      alert('Could not find the locations. Please try again or select from dropdown suggestions.')
      setLoading(false)
    }
  }

  const handleSwapLocations = () => {
    const tempLocation = fromLocation
    const tempCoords = fromCoords
    setFromLocation(toLocation)
    setFromCoords(toCoords)
    setToLocation(tempLocation)
    setToCoords(tempCoords)
  }

  const handleReset = () => {
    setFromLocation('')
    setToLocation('')
    setFromCoords(null)
    setToCoords(null)
    setDistance(null)
    setDuration(null)
    setShowResults(false)
    setVehicles([])
    setSelectedVehicle(null)
    setSelectedCategory(null)

    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] })
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: 21.4225, lng: 39.8262 })
      mapInstanceRef.current.setZoom(10)
    }
  }

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category)
    setVehicles([])
    lastDocRef.current = null
    setLastDoc(null)
    setHasMore(true)
  }

  const getVehiclePrice = (vehicle) => {
    // Use route-based pricing if route is matched and pricing data is loaded
    if (matchedRouteName && pricingLoaded) {
      const routePrice = getRouteBasedPrice(vehicle, matchedRouteName, costPrices, routeMarkups)
      if (routePrice !== null) return routePrice
    }

    // Fallback: legacy pricing
    let price = 0
    if (vehicle.routePricing && vehicle.routePricing.length > 0) {
      price = parseFloat(vehicle.routePricing[0].price) || 0
    } else {
      price = parseFloat(vehicle.pricePerDay) || 0
    }

    if (vehicle.isHajjSeason && vehicle.hajjSeasonPrice) {
      price = parseFloat(vehicle.hajjSeasonPrice)
    } else if (vehicle.isUmrahSeason && vehicle.umrahSeasonPrice) {
      price = parseFloat(vehicle.umrahSeasonPrice)
    }

    if (vehicle.discountPercent && vehicle.discountPercent > 0) {
      price = price * (1 - vehicle.discountPercent / 100)
    } else if (vehicle.discountAmount && vehicle.discountAmount > 0) {
      price = price - vehicle.discountAmount
    }

    return Math.max(0, price)
  }

  const seoRouteHeading = matchedRouteName || PREDEFINED_ROUTES[1]
  const headingRoutes = matchedRouteName
    ? [matchedRouteName, ...PREDEFINED_ROUTES.slice(0, 4)]
    : PREDEFINED_ROUTES.slice(0, 5)


  return (
    <div className={styles.bookingPage}>
      {/* Shared Navbar - Not sticky on booking page */}
      <PortalNavbar />

      {/* Hidden map container for initializing Google Maps before search */}
      <div ref={mapRef} style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}></div>

      <section className={styles.bookingHero}>
        <div className={styles.heroBackground}>
          <div className={styles.gradientOverlay}></div>
        </div>
        <div className={styles.heroContent}>
          <h1>{t('bkHeroTitle')}</h1>
          <p>{t('bkHeroSubtitle')}</p>
          <h2 className={styles.seoRouteHeading}>{seoRouteHeading}</h2>

          <div className={styles.searchBarWrapper}>
            <div className={styles.searchBar}>
              <div className={`${styles.searchField} ${styles.fromField}`}>
                <div className={`${styles.fieldIcon} ${styles.fromIcon}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </div>
                <div className={styles.fieldContent}>
                  <label>{t('bkPickupLocation')}</label>
                  <input
                    ref={fromInputRef}
                    type="text"
                    placeholder={t('bkEnterPickup')}
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.fieldDivider}>
                <button type="button" className={styles.swapButton} onClick={handleSwapLocations} title="Swap locations">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z" />
                  </svg>
                </button>
              </div>

              <div className={`${styles.searchField} ${styles.toField}`}>
                <div className={`${styles.fieldIcon} ${styles.toIcon}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                <div className={styles.fieldContent}>
                  <label>{t('bkDropoffLocation')}</label>
                  <input
                    ref={toInputRef}
                    type="text"
                    placeholder="Enter destination"
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="button"
                className={styles.searchButton}
                onClick={handleSearch}
                disabled={loading || !isLoaded}
              >
                {loading ? t('bkSearching') : !isLoaded ? t('bkLoadingMaps') : t('bkFindVehicles')}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.offerContainer}>
        <RouteKeywordHeadings
          title="Exact Route Keywords for Booking"
          routes={headingRoutes}
          compact
        />
      </div>

      {showResults && (
        <section className={styles.resultsSection}>
          <div className={styles.resultsContainer}>
            <div className={styles.vehiclesPanel} ref={vehiclesListRef}>
              <div className={styles.vehiclesHeader}>
                <div className={styles.routeSummary}>
                  <h2>Available Vehicles</h2>
                  <div className={styles.routeInfoText}>
                    <div className={styles.routePath}>
                      <span className={styles.fromDot}></span>
                      <span className={styles.routeLineH}></span>
                      <span className={styles.toDot}></span>
                    </div>
                    <div className={styles.routeLocationsText}>
                      <span className={styles.locFrom}>{fromLocation}</span>
                      <span className={styles.locTo}>{toLocation}</span>
                    </div>
                  </div>
                  <div className={styles.routeStatsMini}>
                    <div className={styles.statBadge}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      </svg>
                      {distance}
                    </div>
                    <div className={styles.statBadge}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                      </svg>
                      {duration}
                    </div>
                  </div>
                </div>
                <button className={styles.resetBtn} onClick={handleReset}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                  New Search
                </button>
              </div>

              <div className={styles.categoryFilters}>
                <span className={styles.filterLabel}>Filter by Type:</span>
                {['sedan', 'suv', 'van', 'bus'].map(cat => (
                  <button
                    key={cat}
                    className={`${styles.filterBtn} ${selectedCategory === cat ? styles.active : ''}`}
                    onClick={() => handleCategoryFilter(cat)}
                  >
                    {cat === 'sedan' && '🚗'}
                    {cat === 'suv' && '🚙'}
                    {cat === 'van' && '🚐'}
                    {cat === 'bus' && '🚌'}
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              <div className={styles.vehiclesList}>
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className={`${styles.vehicleCard} ${selectedVehicle?.id === vehicle.id ? styles.selected : ''}`}
                    onClick={() => setSelectedVehicle(vehicle)}
                  >
                    <div className={styles.vehicleImage}>
                      <img
                        src={vehicle.imageUrl}
                        alt={vehicle.vehicleTypeName || vehicle.name}
                        loading="lazy"
                        onError={(e) => { e.target.src = '/logobg.png' }}
                      />
                      <span className={styles.vehicleCategoryBadge}>{vehicle.category}</span>
                    </div>
                    <div className={styles.vehicleContent}>
                      <div className={styles.vehicleMainInfo}>
                        <h3>{vehicle.vehicleTypeName || vehicle.name}</h3>
                        <div className={styles.vehicleSpecs}>
                          <span className={styles.specItem}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                            {vehicle.capacity} Seats
                          </span>
                          <span className={styles.specItem}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                            </svg>
                            {vehicle.year}
                          </span>
                          <span className={styles.specItem}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                            {vehicle.city}
                          </span>
                        </div>
                        <div className={styles.vehicleOwnerInfo}>
                          <span className={styles.ownerBadge}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                            </svg>
                            {vehicle.ownerName}
                          </span>
                          {vehicle.plateNumber && (
                            <span className={styles.plateBadge}>{vehicle.plateNumber}</span>
                          )}
                        </div>
                      </div>
                      <div className={styles.vehiclePriceSection}>
                        <div className={styles.priceDisplay}>
                          <span className={styles.priceLabel}>Price</span>
                          <span className={styles.priceAmount}>{formatPrice(getVehiclePrice(vehicle))}</span>
                        </div>
                        <button className={styles.selectVehicleBtn}>
                          {selectedVehicle?.id === vehicle.id ? '✓ Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className={styles.loadingSpinner}>
                    <div className={styles.spinner}></div>
                    <p>Loading vehicles...</p>
                  </div>
                )}

                {hasMore && !loading && <div id="load-more-sentinel" style={{ height: '20px' }}></div>}

                {!loading && vehicles.length === 0 && (
                  <div className={styles.noVehicles}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                    </svg>
                    <p>No vehicles available for this route</p>
                    <span>Try changing your filters or search for a different route</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.mapPanel}>
              <div ref={visibleMapRef} className={styles.googleMap}></div>

              {selectedVehicle && (
                <div className={styles.bookingPanel}>
                  <div className={styles.bookingPanelHeader}>
                    <h4>Booking Summary</h4>
                  </div>
                  <div className={styles.selectedVehicleInfo}>
                    <img
                      src={selectedVehicle.imageUrl}
                      alt={selectedVehicle.vehicleTypeName}
                      loading="lazy"
                      onError={(e) => { e.target.src = '/logobg.png' }}
                    />
                    <div className={styles.selectedDetails}>
                      <p className={styles.selectedName}>{selectedVehicle.vehicleTypeName || selectedVehicle.name}</p>
                      <p className={styles.selectedCapacity}>{selectedVehicle.capacity} passengers • {selectedVehicle.year}</p>
                      <p className={styles.selectedOwner}>By {selectedVehicle.ownerName}</p>
                    </div>
                  </div>
                  <div className={styles.bookingRoute}>
                    <div className={styles.bookingRouteItem}>
                      <span className={`${styles.routeDot} ${styles.from}`}></span>
                      <div>
                        <span className={styles.routeLabel}>{t('bkPickupLabel')}</span>
                        <span className={styles.routeAddress}>{fromLocation}</span>
                      </div>
                    </div>
                    <div className={styles.bookingRouteLine}></div>
                    <div className={styles.bookingRouteItem}>
                      <span className={`${styles.routeDot} ${styles.to}`}></span>
                      <div>
                        <span className={styles.routeLabel}>{t('bkDropoffLabel')}</span>
                        <span className={styles.routeAddress}>{toLocation}</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.bookingSummary}>
                    <div className={styles.summaryRow}>
                      <span>Distance</span>
                      <span>{distance}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Duration</span>
                      <span>{duration}</span>
                    </div>
                    <div className={`${styles.summaryRow} ${styles.total}`}>
                      <span>Total Price</span>
                      <span className={styles.totalPrice}>{formatPrice(getVehiclePrice(selectedVehicle))}</span>
                    </div>
                  </div>
                  <button className={styles.confirmBookingBtn}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    Confirm Booking
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Empty spacer when no results to push footer down */}
      {!showResults && (
        <section className={styles.emptySection}>
          <div className={styles.emptyContent}>
            <p>{t('bkEnterLocations')}</p>
          </div>
        </section>
      )}

      {/* Shared Footer */}
      <Footer />
    </div>
  )
}

const BookingLoading = () => (
  <div className={styles.bookingPage}>
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '20px' }}>
      <div className={styles.spinner}></div>
      <p style={{ color: '#6B7280' }}>Loading...</p>
    </div>
  </div>
)

const BookingPage = () => {
  return (
    <Suspense fallback={<BookingLoading />}>
      <BookingPageContent />
    </Suspense>
  )
}

export default BookingPage
