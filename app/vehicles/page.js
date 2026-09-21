'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { fetchVehicles, matchAdminRoute } from '../../lib/firebase'
import { matchRoute, PREDEFINED_ROUTES } from '../../lib/routeMatcher'
import { fetchRouteCostPrices, fetchRouteMarkups, getRouteBasedPrice, getLegacyVehiclePrice, saveRouteRequest } from '../../lib/pricing'
import dynamic from 'next/dynamic'
import styles from './vehicles.module.scss'
import { useTranslation } from '../../hooks/useTranslation'
import { useCurrency } from '../../context/CurrencyContext'
import RouteKeywordHeadings from '../components/SEO/RouteKeywordHeadings'
import PortalNavbar from '../components/Navbar/PortalNavbar'

// Lazy load heavy components
const Footer = dynamic(() => import('../components/Footer/Footer'), {
  ssr: false,
  loading: () => <div style={{ height: '200px', background: '#1a1a2e' }}></div>
})

// Cache keys
const VEHICLES_CACHE_KEY = 'umrahlimo_vehicles_selection'
const VEHICLES_DATA_CACHE_KEY = 'umrahlimo_vehicles_data'
const CACHE_EXPIRY = 30 * 60 * 1000 // 30 minutes

// Helper functions for caching
const saveSelectionToCache = (data) => {
  try {
    const cacheData = { data, timestamp: Date.now() }
    sessionStorage.setItem(VEHICLES_CACHE_KEY, JSON.stringify(cacheData))
  } catch (e) {
    console.warn('Failed to save selection to cache:', e)
  }
}

const loadSelectionFromCache = () => {
  try {
    const cached = sessionStorage.getItem(VEHICLES_CACHE_KEY)
    if (!cached) return null
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      sessionStorage.removeItem(VEHICLES_CACHE_KEY)
      return null
    }
    return data
  } catch (e) {
    return null
  }
}

const saveVehiclesToCache = (vehicles) => {
  try {
    const cacheData = { vehicles, timestamp: Date.now() }
    sessionStorage.setItem(VEHICLES_DATA_CACHE_KEY, JSON.stringify(cacheData))
  } catch (e) {
    console.warn('Failed to save vehicles to cache:', e)
  }
}

const loadVehiclesFromCache = () => {
  try {
    const cached = sessionStorage.getItem(VEHICLES_DATA_CACHE_KEY)
    if (!cached) return null
    const { vehicles, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      sessionStorage.removeItem(VEHICLES_DATA_CACHE_KEY)
      return null
    }
    return vehicles
  } catch (e) {
    return null
  }
}

const VehiclesPageContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslation()
  const { formatPrice } = useCurrency()
  const [isInitialized, setIsInitialized] = useState(false)

  // Trip Details from URL
  const [tripType, setTripType] = useState('one-way')
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [returnTime, setReturnTime] = useState('')
  const [multiCityStops, setMultiCityStops] = useState([])

  // Passengers & Luggage
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)
  const [largeBags, setLargeBags] = useState(1)
  const [smallBags, setSmallBags] = useState(0)

  // Route calculation
  const [isLoaded, setIsLoaded] = useState(false)
  const [distance, setDistance] = useState(null)
  const [duration, setDuration] = useState(null)

  // Route matching & pricing
  const [fromCoords, setFromCoords] = useState(null)
  const [toCoords, setToCoords] = useState(null)
  const [matchedRouteName, setMatchedRouteName] = useState(null)
  const [routeMatchResult, setRouteMatchResult] = useState(null)
  const [costPrices, setCostPrices] = useState({})
  const [routeMarkups, setRouteMarkups] = useState({})
  const [pricingLoaded, setPricingLoaded] = useState(false)

  // Multi-city route info
  const [multiCityRouteInfo, setMultiCityRouteInfo] = useState([])

  // Vehicles
  const [vehicles, setVehicles] = useState([])
  const [filteredVehicles, setFilteredVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [sortBy, setSortBy] = useState('recommended')
  const [isProceedingToBooking, setIsProceedingToBooking] = useState(false)
  const [activeVehicleImageIndex, setActiveVehicleImageIndex] = useState({})

  // Multi-city vehicle selection - each trip can have different vehicle
  const [selectedVehiclesPerTrip, setSelectedVehiclesPerTrip] = useState({})
  const [activeTrip, setActiveTrip] = useState(0)

  // Refs
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const directionsServiceRef = useRef(null)
  const directionsRendererRef = useRef(null)
  const loadingRef = useRef(false)
  const lastDocRef = useRef(null)

  // Parse URL parameters and load cached selection
  useEffect(() => {
    setTripType(searchParams.get('tripType') || 'one-way')
    setFromLocation(searchParams.get('from') || '')
    setToLocation(searchParams.get('to') || '')
    setDepartureDate(searchParams.get('departureDate') || '')
    setDepartureTime(searchParams.get('departureTime') || '')
    setReturnDate(searchParams.get('returnDate') || '')
    setReturnTime(searchParams.get('returnTime') || '')
    setAdults(parseInt(searchParams.get('adults')) || 1)
    setChildren(parseInt(searchParams.get('children')) || 0)
    setInfants(parseInt(searchParams.get('infants')) || 0)
    setLargeBags(parseInt(searchParams.get('largeBags')) || 1)
    setSmallBags(parseInt(searchParams.get('smallBags')) || 0)

    // Read coordinates from URL params (passed from search page)
    const fromLat = parseFloat(searchParams.get('fromLat'))
    const fromLng = parseFloat(searchParams.get('fromLng'))
    const toLat = parseFloat(searchParams.get('toLat'))
    const toLng = parseFloat(searchParams.get('toLng'))
    if (!isNaN(fromLat) && !isNaN(fromLng)) setFromCoords({ lat: fromLat, lng: fromLng })
    if (!isNaN(toLat) && !isNaN(toLng)) setToCoords({ lat: toLat, lng: toLng })

    // Read pre-matched route from URL (when user selected a predefined route on search page)
    const preMatchedRoute = searchParams.get('matchedRoute')
    if (preMatchedRoute) {
      setMatchedRouteName(preMatchedRoute)
      setRouteMatchResult({ matched: true, routeName: preMatchedRoute, message: `Route matched: ${preMatchedRoute}` })
    }

    const stopsParam = searchParams.get('stops')
    if (stopsParam) {
      try {
        const stops = JSON.parse(stopsParam)
        setMultiCityStops(stops)
        // Initialize empty vehicle selection for each trip
        const initialSelection = {}
        stops.forEach((_, index) => {
          initialSelection[index] = null
        })
        setSelectedVehiclesPerTrip(initialSelection)
      } catch (e) {
        console.error('Error parsing stops:', e)
      }
    }

    // Load cached selection
    const cachedSelection = loadSelectionFromCache()
    if (cachedSelection) {
      if (cachedSelection.selectedVehicle) {
        setSelectedVehicle(cachedSelection.selectedVehicle)
      }
      if (cachedSelection.selectedVehiclesPerTrip) {
        setSelectedVehiclesPerTrip(cachedSelection.selectedVehiclesPerTrip)
      }
      if (cachedSelection.activeTrip !== undefined) {
        setActiveTrip(cachedSelection.activeTrip)
      }
    }

    setIsInitialized(true)
  }, [searchParams])

  // Fetch pricing data from Firestore
  useEffect(() => {
    const loadPricingData = async () => {
      try {
        const [prices, markups] = await Promise.all([
          fetchRouteCostPrices(),
          fetchRouteMarkups()
        ])
        setCostPrices(prices)
        setRouteMarkups(markups)
        setPricingLoaded(true)
      } catch (error) {
        console.error('Error loading pricing data:', error)
        setPricingLoaded(true) // Still set loaded so UI doesn't hang
      }
    }
    loadPricingData()
  }, [])

  // Route matching - auto-match from/to locations to predefined routes
  useEffect(() => {
    if (!fromLocation || !toLocation) return
    if (tripType === 'multi-city') return // Multi-city handled per-stop
    // Skip auto-matching if we already have a pre-matched route from search page
    if (searchParams.get('matchedRoute')) return

    const doMatch = async () => {
      // Strategy 1: Try matching against admin-configured routes (using Google Maps keywords)
      // Admin stores Google Maps addresses in fromPlaceholder/toPlaceholder for perfect matching
      try {
        const adminMatch = await matchAdminRoute(fromLocation, toLocation)
        if (adminMatch.matched) {
          setMatchedRouteName(adminMatch.routeName)
          setRouteMatchResult({ matched: true, routeName: adminMatch.routeName, message: `Admin route matched: ${adminMatch.routeName}` })
          console.log('Admin route matched:', adminMatch.routeName)
          return // Admin match found, no need for coordinate-based matching
        }
      } catch (err) {
        console.error('Admin route matching failed:', err)
      }

      // Strategy 2: Fall back to coordinate-based zone matching (routeMatcher.js)
      let fCoords = fromCoords
      let tCoords = toCoords

      // If no coords from URL, try geocoding (fallback)
      if ((!fCoords || !tCoords) && isLoaded && window.google) {
        try {
          const geocoder = new window.google.maps.Geocoder()
          if (!fCoords) {
            const fResult = await new Promise((resolve, reject) => {
              geocoder.geocode({ address: fromLocation }, (results, status) => {
                if (status === 'OK' && results[0]) {
                  resolve({ lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() })
                } else reject(new Error('Geocoding failed'))
              })
            })
            fCoords = fResult
            setFromCoords(fCoords)
          }
          if (!tCoords) {
            const tResult = await new Promise((resolve, reject) => {
              geocoder.geocode({ address: toLocation }, (results, status) => {
                if (status === 'OK' && results[0]) {
                  resolve({ lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() })
                } else reject(new Error('Geocoding failed'))
              })
            })
            tCoords = tResult
            setToCoords(tCoords)
          }
        } catch (err) {
          console.error('Geocoding for route matching failed:', err)
        }
      }

      // Run coordinate-based route matcher
      const result = matchRoute(fCoords, tCoords, fromLocation, toLocation)
      setRouteMatchResult(result)

      if (result.matched) {
        setMatchedRouteName(result.routeName)
      } else {
        setMatchedRouteName(null)
        // Save unmatched route request for admin review
        saveRouteRequest(fromLocation, toLocation, fCoords, tCoords, result.nearestRoute)
      }
    }

    doMatch()
  }, [fromLocation, toLocation, fromCoords, toCoords, isLoaded, tripType])

  // Load Google Maps
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')

      if (window.google && window.google.maps) {
        setIsLoaded(true)
      } else if (!existingScript) {
        window.initGoogleMaps = () => {
          setIsLoaded(true)
          delete window.initGoogleMaps
        }

        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      } else {
        const checkLoaded = setInterval(() => {
          if (window.google && window.google.maps) {
            setIsLoaded(true)
            clearInterval(checkLoaded)
          }
        }, 100)
        setTimeout(() => clearInterval(checkLoaded), 10000)
      }
    }
  }, [])


  // Initialize map
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

  // Geocode location
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

  // Save selection to cache when it changes
  useEffect(() => {
    if (!isInitialized) return

    const selectionData = {
      selectedVehicle,
      selectedVehiclesPerTrip,
      activeTrip
    }

    // Debounce the save
    const timeoutId = setTimeout(() => {
      saveSelectionToCache(selectionData)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [isInitialized, selectedVehicle, selectedVehiclesPerTrip, activeTrip])

  // Calculate route for single trip
  useEffect(() => {
    const calculateRoute = async () => {
      if (!isLoaded || !fromLocation || !toLocation || !directionsServiceRef.current) return

      try {
        const [fromResult, toResult] = await Promise.all([
          geocodeLocation(fromLocation),
          geocodeLocation(toLocation)
        ])

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
            }
          }
        })
      } catch (error) {
        console.error('Route calculation error:', error)
      }
    }

    if (tripType !== 'multi-city') {
      calculateRoute()
    }
  }, [isLoaded, fromLocation, toLocation, tripType, geocodeLocation])


  // Calculate routes for multi-city trips
  useEffect(() => {
    const calculateMultiCityRoutes = async () => {
      if (!isLoaded || tripType !== 'multi-city' || multiCityStops.length === 0) return

      const routeInfoPromises = multiCityStops.map(async (stop, index) => {
        try {
          const [fromResult, toResult] = await Promise.all([
            geocodeLocation(stop.from),
            geocodeLocation(stop.to)
          ])

          return new Promise((resolve) => {
            directionsServiceRef.current.route({
              origin: fromResult,
              destination: toResult,
              travelMode: window.google.maps.TravelMode.DRIVING
            }, (result, status) => {
              if (status === 'OK' && result.routes[0]?.legs[0]) {
                resolve({
                  index,
                  distance: result.routes[0].legs[0].distance.text,
                  duration: result.routes[0].legs[0].duration.text,
                  fromCoords: fromResult,
                  toCoords: toResult
                })
              } else {
                resolve({ index, distance: 'N/A', duration: 'N/A' })
              }
            })
          })
        } catch (error) {
          return { index, distance: 'N/A', duration: 'N/A' }
        }
      })

      const routeInfo = await Promise.all(routeInfoPromises)
      setMultiCityRouteInfo(routeInfo)

      // Show first trip route on map
      if (routeInfo[0]?.fromCoords && routeInfo[0]?.toCoords && directionsServiceRef.current) {
        const stop = multiCityStops[0]
        if (stop) {
          try {
            const [fromResult, toResult] = await Promise.all([
              geocodeLocation(stop.from),
              geocodeLocation(stop.to)
            ])

            directionsServiceRef.current.route({
              origin: fromResult,
              destination: toResult,
              travelMode: window.google.maps.TravelMode.DRIVING
            }, (result, status) => {
              if (status === 'OK') {
                directionsRendererRef.current.setDirections(result)
              }
            })
          } catch (error) {
            console.error('Error showing first trip on map:', error)
          }
        }
      }
    }

    calculateMultiCityRoutes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, tripType, multiCityStops, geocodeLocation])

  // Show specific trip route on map
  const showTripOnMap = useCallback(async (tripIndex) => {
    if (!isLoaded || !directionsServiceRef.current || tripType !== 'multi-city') return

    const stop = multiCityStops[tripIndex]
    if (!stop) return

    try {
      const [fromResult, toResult] = await Promise.all([
        geocodeLocation(stop.from),
        geocodeLocation(stop.to)
      ])

      directionsServiceRef.current.route({
        origin: fromResult,
        destination: toResult,
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === 'OK') {
          directionsRendererRef.current.setDirections(result)
        }
      })
    } catch (error) {
      console.error('Error showing trip on map:', error)
    }
  }, [isLoaded, tripType, multiCityStops, geocodeLocation])

  // Update map when active trip changes
  useEffect(() => {
    if (tripType === 'multi-city') {
      showTripOnMap(activeTrip)
    }
  }, [activeTrip, tripType, showTripOnMap])

  // Calculate total passengers
  const getTotalPassengers = useCallback(() => adults + children, [adults, children])
  const getTotalLuggage = useCallback(() => largeBags + smallBags, [largeBags, smallBags])


  // Load vehicles with caching
  const loadVehicles = useCallback(async (reset = false) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)

    try {
      // Try to load from cache first on initial load
      if (reset && !selectedCategory) {
        const cachedVehicles = loadVehiclesFromCache()
        if (cachedVehicles && cachedVehicles.length > 0) {
          setVehicles(cachedVehicles)
          setLoading(false)
          loadingRef.current = false
          // Still fetch fresh data in background
          fetchVehicles({
            pageSize: 20,
            lastDoc: null,
            category: selectedCategory
          }).then(result => {
            setVehicles(result.vehicles)
            saveVehiclesToCache(result.vehicles)
            lastDocRef.current = result.lastDoc
            setHasMore(result.hasMore)
          }).catch(console.error)
          return
        }
      }

      const result = await fetchVehicles({
        pageSize: 20,
        lastDoc: reset ? null : lastDocRef.current,
        category: selectedCategory
      })

      if (reset) {
        setVehicles(result.vehicles)
        // Cache the initial vehicles data
        saveVehiclesToCache(result.vehicles)
      } else {
        setVehicles(prev => [...prev, ...result.vehicles])
      }
      lastDocRef.current = result.lastDoc
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('Error loading vehicles:', error)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [selectedCategory])

  // Initial load
  useEffect(() => {
    lastDocRef.current = null
    loadVehicles(true)
  }, [selectedCategory, loadVehicles])

  // Filter vehicles based on capacity and luggage
  useEffect(() => {
    const totalPassengers = getTotalPassengers()
    const totalLuggage = getTotalLuggage()

    let filtered = vehicles.filter(vehicle => {
      const capacity = parseInt(vehicle.capacity) || 4
      const luggageCapacity = parseInt(vehicle.luggageCapacity) || Math.floor(capacity / 2)
      return capacity >= totalPassengers && luggageCapacity >= totalLuggage
    })

    // Sort vehicles
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => getVehiclePrice(a) - getVehiclePrice(b))
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => getVehiclePrice(b) - getVehiclePrice(a))
    } else if (sortBy === 'capacity') {
      filtered.sort((a, b) => (parseInt(b.capacity) || 4) - (parseInt(a.capacity) || 4))
    } else {
      filtered.sort((a, b) => {
        const aDiff = Math.abs((parseInt(a.capacity) || 4) - totalPassengers)
        const bDiff = Math.abs((parseInt(b.capacity) || 4) - totalPassengers)
        return aDiff - bDiff
      })
    }

    setFilteredVehicles(filtered)
  }, [vehicles, adults, children, largeBags, smallBags, sortBy, getTotalPassengers, getTotalLuggage])

  // Infinite scroll
  useEffect(() => {
    if (!hasMore) return

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
  }, [hasMore, loadVehicles])

  const getVehiclePrice = (vehicle) => {
    // Route-based pricing: use cost price + admin markup
    if (matchedRouteName && pricingLoaded) {
      const result = getRouteBasedPrice(vehicle, matchedRouteName, costPrices, routeMarkups)
      return result.price
    }

    // Multi-city: each stop may have its own matched route (handled separately)
    // Fallback to legacy pricing if no route matched
    return getLegacyVehiclePrice(vehicle)
  }

  const getVehicleImages = (vehicle) => {
    if (Array.isArray(vehicle?.images) && vehicle.images.length > 0) {
      return vehicle.images
    }
    if (vehicle?.imageUrl) {
      return [{ id: `${vehicle?.id || 'vehicle'}-legacy`, url: vehicle.imageUrl, isPrimary: true, order: 0 }]
    }
    return [{ id: `${vehicle?.id || 'vehicle'}-fallback`, url: '/logobg.png', isPrimary: true, order: 0 }]
  }

  const getVehiclePrimaryImage = (vehicle) => {
    if (vehicle?.primaryImageUrl) return vehicle.primaryImageUrl
    const images = getVehicleImages(vehicle)
    const primary = images.find((img) => img.isPrimary) || images[0]
    return primary?.url || '/logobg.png'
  }

  const getVehicleDisplayImage = (vehicle) => {
    const images = getVehicleImages(vehicle)
    const selectedIndex = activeVehicleImageIndex[vehicle.id]
    if (Number.isInteger(selectedIndex) && images[selectedIndex]) {
      return images[selectedIndex].url
    }
    return getVehiclePrimaryImage(vehicle)
  }

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category)
    setVehicles([])
    lastDocRef.current = null
    setHasMore(true)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }


  // Handle vehicle selection for single trip (toggle on/off)
  const handleSelectVehicle = (vehicle) => {
    if (tripType === 'multi-city') {
      // For multi-city, toggle vehicle for active trip
      setSelectedVehiclesPerTrip(prev => ({
        ...prev,
        [activeTrip]: prev[activeTrip]?.id === vehicle.id ? null : vehicle
      }))
    } else {
      // Toggle selection - if same vehicle clicked, unselect it
      setSelectedVehicle(prev => prev?.id === vehicle.id ? null : vehicle)
    }
  }

  // Check if all trips have vehicles selected (for multi-city)
  const allTripsHaveVehicles = () => {
    if (tripType !== 'multi-city') return selectedVehicle !== null
    return multiCityStops.every((_, index) => selectedVehiclesPerTrip[index] !== null)
  }

  // Get total price for all trips
  const getTotalPrice = () => {
    if (tripType !== 'multi-city') {
      return selectedVehicle ? getVehiclePrice(selectedVehicle) : 0
    }
    return Object.values(selectedVehiclesPerTrip).reduce((total, vehicle) => {
      return total + (vehicle ? getVehiclePrice(vehicle) : 0)
    }, 0)
  }

  // Count selected vehicles for multi-city
  const getSelectedVehiclesCount = () => {
    return Object.values(selectedVehiclesPerTrip).filter(v => v !== null).length
  }

  const handleProceedToBooking = () => {
    if (!allTripsHaveVehicles()) {
      if (tripType === 'multi-city') {
        alert('Please select a vehicle for each trip')
      } else {
        alert('Please select a vehicle first')
      }
      return
    }

    setIsProceedingToBooking(true)

    // Build booking URL with all details
    const params = new URLSearchParams()
    params.set('tripType', tripType)
    params.set('adults', adults.toString())
    params.set('children', children.toString())
    params.set('infants', infants.toString())
    params.set('largeBags', largeBags.toString())
    params.set('smallBags', smallBags.toString())

    if (tripType === 'multi-city') {
      // Include vehicle selection for each trip
      const stopsWithVehicles = multiCityStops.map((stop, index) => ({
        ...stop,
        vehicleId: selectedVehiclesPerTrip[index]?.id,
        vehicleName: selectedVehiclesPerTrip[index]?.vehicleTypeName || selectedVehiclesPerTrip[index]?.name,
        vehiclePrice: selectedVehiclesPerTrip[index] ? getVehiclePrice(selectedVehiclesPerTrip[index]) : 0,
        routeInfo: multiCityRouteInfo[index] || {}
      }))
      params.set('stops', JSON.stringify(stopsWithVehicles))
      params.set('totalPrice', getTotalPrice().toString())
    } else {
      params.set('vehicleId', selectedVehicle.id)
      params.set('from', fromLocation)
      params.set('to', toLocation)
      params.set('departureDate', departureDate)
      params.set('departureTime', departureTime)
      params.set('vehiclePrice', getVehiclePrice(selectedVehicle).toString())
      params.set('vehicleName', selectedVehicle.vehicleTypeName || selectedVehicle.name)
      if (getVehiclePrimaryImage(selectedVehicle)) params.set('vehicleImage', getVehiclePrimaryImage(selectedVehicle))
      if (selectedVehicle.category) params.set('vehicleCategory', selectedVehicle.category)
      if (selectedVehicle.capacity) params.set('vehicleCapacity', selectedVehicle.capacity.toString())
      if (selectedVehicle.year) params.set('vehicleYear', selectedVehicle.year.toString())
      if (selectedVehicle.ownerName) params.set('vehicleOwner', selectedVehicle.ownerName)
      if (distance) params.set('distance', distance)
      if (duration) params.set('duration', duration)
      if (matchedRouteName) params.set('matchedRoute', matchedRouteName)

      if (tripType === 'round-trip') {
        params.set('returnDate', returnDate)
        params.set('returnTime', returnTime)
      }
    }

    router.push(`/checkout?${params.toString()}`)
  }

  const handleEditSearch = () => {
    router.push('/search')
  }

  const seoRouteHeading = matchedRouteName || PREDEFINED_ROUTES[1]
  const headingRoutes = matchedRouteName
    ? [matchedRouteName, ...PREDEFINED_ROUTES.slice(0, 4)]
    : PREDEFINED_ROUTES.slice(0, 5)

  // Get currently selected vehicle for display
  const getCurrentSelectedVehicle = () => {
    if (tripType === 'multi-city') {
      return selectedVehiclesPerTrip[activeTrip]
    }
    return selectedVehicle
  }


  return (
    <div className={styles.vehiclesPage}>
      <PortalNavbar />

      {/* Trip Summary Header */}
      <section className={styles.tripSummary}>
        <div className={styles.summaryContainer}>
          <div className={styles.tripDetails}>
            <div className={styles.tripType}>
              {tripType === 'one-way' && (
                <span className={styles.typeBadge}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 16.94v-4H5.08l-.03-2.01H14V6.94l5 5z" />
                  </svg>
                  {t('oneWayTrip')}
                </span>
              )}
              {tripType === 'round-trip' && (
                <span className={styles.typeBadge}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 11l3-3-3-3v2H4v2h5v2zm6 2l-3 3 3 3v-2h5v-2h-5v-2z" />
                  </svg>
                  {t('roundTripTrip')}
                </span>
              )}
              {tripType === 'multi-city' && (
                <span className={styles.typeBadge}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 1.74.5 3.37 1.41 4.84l5.59 9.16 5.59-9.16C18.5 12.37 19 10.74 19 9c0-3.87-3.13-7-7-7z" />
                  </svg>
                  {t('multiCityTrip')} ({multiCityStops.length} {t('trips')})
                </span>
              )}
            </div>

            {tripType !== 'multi-city' ? (
              <div className={styles.routeInfo}>
                <div className={styles.locationPoint}>
                  <span className={styles.dot}></span>
                  <div>
                    <span className={styles.label}>{t('fromLabel')}</span>
                    <span className={styles.location}>{fromLocation || t('notSpecified')}</span>
                  </div>
                </div>
                <div className={styles.routeLine}>
                  {distance && <span className={styles.distanceBadge}>{distance}</span>}
                </div>
                <div className={styles.locationPoint}>
                  <span className={`${styles.dot} ${styles.destination}`}></span>
                  <div>
                    <span className={styles.label}>{t('toLabel')}</span>
                    <span className={styles.location}>{toLocation || t('notSpecified')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.multiCityInfo}>
                <p className={styles.multiCityHint}>
                  {t('selectVehicleHint')}
                </p>
              </div>
            )}

            <h2 className={styles.seoRouteHeading}>{seoRouteHeading}</h2>
          </div>

          <div className={styles.tripMeta}>
            {tripType !== 'multi-city' && (
              <div className={styles.metaItem}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                </svg>
                <span>{formatDate(departureDate)} {formatTime(departureTime)}</span>
              </div>
            )}
            {tripType === 'round-trip' && returnDate && (
              <div className={styles.metaItem}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 11l3-3-3-3v2H4v2h5v2zm6 2l-3 3 3 3v-2h5v-2h-5v-2z" />
                </svg>
                <span>{t('returnLabel')}: {formatDate(returnDate)} {formatTime(returnTime)}</span>
              </div>
            )}
            <div className={styles.metaItem}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              <span>{adults} {t('adult')}{adults !== 1 ? 's' : ''}{children > 0 ? `, ${children} ${t('child')}${children !== 1 ? 'ren' : ''}` : ''}{infants > 0 ? `, ${infants} ${t('infant')}${infants !== 1 ? 's' : ''}` : ''}</span>
            </div>
            <div className={styles.metaItem}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 6h-2V3c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v3H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 3h4v3h-4V3z" />
              </svg>
              <span>{largeBags} {t('largeBag')}, {smallBags} {t('smallBag')} {t('bag')}{getTotalLuggage() !== 1 ? 's' : ''}</span>
            </div>
            <button className={styles.editBtn} onClick={handleEditSearch}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
              {t('edit')}
            </button>
          </div>
        </div>
      </section>

      <div className={styles.seoAssistBlocks}>
        <RouteKeywordHeadings
          title="Exact Route Keywords for Vehicle Selection"
          routes={headingRoutes}
          compact
        />
      </div>


      {/* Multi-City Trip Tabs */}
      {tripType === 'multi-city' && (
        <section className={styles.tripTabs}>
          <div className={styles.tabsContainer}>
            <div className={styles.tabsHeader}>
              <h3>{t('selectVehicleForEachTrip')}</h3>
              <span className={styles.selectionProgress}>
                {getSelectedVehiclesCount()} {t('of')} {multiCityStops.length} {t('vehiclesSelected')}
              </span>
            </div>
            <div className={styles.tabsList}>
              {multiCityStops.map((stop, index) => (
                <button
                  key={index}
                  className={`${styles.tripTab} ${activeTrip === index ? styles.active : ''} ${selectedVehiclesPerTrip[index] ? styles.hasVehicle : ''}`}
                  onClick={() => setActiveTrip(index)}
                >
                  <div className={styles.tabHeader}>
                    <span className={styles.tripNumber}>{t('trip')} {index + 1}</span>
                    {selectedVehiclesPerTrip[index] && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </div>
                  <div className={styles.tabRoute}>
                    <span className={styles.tabFrom}>{stop.from?.split(',')[0] || 'From'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                    </svg>
                    <span className={styles.tabTo}>{stop.to?.split(',')[0] || 'To'}</span>
                  </div>
                  <div className={styles.tabMeta}>
                    <span>{formatDate(stop.date)}</span>
                    <span>{formatTime(stop.time)}</span>
                  </div>
                  {multiCityRouteInfo[index] && (
                    <div className={styles.tabDistance}>
                      {multiCityRouteInfo[index].distance} • {multiCityRouteInfo[index].duration}
                    </div>
                  )}
                  {selectedVehiclesPerTrip[index] && (
                    <div className={styles.selectedVehiclePreview}>
                      <Image
                        src={getVehiclePrimaryImage(selectedVehiclesPerTrip[index])}
                        alt={`${stop.from?.split(',')[0] || 'Pickup'} to ${stop.to?.split(',')[0] || 'Drop-off'} taxi vehicle preview`}
                        width={60}
                        height={40}
                        style={{ objectFit: 'cover' }}
                        onError={(e) => { e.target.src = '/logobg.png' }}
                      />
                      <span>{selectedVehiclesPerTrip[index].vehicleTypeName || selectedVehiclesPerTrip[index].name}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className={styles.mainContent}>
        <div className={styles.contentContainer}>
          {/* Vehicles List */}
          <div className={styles.vehiclesPanel}>
            <div className={styles.vehiclesHeader}>
              {/* Route Match Status Banner */}
              {routeMatchResult && tripType !== 'multi-city' && (
                <div className={`${styles.routeMatchBanner} ${routeMatchResult.matched ? styles.matched : styles.unmatched}`}>
                  {routeMatchResult.matched ? (
                    <div className={styles.routeMatchContent}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <div>
                        <strong>Route: {routeMatchResult.routeName}</strong>
                        <span>Prices shown are for this route</span>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.routeMatchContent}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                      </svg>
                      <div>
                        <strong>Custom Route</strong>
                        <span>{routeMatchResult.nearestRoute ? `Nearest available: ${routeMatchResult.nearestRoute}` : 'This route is not in our standard routes. Contact us for a custom quote.'}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <h2>
                {tripType === 'multi-city' ? (
                  <>
                    {t('selectVehicleForTrip')} {activeTrip + 1}
                    <span className={styles.subtitle}>
                      {multiCityStops[activeTrip]?.from?.split(',')[0]} → {multiCityStops[activeTrip]?.to?.split(',')[0]}
                    </span>
                  </>
                ) : (
                  <>
                    {filteredVehicles.length} {t('vehiclesAvailable')}
                    <span className={styles.subtitle}>{t('forPassengersAndBags')} {getTotalPassengers()} {t('passenger')}{getTotalPassengers() !== 1 ? 's' : ''} & {getTotalLuggage()} {t('bag')}{getTotalLuggage() !== 1 ? 's' : ''}</span>
                  </>
                )}
              </h2>

              <div className={styles.sortDropdown}>
                <label>{t('sortBy')}:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="recommended">{t('recommended')}</option>
                  <option value="price-low">{t('priceLowToHigh')}</option>
                  <option value="price-high">{t('priceHighToLow')}</option>
                  <option value="capacity">{t('capacity')}</option>
                </select>
              </div>
            </div>

            <div className={styles.categoryFilters}>
              <span className={styles.filterLabel}>{t('vehicleType')}:</span>
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
                  {t(cat)}
                </button>
              ))}
            </div>


            <div className={styles.vehiclesList}>
              {filteredVehicles.map((vehicle) => {
                const isSelected = tripType === 'multi-city'
                  ? selectedVehiclesPerTrip[activeTrip]?.id === vehicle.id
                  : selectedVehicle?.id === vehicle.id

                return (
                  <div
                    key={vehicle.id}
                    className={`${styles.vehicleCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleSelectVehicle(vehicle)}
                  >
                    <div className={styles.vehicleImage}>
                      <Image
                        src={getVehicleDisplayImage(vehicle)}
                        alt={vehicle.vehicleTypeName || vehicle.name}
                        width={300}
                        height={200}
                        loading="lazy"
                        onError={(e) => { e.target.src = '/logobg.png' }}
                      />
                      {getVehicleImages(vehicle).length > 1 && (
                        <div className={styles.galleryThumbs} onClick={(e) => e.stopPropagation()}>
                          {getVehicleImages(vehicle).slice(0, 5).map((img, index) => (
                            <button
                              key={img.id || `${vehicle.id}-thumb-${index}`}
                              type="button"
                              className={`${styles.galleryThumb} ${getVehicleDisplayImage(vehicle) === img.url ? styles.active : ''}`}
                              onClick={() => setActiveVehicleImageIndex((prev) => ({ ...prev, [vehicle.id]: index }))}
                            >
                              <Image
                                src={img.url}
                                alt={`${vehicle.vehicleTypeName || vehicle.name} gallery image ${index + 1} for ${matchedRouteName || 'Umrah taxi route'}`}
                                width={38}
                                height={28}
                                style={{ objectFit: 'cover' }}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                      <span className={styles.categoryBadge}>{vehicle.category}</span>
                      {isSelected && (
                        <div className={styles.selectedBadge}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className={styles.vehicleContent}>
                      <div className={styles.vehicleHeader}>
                        <h3>{vehicle.vehicleTypeName || vehicle.name}</h3>
                        <div className={styles.vehicleYear}>{vehicle.year}</div>
                      </div>

                      <div className={styles.vehicleSpecs}>
                        <div className={styles.specItem}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                          <span>{vehicle.capacity} {t('seats')}</span>
                        </div>
                        <div className={styles.specItem}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17 6h-2V3c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v3H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
                          </svg>
                          <span>{vehicle.luggageCapacity || Math.floor(parseInt(vehicle.capacity) / 2)} {t('bags')}</span>
                        </div>
                        <div className={styles.specItem}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                          </svg>
                          <span>{vehicle.city}</span>
                        </div>
                      </div>

                      <div className={styles.vehicleFeatures}>
                        <span className={styles.feature}>✓ AC</span>
                        <span className={styles.feature}>✓ WiFi</span>
                        <span className={styles.feature}>✓ Water</span>
                      </div>

                      <div className={styles.vehicleFooter}>
                        <div className={styles.ownerInfo}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z" />
                          </svg>
                          <span>{vehicle.ownerName}</span>
                        </div>
                        <div className={styles.priceInfo}>
                          <span className={styles.priceLabel}>{t('price')}</span>
                          <span className={styles.priceAmount}>{formatPrice(getVehiclePrice(vehicle))}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {loading && (
                <div className={styles.loadingSpinner}>
                  <div className={styles.spinner}></div>
                  <p>{t('findingVehicles')}</p>
                </div>
              )}

              {hasMore && !loading && <div id="load-more-sentinel" style={{ height: '20px' }}></div>}

              {!loading && filteredVehicles.length === 0 && (
                <div className={styles.noVehicles}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" />
                  </svg>
                  <h3>{t('noVehiclesMatch')}</h3>
                  <p>{t('noVehiclesDesc')}</p>
                  <button onClick={handleEditSearch}>{t('modifySearch')}</button>
                </div>
              )}
            </div>
          </div>


          {/* Map & Booking Panel */}
          <div className={styles.sidePanel}>
            <div ref={mapRef} className={styles.map}></div>

            {tripType === 'multi-city' ? (
              // Multi-city booking summary
              <div className={styles.bookingPanel}>
                <div className={styles.bookingHeader}>
                  <h4>{t('bookingSummary')}</h4>
                  <span className={styles.tripCount}>{multiCityStops.length} {t('trips')}</span>
                </div>

                <div className={styles.multiCitySummary}>
                  {multiCityStops.map((stop, index) => (
                    <div key={index} className={`${styles.tripSummaryItem} ${selectedVehiclesPerTrip[index] ? styles.complete : ''}`}>
                      <div className={styles.tripSummaryHeader}>
                        <span className={styles.tripNum}>{t('trip')} {index + 1}</span>
                        {selectedVehiclesPerTrip[index] ? (
                          <span className={styles.tripStatus}>✓ {t('vehicleSelected')}</span>
                        ) : (
                          <span className={styles.tripStatusPending}>{t('selectVehicle')}</span>
                        )}
                      </div>
                      <div className={styles.tripSummaryRoute}>
                        {stop.from?.split(',')[0]} → {stop.to?.split(',')[0]}
                      </div>
                      {selectedVehiclesPerTrip[index] && (
                        <div className={styles.tripVehicleInfo}>
                          <Image
                            src={getVehiclePrimaryImage(selectedVehiclesPerTrip[index])}
                            alt={`${stop.from?.split(',')[0] || 'Pickup'} to ${stop.to?.split(',')[0] || 'Drop-off'} selected taxi vehicle`}
                            width={60}
                            height={40}
                            style={{ objectFit: 'cover' }}
                            onError={(e) => { e.target.src = '/logobg.png' }}
                          />
                          <div>
                            <span className={styles.vehicleName}>{selectedVehiclesPerTrip[index].vehicleTypeName || selectedVehiclesPerTrip[index].name}</span>
                            <span className={styles.vehiclePrice}>{formatPrice(getVehiclePrice(selectedVehiclesPerTrip[index]))}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.bookingDetails}>
                  <div className={styles.detailRow}>
                    <span>{t('totalTrips')}</span>
                    <span>{multiCityStops.length}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span>{t('vehiclesSelectedCount')}</span>
                    <span>{getSelectedVehiclesCount()} / {multiCityStops.length}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span>{t('passengers')}</span>
                    <span>{getTotalPassengers() + infants}</span>
                  </div>
                  <div className={`${styles.detailRow} ${styles.total}`}>
                    <span>{t('totalPrice')}</span>
                    <span className={styles.totalPrice}>{formatPrice(getTotalPrice())}</span>
                  </div>
                </div>

                <button
                  className={`${styles.proceedBtn} ${!allTripsHaveVehicles() ? styles.disabled : ''} ${isProceedingToBooking ? styles.loading : ''}`}
                  onClick={handleProceedToBooking}
                  disabled={!allTripsHaveVehicles() || isProceedingToBooking}
                >
                  {isProceedingToBooking ? (
                    <>
                      <span className={styles.btnSpinner}></span>
                      Loading...
                    </>
                  ) : allTripsHaveVehicles() ? (
                    <>
                      {t('proceedToBooking')}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                      </svg>
                    </>
                  ) : (
                    <>{t('selectVehiclesForAllTrips')}</>
                  )}
                </button>
              </div>
            ) : getCurrentSelectedVehicle() ? (
              // Single trip booking summary
              <div className={styles.bookingPanel}>
                <div className={styles.bookingHeader}>
                  <h4>{t('bookingSummary')}</h4>
                </div>

                <div className={styles.selectedVehicle}>
                  <Image
                    src={getVehiclePrimaryImage(getCurrentSelectedVehicle())}
                    alt={getCurrentSelectedVehicle().vehicleTypeName}
                    width={100}
                    height={70}
                    style={{ objectFit: 'cover' }}
                    onError={(e) => { e.target.src = '/logobg.png' }}
                  />
                  <div>
                    <h5>{getCurrentSelectedVehicle().vehicleTypeName || getCurrentSelectedVehicle().name}</h5>
                    <p>{getCurrentSelectedVehicle().capacity} {t('seats')} • {getCurrentSelectedVehicle().year}</p>
                  </div>
                </div>

                <div className={styles.bookingDetails}>
                  <div className={styles.detailRow}>
                    <span>{t('tripType')}</span>
                    <span>{tripType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  </div>
                  {distance && (
                    <div className={styles.detailRow}>
                      <span>{t('distance')}</span>
                      <span>{distance}</span>
                    </div>
                  )}
                  {duration && (
                    <div className={styles.detailRow}>
                      <span>{t('estDuration')}</span>
                      <span>{duration}</span>
                    </div>
                  )}
                  <div className={styles.detailRow}>
                    <span>{t('passengers')}</span>
                    <span>{getTotalPassengers() + infants}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span>{t('luggage')}</span>
                    <span>{getTotalLuggage()} {t('bags')}</span>
                  </div>
                  <div className={`${styles.detailRow} ${styles.total}`}>
                    <span>{t('totalPrice')}</span>
                    <span className={styles.totalPrice}>{formatPrice(getVehiclePrice(getCurrentSelectedVehicle()))}</span>
                  </div>
                </div>

                <button
                  className={`${styles.proceedBtn} ${isProceedingToBooking ? styles.loading : ''}`}
                  onClick={handleProceedToBooking}
                  disabled={isProceedingToBooking}
                >
                  {isProceedingToBooking ? (
                    <>
                      <span className={styles.btnSpinner}></span>
                      Loading...
                    </>
                  ) : (
                    <>
                      {t('proceedToBooking')}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className={styles.selectPrompt}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                </svg>
                <p>{t('selectVehiclePrompt')}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}


const VehiclesLoading = () => (
  <div className={styles.vehiclesPage}>
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '20px' }}>
      <div className={styles.spinner}></div>
      <p style={{ color: '#6B7280' }}>{useTranslation()('loadingVehicles')}</p>
    </div>
  </div>
)

const VehiclesPage = () => {
  return (
    <Suspense fallback={<VehiclesLoading />}>
      <VehiclesPageContent />
    </Suspense>
  )
}

export default VehiclesPage