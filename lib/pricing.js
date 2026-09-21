 /**
 * Shared Pricing Utility
 * Centralized price calculation logic for route-based pricing with admin markup
 * Used across vehicles, booking, and checkout pages
 */

import { db } from './firebase'
import { collection, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore'

// ============ CACHE ============
let costPricesCache = null
let markupsCache = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// ============ FETCH COST PRICES ============
/**
 * Fetch all route cost prices from Firestore (routeCostPrices collection)
 * Returns: { "Camry": { "Jeddah Airport to Makkah Hotel (Arrival)": 178.88, ... }, ... }
 */
export const fetchRouteCostPrices = async () => {
  // Return cache if fresh
  if (costPricesCache && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return costPricesCache
  }

  try {
    const snapshot = await getDocs(collection(db, 'routeCostPrices'))
    const prices = {}
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      if (data.vehicleTypeName && data.prices) {
        prices[data.vehicleTypeName] = data.prices
      }
    })
    costPricesCache = prices
    cacheTimestamp = Date.now()
    return prices
  } catch (error) {
    console.error('Error fetching route cost prices:', error)
    return {}
  }
}

// ============ FETCH MARKUPS ============
/**
 * Fetch all route markups from Firestore (routeMarkups collection)
 * Returns: { "Camry": { markups: { "route": 40, ... }, globalMarkup: 40 }, ... }
 */
export const fetchRouteMarkups = async () => {
  // Return cache if fresh
  if (markupsCache && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return markupsCache
  }

  try {
    const snapshot = await getDocs(collection(db, 'routeMarkups'))
    const markups = {}
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      if (data.vehicleTypeName) {
        markups[data.vehicleTypeName] = {
          markups: data.markups || {},
          globalMarkup: data.globalMarkup || 0
        }
      }
    })
    markupsCache = markups
    return markups
  } catch (error) {
    console.error('Error fetching route markups:', error)
    return {}
  }
}

// ============ CLEAR CACHE ============
export const clearPricingCache = () => {
  costPricesCache = null
  markupsCache = null
  cacheTimestamp = 0
}

// ============ GET VEHICLE SELLING PRICE ============
/**
 * Calculate the selling price for a vehicle on a specific route
 * Uses: cost price from routeCostPrices + markup % from routeMarkups
 * 
 * @param {Object} vehicle - Vehicle object from Firestore
 * @param {string} matchedRouteName - Matched route name from routeMatcher
 * @param {Object} costPrices - All cost prices (from fetchRouteCostPrices)
 * @param {Object} markups - All markups (from fetchRouteMarkups)
 * @returns {Object} { price, costPrice, markupPercent, source }
 */
export const getRouteBasedPrice = (vehicle, matchedRouteName, costPrices, markups) => {
  const vehicleTypeName = vehicle.vehicleTypeName || vehicle.name || ''

  // 1. Try cost price from routeCostPrices (synced from portal when driver/admin sets prices)
  let costPrice = 0
  let source = 'none'

  if (matchedRouteName && costPrices[vehicleTypeName]) {
    costPrice = parseFloat(costPrices[vehicleTypeName][matchedRouteName]) || 0
    if (costPrice > 0) source = 'routeCostPrice'
  }

  // 2. Fallback: Try vehicle's own routePricing array
  if (costPrice === 0 && matchedRouteName && vehicle.routePricing?.length > 0) {
    const routeEntry = vehicle.routePricing.find(rp => rp.routeName === matchedRouteName)
    if (routeEntry) {
      costPrice = parseFloat(routeEntry.price) || 0
      if (costPrice > 0) source = 'vehicleRoutePricing'
    }
  }

  // 3. Fallback: Use pricePerDay
  if (costPrice === 0) {
    costPrice = parseFloat(vehicle.pricePerDay) || 0
    if (costPrice > 0) source = 'pricePerDay'
  }

  // 4. Get markup percentage
  let markupPercent = 0
  if (markups[vehicleTypeName]) {
    // Try route-specific markup first
    if (matchedRouteName && markups[vehicleTypeName].markups[matchedRouteName] !== undefined) {
      markupPercent = parseFloat(markups[vehicleTypeName].markups[matchedRouteName]) || 0
    } else {
      // Fall back to global markup
      markupPercent = parseFloat(markups[vehicleTypeName].globalMarkup) || 0
    }
  }

  // 5. Calculate selling price
  let sellingPrice = costPrice * (1 + markupPercent / 100)

  // 6. Apply seasonal pricing override (takes priority if set by admin)
  if (vehicle.isHajjSeason && vehicle.hajjSeasonPrice) {
    sellingPrice = parseFloat(vehicle.hajjSeasonPrice)
    source = 'hajjSeason'
  } else if (vehicle.isUmrahSeason && vehicle.umrahSeasonPrice) {
    sellingPrice = parseFloat(vehicle.umrahSeasonPrice)
    source = 'umrahSeason'
  }

  // 7. Apply discounts (from admin prices page)
  if (vehicle.discountPercent && vehicle.discountPercent > 0) {
    sellingPrice = sellingPrice * (1 - vehicle.discountPercent / 100)
  } else if (vehicle.discountAmount && vehicle.discountAmount > 0) {
    sellingPrice = sellingPrice - vehicle.discountAmount
  }

  return {
    price: Math.max(0, Math.round(sellingPrice * 100) / 100),
    costPrice: Math.round(costPrice * 100) / 100,
    markupPercent,
    source
  }
}

// ============ LEGACY FALLBACK ============
/**
 * Legacy price calculation (no route matching) - for backward compatibility
 * Used when no route is matched
 */
export const getLegacyVehiclePrice = (vehicle) => {
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

// ============ SAVE UNMATCHED ROUTE REQUEST ============
/**
 * Save an unmatched route to routeRequests collection for admin review
 */
export const saveRouteRequest = async (fromLocation, toLocation, fromCoords, toCoords, nearestRoute) => {
  try {
    await addDoc(collection(db, 'routeRequests'), {
      fromLocation,
      toLocation,
      fromCoords: fromCoords || null,
      toCoords: toCoords || null,
      nearestRoute: nearestRoute || null,
      status: 'pending',
      createdAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error saving route request:', error)
  }
}
