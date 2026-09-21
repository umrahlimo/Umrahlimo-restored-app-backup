/**
 * Route Matcher Utility
 * Auto-matches user-selected Google Maps from/to locations to predefined UmrahLimo routes
 * Uses coordinate-based zone matching with keyword validation (hybrid approach)
 */

// ============ LOCATION ZONES ============
// Each zone represents a key location area in Saudi Arabia with center coords and radius
const ZONES = {
  JEDDAH_AIRPORT: {
    center: { lat: 21.6796, lng: 39.1565 },
    radius: 5000, // meters
    keywords: ['airport', 'kaia', 'jed', 'king abdulaziz', 'مطار جدة', 'مطار الملك عبدالعزيز', 'king abdul aziz international'],
    priority: 1 // Higher priority = checked first (airports before cities)
  },
  JEDDAH_CITY: {
    center: { lat: 21.5433, lng: 39.1728 },
    radius: 20000,
    keywords: ['jeddah', 'jiddah', 'جدة', 'hotel', 'فندق'],
    priority: 3
  },
  MAKKAH_HOTEL: {
    center: { lat: 21.4225, lng: 39.8262 },
    radius: 10000,
    keywords: ['makkah', 'mecca', 'مكة', 'مكه', 'haram', 'الحرم', 'hotel', 'فندق', 'kaaba'],
    priority: 2
  },
  MADINA_HOTEL: {
    center: { lat: 24.4672, lng: 39.6112 },
    radius: 10000,
    keywords: ['madina', 'madinah', 'medina', 'المدينة', 'المدينه', 'nabawi', 'النبوي', 'hotel', 'فندق'],
    priority: 2
  },
  MADINA_AIRPORT: {
    center: { lat: 24.5532, lng: 39.7051 },
    radius: 5000,
    keywords: ['madina airport', 'madinah airport', 'prince mohammad', 'med airport', 'مطار المدينة', 'prince mohammed bin abdulaziz'],
    priority: 1
  },
  TAIF_AIRPORT: {
    center: { lat: 21.4834, lng: 40.5434 },
    radius: 5000,
    keywords: ['taif airport', 'ta\'if airport', 'الطائف مطار', 'taif international'],
    priority: 1
  },
  TAIF_CITY: {
    center: { lat: 21.2703, lng: 40.4158 },
    radius: 15000,
    keywords: ['taif', 'ta\'if', 'الطائف'],
    priority: 3
  },
  MAKKAH_TRAIN: {
    center: { lat: 21.3891, lng: 39.8579 },
    radius: 3000,
    keywords: ['train', 'haramain', 'station', 'قطار', 'محطة', 'makkah train', 'mecca train', 'railway'],
    priority: 1
  },
  MADINA_TRAIN: {
    center: { lat: 24.4654, lng: 39.5684 },
    radius: 3000,
    keywords: ['train', 'haramain', 'station', 'قطار', 'محطة', 'madina train', 'madinah train', 'railway'],
    priority: 1
  },
  BADR: {
    center: { lat: 23.7781, lng: 38.7936 },
    radius: 15000,
    keywords: ['badr', 'بدر', 'badar'],
    priority: 2
  },
  WADI_JIN: {
    center: { lat: 23.9167, lng: 38.8833 },
    radius: 12000,
    keywords: ['wadi', 'jin', 'jinn', 'وادي الجن', 'valley'],
    priority: 2
  },
  MASJID_AISHA: {
    center: { lat: 21.4450, lng: 39.8260 },
    radius: 2000,
    keywords: ['aisha', 'ayesha', 'taneem', 'tan\'eem', 'عائشة', 'تنعيم', 'masjid aisha'],
    priority: 1
  },
  MASJID_JURANA: {
    center: { lat: 21.4950, lng: 39.8430 },
    radius: 3000,
    keywords: ['jurana', 'ju\'rana', 'الجعرانة', 'jiranah', 'masjid jurana'],
    priority: 1
  },
  MEEQAT: {
    center: { lat: 24.4100, lng: 39.5433 },
    radius: 5000,
    keywords: ['meeqat', 'miqat', 'ميقات', 'dhul hulaifah', 'ذو الحليفة', 'abyar ali'],
    priority: 1
  }
}

// ============ ZONE → ROUTE MAPPING TABLE ============
// Maps [fromZone → toZone] to the predefined route name
const ROUTE_MAP = {
  // Airport transfers
  'JEDDAH_AIRPORT→JEDDAH_CITY': 'Jeddah Airport to Jeddah Hotel or ViceVersa',
  'JEDDAH_CITY→JEDDAH_AIRPORT': 'Jeddah Airport to Jeddah Hotel or ViceVersa',
  'JEDDAH_AIRPORT→MAKKAH_HOTEL': 'Jeddah Airport to Makkah Hotel (Arrival)',
  'MAKKAH_HOTEL→JEDDAH_AIRPORT': 'Makkah Hotel to Jeddah Airport (Departure)',
  'JEDDAH_AIRPORT→MADINA_HOTEL': 'Jeddah Airport to Madina Hotel (Arrival)',
  'MADINA_HOTEL→JEDDAH_AIRPORT': 'Madina Hotel to Jeddah Airport (Departure)',
  'MADINA_AIRPORT→MADINA_HOTEL': 'Madina Airport to Madina Hotel or ViceVersa',
  'MADINA_HOTEL→MADINA_AIRPORT': 'Madina Airport to Madina Hotel or ViceVersa',

  // Inter-city transfers
  'MAKKAH_HOTEL→MADINA_HOTEL': 'Makkah Hotel to Madina Hotel',
  'MADINA_HOTEL→MAKKAH_HOTEL': 'Madina Hotel to Makkah Hotel',

  // Via Badr routes
  'MAKKAH_HOTEL→BADR': 'Makkah Hotel to Via Badar Madina Hotel',
  'BADR→MAKKAH_HOTEL': 'Madina Hotel to Via Badar Makkah Hotel',

  // Train station transfers
  'MAKKAH_HOTEL→MAKKAH_TRAIN': 'Makkah Hotel to Makkah Train Station or ViceVersa',
  'MAKKAH_TRAIN→MAKKAH_HOTEL': 'Makkah Hotel to Makkah Train Station or ViceVersa',
  'MADINA_HOTEL→MADINA_TRAIN': 'Madina Hotel to Madina Train Station or ViceVersa',
  'MADINA_TRAIN→MADINA_HOTEL': 'Madina Hotel to Madina Train Station or ViceVersa',

  // Taif routes
  'TAIF_AIRPORT→MAKKAH_HOTEL': 'Taif Airport to Makkah Hotel (Arrival)',
  'MAKKAH_HOTEL→TAIF_AIRPORT': 'Makkah Hotel to Taif Airport (Departure)',
  'MAKKAH_HOTEL→TAIF_CITY': 'Makkah Hotel to Taif Mazarats & Return',

  // Mazarat routes (special - within same zone or nearby)
  'MAKKAH_HOTEL→MASJID_AISHA': 'Makkah Mazarat with Masjid Aisha',
  'MASJID_AISHA→MAKKAH_HOTEL': 'Makkah Mazarat with Masjid Aisha',
  'MAKKAH_HOTEL→MASJID_JURANA': 'Makkah Mazarat with Masjid Jurana',
  'MASJID_JURANA→MAKKAH_HOTEL': 'Makkah Mazarat with Masjid Jurana',

  // Madina special routes
  'MADINA_HOTEL→BADR': 'Madina Hotel to Badr Mazarats & Return',
  'BADR→MADINA_HOTEL': 'Madina Hotel to Badr Mazarats & Return',
  'MADINA_HOTEL→WADI_JIN': 'Madina Hotel to Wadi Jin',
  'WADI_JIN→MADINA_HOTEL': 'Madina Hotel to Wadi Jin',

  // Via Meeqat
  'MADINA_HOTEL→MEEQAT': 'Madina Hotel to Madina Train Station Via Meeqat',
  'MEEQAT→MADINA_HOTEL': 'Madina Hotel to Madina Train Station Via Meeqat',
  'MEEQAT→MADINA_TRAIN': 'Madina Hotel to Madina Train Station Via Meeqat',
}

// ============ HAVERSINE DISTANCE ============
/**
 * Calculate distance between two coordinates in meters
 */
const haversineDistance = (coord1, coord2) => {
  const R = 6371000 // Earth's radius in meters
  const dLat = toRad(coord2.lat - coord1.lat)
  const dLng = toRad(coord2.lng - coord1.lng)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const toRad = (deg) => deg * (Math.PI / 180)

// ============ ZONE IDENTIFICATION ============
/**
 * Identify which zone a location falls into using coordinates + keyword fallback
 * @param {Object} coords - { lat, lng }
 * @param {string} text - Location text/address from Google Maps
 * @returns {string|null} Zone name or null
 */
const identifyZone = (coords, text) => {
  const lowerText = (text || '').toLowerCase()

  // Sort zones by priority (airports/specific landmarks first, then cities)
  const sortedZones = Object.entries(ZONES).sort((a, b) => a[1].priority - b[1].priority)

  // Strategy 1: Coordinate proximity combined with keyword validation
  // For high-priority zones (airports, train stations, specific mosques), use tight radius
  if (coords && coords.lat && coords.lng) {
    const candidatesByDistance = []

    for (const [zoneName, zone] of sortedZones) {
      const dist = haversineDistance(coords, zone.center)
      if (dist <= zone.radius) {
        candidatesByDistance.push({ zoneName, zone, distance: dist })
      }
    }

    // If we have candidates within radius, pick the best one
    if (candidatesByDistance.length > 0) {
      // Sort by priority first, then by distance
      candidatesByDistance.sort((a, b) => {
        if (a.zone.priority !== b.zone.priority) return a.zone.priority - b.zone.priority
        return a.distance - b.distance
      })

      // If the top candidate is high-priority (airport, train station, mosque), use it
      if (candidatesByDistance[0].zone.priority === 1) {
        // Validate with keywords for airports (to distinguish airport vs nearby hotel)
        const hasKeyword = candidatesByDistance[0].zone.keywords.some(kw => lowerText.includes(kw))
        if (hasKeyword) return candidatesByDistance[0].zoneName

        // If no keyword match but only one candidate, still use it if it's very close
        if (candidatesByDistance[0].distance < 2000) return candidatesByDistance[0].zoneName
      }

      // For city zones, just return the best match
      return candidatesByDistance[0].zoneName
    }
  }

  // Strategy 2: Pure keyword matching (when coords don't match any zone)
  for (const [zoneName, zone] of sortedZones) {
    const matchCount = zone.keywords.filter(kw => lowerText.includes(kw)).length
    if (matchCount >= 2) return zoneName // Require at least 2 keyword matches for confidence
  }

  // Strategy 3: Single keyword match for specific locations
  for (const [zoneName, zone] of sortedZones) {
    if (zone.priority <= 2 && zone.keywords.some(kw => lowerText.includes(kw))) {
      return zoneName
    }
  }

  return null
}

// ============ SPECIAL ROUTE DETECTION ============
/**
 * Handle special routes that can't be determined by simple zone pairs
 * (Mazarat routes where from/to are in the same general area)
 */
const detectSpecialRoute = (fromZone, toZone, fromText, toText) => {
  const fromLower = (fromText || '').toLowerCase()
  const toLower = (toText || '').toLowerCase()
  const combinedText = `${fromLower} ${toLower}`

  // Makkah/Madinah Mazarats - when both locations are in Makkah or Madina area
  if (fromZone === 'MAKKAH_HOTEL' && toZone === 'MAKKAH_HOTEL') {
    if (combinedText.includes('aisha') || combinedText.includes('taneem') || combinedText.includes('عائشة')) {
      return 'Makkah Mazarat with Masjid Aisha'
    }
    if (combinedText.includes('jurana') || combinedText.includes('الجعرانة')) {
      return 'Makkah Mazarat with Masjid Jurana'
    }
    // Generic Makkah mazarat
    if (combinedText.includes('mazarat') || combinedText.includes('مزارات') || combinedText.includes('ziyarat')) {
      return 'Makkah or Madinah Mazarats (Standard)'
    }
  }

  if (fromZone === 'MADINA_HOTEL' && toZone === 'MADINA_HOTEL') {
    if (combinedText.includes('mazarat') || combinedText.includes('مزارات') || combinedText.includes('ziyarat')) {
      return 'Makkah or Madinah Mazarats (Standard)'
    }
  }

  // Via Badr detection for Makkah↔Madina routes
  if ((fromZone === 'MAKKAH_HOTEL' && toZone === 'MADINA_HOTEL') || 
      (fromZone === 'MADINA_HOTEL' && toZone === 'MAKKAH_HOTEL')) {
    if (combinedText.includes('badr') || combinedText.includes('badar') || combinedText.includes('بدر')) {
      if (fromZone === 'MAKKAH_HOTEL') return 'Makkah Hotel to Via Badar Madina Hotel'
      return 'Madina Hotel to Via Badar Makkah Hotel'
    }
  }

  // Via Meeqat for Madina→Train
  if (fromZone === 'MADINA_HOTEL' && toZone === 'MADINA_TRAIN') {
    if (combinedText.includes('meeqat') || combinedText.includes('miqat') || combinedText.includes('ميقات')) {
      return 'Madina Hotel to Madina Train Station Via Meeqat'
    }
  }

  return null
}

// ============ FIND NEAREST ROUTE ============
/**
 * Find the nearest predefined route for unmatched locations
 */
const findNearestRoute = (fromCoords, toCoords) => {
  if (!fromCoords || !toCoords) return null

  // Define representative coords for each zone
  const zoneCoords = {}
  for (const [name, zone] of Object.entries(ZONES)) {
    zoneCoords[name] = zone.center
  }

  // Find closest zones for from and to
  let closestFromZone = null
  let closestFromDist = Infinity
  let closestToZone = null
  let closestToDist = Infinity

  for (const [name, coords] of Object.entries(zoneCoords)) {
    const fromDist = haversineDistance(fromCoords, coords)
    const toDist = haversineDistance(toCoords, coords)

    if (fromDist < closestFromDist) {
      closestFromDist = fromDist
      closestFromZone = name
    }
    if (toDist < closestToDist) {
      closestToDist = toDist
      closestToZone = name
    }
  }

  if (closestFromZone && closestToZone) {
    const key = `${closestFromZone}→${closestToZone}`
    if (ROUTE_MAP[key]) {
      return ROUTE_MAP[key]
    }
  }

  return null
}

// ============ MAIN MATCH FUNCTION ============
/**
 * Match user-selected from/to locations to a predefined route
 * 
 * @param {Object} fromCoords - { lat, lng } from Google Maps
 * @param {Object} toCoords - { lat, lng } from Google Maps
 * @param {string} fromText - Location text/address
 * @param {string} toText - Location text/address
 * @returns {Object} {
 *   matched: boolean,
 *   routeName: string|null,      // Matched route name (if matched)
 *   nearestRoute: string|null,   // Nearest route suggestion (if not matched)
 *   fromZone: string|null,       // Detected from zone
 *   toZone: string|null,         // Detected to zone
 *   message: string              // User-facing message
 * }
 */
export const matchRoute = (fromCoords, toCoords, fromText, toText) => {
  // Identify zones for both locations
  const fromZone = identifyZone(fromCoords, fromText)
  const toZone = identifyZone(toCoords, toText)

  // 1. Check for special routes first (Mazarat, Via Badr, Via Meeqat)
  if (fromZone && toZone) {
    const specialRoute = detectSpecialRoute(fromZone, toZone, fromText, toText)
    if (specialRoute) {
      return {
        matched: true,
        routeName: specialRoute,
        nearestRoute: null,
        fromZone,
        toZone,
        message: `Route matched: ${specialRoute}`
      }
    }
  }

  // 2. Standard zone pair lookup
  if (fromZone && toZone) {
    const key = `${fromZone}→${toZone}`
    const routeName = ROUTE_MAP[key]

    if (routeName) {
      return {
        matched: true,
        routeName,
        nearestRoute: null,
        fromZone,
        toZone,
        message: `Route matched: ${routeName}`
      }
    }
  }

  // 3. Not matched — find nearest route suggestion
  const nearestRoute = findNearestRoute(fromCoords, toCoords)

  return {
    matched: false,
    routeName: null,
    nearestRoute,
    fromZone,
    toZone,
    message: nearestRoute 
      ? `This route is not in our standard routes. Nearest available route: ${nearestRoute}`
      : 'This route is not in our standard service routes. Please contact us for a custom quote.'
  }
}

/**
 * Get all predefined route names
 */
export const PREDEFINED_ROUTES = [
  'Jeddah Airport to Jeddah Hotel or ViceVersa',
  'Jeddah Airport to Makkah Hotel (Arrival)',
  'Makkah Hotel to Jeddah Airport (Departure)',
  'Jeddah Airport to Madina Hotel (Arrival)',
  'Madina Hotel to Jeddah Airport (Departure)',
  'Madina Airport to Madina Hotel or ViceVersa',
  'Makkah or Madinah Mazarats (Standard)',
  'Makkah Mazarat with Masjid Aisha',
  'Makkah Mazarat with Masjid Jurana',
  'Makkah Hotel to Taif Mazarats & Return',
  'Makkah Hotel to Madina Hotel',
  'Madina Hotel to Makkah Hotel',
  'Makkah Hotel to Via Badar Madina Hotel',
  'Madina Hotel to Via Badar Makkah Hotel',
  'Madina Hotel to Badr Mazarats & Return',
  'Madina Hotel to Wadi Jin',
  'Makkah Hotel to Makkah Train Station or ViceVersa',
  'Madina Hotel to Madina Train Station or ViceVersa',
  'Madina Hotel to Madina Train Station Via Meeqat',
  'Taif Airport to Makkah Hotel (Arrival)',
  'Makkah Hotel to Taif Airport (Departure)'
]

export default matchRoute
