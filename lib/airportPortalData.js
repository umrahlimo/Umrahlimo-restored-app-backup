const buildSearchHref = (from, to) => `/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`

const routeItem = (airportName, destination, searches, suppliers, price, detail) => ({
  label: destination,
  href: buildSearchHref(airportName, destination),
  searches,
  suppliers,
  price,
  detail,
})

const guideRoute = (airportName, destination, detail) => ({
  label: destination,
  href: buildSearchHref(airportName, destination),
  detail,
})

const createGuide = ({
  slug,
  code,
  airportName,
  city,
  country,
  region,
  summary,
  overview,
  facts,
  routes,
  tips,
}) => ({
  slug,
  code,
  airportName,
  city,
  country,
  region,
  summary,
  overview,
  facts,
  routes: routes.map((route) => {
    if (Array.isArray(route)) {
      const [destination, detail, href] = route
      if (href) return { label: destination, href, detail }
      return guideRoute(airportName, destination, detail)
    }
    return route
  }),
  tips,
})

export const PORTAL_FOOTER_COLUMNS = [
  {
    title: 'Quick Links',
    links: [
      { label: 'Search Transfers', href: '/' },
      { label: 'Transfer Routes', href: '/transfer' },
      { label: 'Popular Routes', href: '/popular-routes' },
      { label: 'Airport Guides', href: '/airport-guides' },
      { label: 'Travel Tips', href: '/travel-tips' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'FAQs', href: '/faq' },
      { label: 'Manage Booking', href: '/manage-booking' },
      { label: 'Support', href: '/support' },
    ],
  },
  {
    title: 'My Account',
    links: [{ label: 'My Bookings', href: '/customer/login' }],
  },
  {
    title: 'Portals',
    links: [
      { label: 'Operator Login', href: '/supplier/login' },
      { label: 'Partner Login', href: '/partners/login' },
      { label: 'Join as Operator', href: '/join-as-operator' },
      { label: 'Distribution Partners', href: '/partners' },
    ],
  },
]

export const GUIDE_SITUATIONS = [
  {
    step: '01',
    title: 'I land late at night',
    text: 'Check what still runs after midnight, how safe the pickup flow feels, and whether a pre-booked ride removes the stress.',
  },
  {
    step: '02',
    title: 'First time in this city',
    text: 'Start with the arrival flow, the common mistakes, and the fastest way to get from the terminal to your hotel.',
  },
  {
    step: '03',
    title: 'Traveling with family or luggage',
    text: 'Pick the ride that works for child seats, checked bags, and a smoother door-to-door handoff.',
  },
  {
    step: '04',
    title: 'I want a fixed price',
    text: 'Compare taxi rank risk against a pre-booked transfer when you do not want meter surprises or last-minute haggling.',
  },
]

export const GUIDE_FLOW_STEPS = [
  {
    step: '01',
    title: 'Exit arrivals',
    text: 'Follow the terminal signs, collect your bags, and confirm the pickup point before you head outside.',
  },
  {
    step: '02',
    title: 'Choose transport',
    text: 'Compare the taxi rank, local rail, and a pre-booked transfer based on your route, luggage, and arrival time.',
  },
  {
    step: '03',
    title: 'Meet your driver',
    text: 'A pre-booked driver should already know the flight status and terminal flow, which keeps the handoff simple.',
  },
]

export const MOST_SEARCHED_TRANSFERS = [
  { label: 'Jeddah Airport → Makkah',          price: 'SAR 150', href: buildSearchHref('Jeddah King Abdulaziz Airport', 'Makkah') },
  { label: 'Jeddah Airport → Madinah',          price: 'SAR 400', href: buildSearchHref('Jeddah King Abdulaziz Airport', 'Madinah') },
  { label: 'Madinah Airport → Makkah',          price: 'SAR 350', href: buildSearchHref('Prince Mohammad bin Abdulaziz Airport', 'Makkah') },
  { label: 'Makkah → Madinah',                  price: 'SAR 350', href: buildSearchHref('Makkah', 'Madinah') },
  { label: 'Jeddah Airport → Jeddah Corniche',  price: 'SAR 100', href: buildSearchHref('Jeddah King Abdulaziz Airport', 'Jeddah Corniche') },
  { label: 'Riyadh Airport → Riyadh City',      price: 'SAR 120', href: buildSearchHref('King Khalid International Airport', 'Riyadh City Center') },
  { label: 'Taif Airport → Makkah',             price: 'SAR 200', href: buildSearchHref('Taif Airport', 'Makkah') },
  { label: 'Islamabad Airport → F-7 Markaz',    price: 'PKR 2500', href: buildSearchHref('Islamabad International Airport', 'F-7 Markaz') },
  { label: 'Lahore Airport → Gulberg',          price: 'PKR 1800', href: buildSearchHref('Lahore Allama Iqbal Airport', 'Gulberg') },
  { label: 'Karachi Airport → Clifton',         price: 'PKR 2000', href: buildSearchHref('Karachi Jinnah Airport', 'Clifton') },
  { label: 'London Heathrow → Central London',  price: 'GBP 65',  href: buildSearchHref('London Heathrow Airport', 'Central London') },
  { label: 'London Heathrow → Canary Wharf',    price: 'GBP 70',  href: buildSearchHref('London Heathrow Airport', 'Canary Wharf') },
]


export const AIRPORT_GUIDE_REGIONS = [
  {
    title: 'Europe',
    description: 'Big-city gateways where train links, fixed taxis, and short hotel hops make planning easier.',
    slugs: ['ist', 'lhr', 'ams'],
  },
  {
    title: 'Middle East',
    description: 'Useful when the airport is large, the weather is warm, and the airport-to-city gap matters.',
    slugs: ['dxb', 'jed', 'med', 'rak'],
  },
  {
    title: 'Asia',
    description: 'Traffic, island distances, and late arrivals are the main reasons travelers pre-book here.',
    slugs: ['bkk', 'dps'],
  },
  {
    title: 'Americas',
    description: 'Resort and city transfers with mixed rail, taxi, and door-to-door options.',
    slugs: ['cun', 'jfk'],
  },
  {
    title: 'Africa',
    description: 'Island and city arrivals where the right transfer saves time and removes guesswork.',
    slugs: ['znz'],
  },
]

export const POPULAR_ROUTE_SECTIONS = [
  {
    code: 'JED',
    airportName: 'Jeddah King Abdulaziz International Airport',
    city: 'Jeddah, Saudi Arabia',
    trend: '200+ searches this month',
    summary: 'The primary gateway for Umrah and Hajj pilgrims. Most travelers continue to Makkah or Madinah after landing, making pre-booking essential.',
    routes: [
      routeItem('Jeddah King Abdulaziz Airport', 'Makkah', '90+ searches', '12 suppliers', 'SAR 150', 'Holy city – Umrah destination'),
      routeItem('Jeddah King Abdulaziz Airport', 'Madinah', '55+ searches', '8 suppliers', 'SAR 400', 'Prophet\'s city – Ziyarah'),
      routeItem('Jeddah King Abdulaziz Airport', 'Jeddah Corniche', '30+ searches', '10 suppliers', 'SAR 100', 'Waterfront hotels'),
      routeItem('Jeddah King Abdulaziz Airport', 'Al Aziziyah', '20+ searches', '7 suppliers', 'SAR 130', 'Near Makkah area'),
      routeItem('Jeddah King Abdulaziz Airport', 'North Obhur', '15+ searches', '6 suppliers', 'SAR 120', 'Resort beach area'),
      routeItem('Jeddah King Abdulaziz Airport', 'Tahlia Street', '10+ searches', '5 suppliers', 'SAR 90', 'City center shopping'),
    ],
  },
  {
    code: 'MED',
    airportName: 'Prince Mohammad bin Abdulaziz Airport',
    city: 'Madinah, Saudi Arabia',
    trend: '150+ searches this month',
    summary: 'Madinah is the City of the Prophet (PBUH). Pilgrims arriving here need reliable, respectful transport to their hotels near Al-Masjid an-Nabawi.',
    routes: [
      routeItem('Prince Mohammad bin Abdulaziz Airport', 'Madinah Haram Area', '70+ searches', '10 suppliers', 'SAR 80', 'Near Al-Masjid an-Nabawi'),
      routeItem('Prince Mohammad bin Abdulaziz Airport', 'Makkah', '40+ searches', '8 suppliers', 'SAR 350', 'Onward Umrah journey'),
      routeItem('Prince Mohammad bin Abdulaziz Airport', 'Madinah City Center', '25+ searches', '9 suppliers', 'SAR 60', 'Central hotel zone'),
      routeItem('Prince Mohammad bin Abdulaziz Airport', 'Quba Area', '15+ searches', '6 suppliers', 'SAR 70', 'Religious sites area'),
      routeItem('Prince Mohammad bin Abdulaziz Airport', 'Al Anbariyah', '10+ searches', '5 suppliers', 'SAR 65', 'Hotel district'),
      routeItem('Prince Mohammad bin Abdulaziz Airport', 'Madinah Industrial Area', '5+ searches', '3 suppliers', 'SAR 55', 'Business district'),
    ],
  },
  {
    code: 'ISB',
    airportName: 'New Islamabad International Airport',
    city: 'Islamabad, Pakistan',
    trend: '80+ searches this month',
    summary: 'Pakistan\'s modern capital airport serving Islamabad and Rawalpindi with professional transfers to hotels, embassies, and residential areas.',
    routes: [
      routeItem('Islamabad International Airport', 'F-7 Markaz', '25+ searches', '8 suppliers', 'PKR 2500', 'Commercial & hotel zone'),
      routeItem('Islamabad International Airport', 'Blue Area', '20+ searches', '6 suppliers', 'PKR 2200', 'Business district'),
      routeItem('Islamabad International Airport', 'Rawalpindi Saddar', '18+ searches', '7 suppliers', 'PKR 1800', 'City center twin'),
      routeItem('Islamabad International Airport', 'DHA Islamabad', '15+ searches', '5 suppliers', 'PKR 2800', 'Residential area'),
      routeItem('Islamabad International Airport', 'Bahria Town', '10+ searches', '4 suppliers', 'PKR 3000', 'Gated community'),
      routeItem('Islamabad International Airport', 'Murree', '5+ searches', '3 suppliers', 'PKR 5000', 'Hill station route'),
    ],
  },
  {
    code: 'RUH',
    airportName: 'King Khalid International Airport',
    city: 'Riyadh, Saudi Arabia',
    trend: '50+ searches this month',
    summary: 'Saudi Arabia\'s capital airport. Business travelers and families heading to Riyadh\'s hotel districts and corporate zones.',
    routes: [
      routeItem('King Khalid International Airport', 'Riyadh City Center', '20+ searches', '8 suppliers', 'SAR 120', 'Central hotel and business zone'),
      routeItem('King Khalid International Airport', 'King Fahd District', '12+ searches', '6 suppliers', 'SAR 100', 'Business district'),
      routeItem('King Khalid International Airport', 'Al Olaya', '10+ searches', '5 suppliers', 'SAR 110', 'Upscale hotel area'),
      routeItem('King Khalid International Airport', 'Al Malaz', '8+ searches', '4 suppliers', 'SAR 90', 'Central residential area'),
      routeItem('King Khalid International Airport', 'Diriyah', '5+ searches', '3 suppliers', 'SAR 130', 'UNESCO heritage site area'),
    ],
  },
]


export const AIRPORT_GUIDES = [
  createGuide({
    slug: 'ist',
    code: 'IST',
    airportName: 'Istanbul Airport',
    city: 'Istanbul',
    country: 'Turkey',
    region: 'Europe',
    summary: 'Three terminals, bridge traffic, and a wide spread of city districts make this one of the most planning-sensitive arrivals.',
    overview:
      'Istanbul Airport is a huge gateway. The best transfer depends on where you are staying, whether you are crossing the Bosphorus, and how late you land.',
    facts: [
      { label: 'Best for', value: 'Sultanahmet, Taksim, Besiktas' },
      { label: 'Main concern', value: 'Rush-hour traffic to the city' },
      { label: 'Transfer style', value: 'Fixed price or meet and greet' },
      { label: 'Timing tip', value: 'Add a buffer for evening arrivals' },
    ],
    routes: [
      ['Sultanahmet', 'Historic old city'],
      ['Taksim', 'Central hotel zone'],
      ['Besiktas', 'Bosphorus hotels'],
      ['Fatih', 'Historic peninsula'],
    ],
    tips: [
      'Check whether your hotel is on the European or Asian side before choosing the vehicle.',
      'Evening arrivals are more sensitive to traffic than the airport distance suggests.',
      'A fixed-price transfer is easiest when you do not want to think about the meter.',
    ],
  }),
  createGuide({
    slug: 'lhr',
    code: 'LHR',
    airportName: 'London Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    region: 'Europe',
    summary: 'London is a postcode decision as much as an airport decision. Heathrow transport depends on the area you are heading to.',
    overview:
      'Heathrow gives you plenty of options, but the right one depends on your destination, your luggage, and whether rail access is actually convenient for your hotel.',
    facts: [
      { label: 'Best for', value: 'Canary Wharf, Central London, Kings Cross' },
      { label: 'Main concern', value: 'City traffic and transfer time' },
      { label: 'Transfer style', value: 'Train, Tube, taxi, or private car' },
      { label: 'Timing tip', value: 'Late flights can make door-to-door easier' },
    ],
    routes: [
      ['Canary Wharf', 'Business district and hotels'],
      ['Kings Cross', 'Rail and hotel zone'],
      ['Central London', 'Core city stays'],
      ['Stratford', 'East London and rail links'],
    ],
    tips: [
      'If your hotel is near a station, compare a rail option against a door-to-door transfer.',
      'Heavy bags can change the best answer quickly, especially on multi-leg journeys.',
      'For late arrivals, having a fixed pickup arranged is usually the calmer option.',
    ],
  }),
  createGuide({
    slug: 'dxb',
    code: 'DXB',
    airportName: 'Dubai International Airport',
    city: 'Dubai',
    country: 'United Arab Emirates',
    region: 'Middle East',
    summary: 'Dubai arrivals are usually smooth, but the best transfer still depends on which hotel cluster you are heading to.',
    overview:
      'Dubai International has clear terminal flow and a wide spread of hotel districts. A pre-booked transfer keeps the airport exit quick when you land late or are traveling with family.',
    facts: [
      { label: 'Best for', value: 'Downtown Dubai, Marina, JLT, Al Barsha' },
      { label: 'Main concern', value: 'Late-night demand and destination spread' },
      { label: 'Transfer style', value: 'Private car or premium taxi' },
      { label: 'Timing tip', value: 'City distances look shorter than they feel in traffic' },
    ],
    routes: [
      ['Al Barsha', 'Popular hotel cluster'],
      ['Dubai Marina', 'Beach and lifestyle area'],
      ['JLT', 'Mixed-use district'],
      ['Downtown Dubai', 'Landmark hotel zone'],
    ],
    tips: [
      'Match the pickup to your hotel cluster rather than just the city name.',
      'If you land late, a booked ride is usually quicker than deciding at the curb.',
      'For families, look for a vehicle with easy luggage loading and enough seat space.',
    ],
  }),
  createGuide({
    slug: 'bkk',
    code: 'BKK',
    airportName: 'Bangkok Suvarnabhumi Airport',
    city: 'Bangkok',
    country: 'Thailand',
    region: 'Asia',
    summary: 'Bangkok traffic and airport distance make the arrival plan more important than the raw kilometer count.',
    overview:
      'Bangkok arrivals can look straightforward on a map, but traffic, toll roads, and the district you are staying in shape the actual journey.',
    facts: [
      { label: 'Best for', value: 'Sukhumvit, Siam, Riverside' },
      { label: 'Main concern', value: 'Traffic and toll decisions' },
      { label: 'Transfer style', value: 'Airport taxi or private transfer' },
      { label: 'Timing tip', value: 'Peak-hour arrivals take patience' },
    ],
    routes: [
      ['Sukhumvit', 'Central hotel corridor'],
      ['Siam', 'Shopping district'],
      ['Silom', 'Business and nightlife area'],
      ['Riverside', 'Waterfront hotels'],
    ],
    tips: [
      'Decide early whether you want a direct hotel drop or a rail-linked route.',
      'Toll-road decisions can change the price and the journey feel.',
      'A pre-booked ride is handy if you arrive late or with a lot of luggage.',
    ],
  }),
  createGuide({
    slug: 'dps',
    code: 'DPS',
    airportName: 'Denpasar (Bali) Airport',
    city: 'Bali',
    country: 'Indonesia',
    region: 'Asia',
    summary: 'Bali is a resort logistics problem first and an airport problem second. The transfer choice matters more than the terminal walk.',
    overview:
      'Bali travelers often care more about island traffic and resort distance than the airport itself. The smoother answer is usually the one that gets you straight to the hotel.',
    facts: [
      { label: 'Best for', value: 'Seminyak, Ubud, Canggu, Nusa Dua' },
      { label: 'Main concern', value: 'Island traffic and resort spread' },
      { label: 'Transfer style', value: 'Hotel pickup or private car' },
      { label: 'Timing tip', value: 'Short distances can still take time' },
    ],
    routes: [
      ['Seminyak', 'Beach and dining area'],
      ['Ubud', 'Inland resort base'],
      ['Canggu', 'Villa and surf zone'],
      ['Nusa Dua', 'Beach resorts and families'],
    ],
    tips: [
      'If you are staying inland, the right driver matters more than the shortest map line.',
      'Island traffic can make even a short transfer feel long after a late landing.',
      'Hotel pickup is often the simplest answer if you are arriving with kids or surf luggage.',
    ],
  }),
  createGuide({
    slug: 'cun',
    code: 'CUN',
    airportName: 'Cancun Airport',
    city: 'Cancun',
    country: 'Mexico',
    region: 'Americas',
    summary: 'Cancun is really a resort-corridor planning job, especially if you are heading beyond the immediate hotel zone.',
    overview:
      'The arrival flow in Cancun is mostly about clearing the terminal quickly and then choosing the right resort transfer without friction at the exit.',
    facts: [
      { label: 'Best for', value: 'Hotel Zone, Playa del Carmen, Tulum' },
      { label: 'Main concern', value: 'Resort distances and exit logistics' },
      { label: 'Transfer style', value: 'Shared shuttle or private car' },
      { label: 'Timing tip', value: 'Longer resort runs are worth booking ahead' },
    ],
    routes: [
      ['Hotel Zone', 'Beachfront resort strip'],
      ['Playa del Carmen', 'Longer Riviera Maya route'],
      ['Tulum', 'Long-haul resort transfer'],
      ['Puerto Morelos', 'Shorter coastal hop'],
    ],
    tips: [
      'If you are going far down the coast, pre-booking removes the uncertainty at the curb.',
      'Know your resort name before you land because the hotel zone is not the same as the city.',
      'For late arrivals, door-to-door service usually feels simpler than trying to sort transport on arrival.',
    ],
  }),
  createGuide({
    slug: 'rak',
    code: 'RAK',
    airportName: 'Marrakech Menara Airport',
    city: 'Marrakech',
    country: 'Morocco',
    region: 'Middle East',
    summary: 'Marrakech arrivals are all about the medina, hotel access, and knowing whether your stay is inside or outside the old city.',
    overview:
      'Marrakech Menara is close enough to feel simple but busy enough to reward a transfer plan, especially if your riad is deep inside the old city.',
    facts: [
      { label: 'Best for', value: 'Medina, Gueliz, Agafay, Palmeraie' },
      { label: 'Main concern', value: 'Old-city access and hotel handoff' },
      { label: 'Transfer style', value: 'Private transfer or hotel pickup' },
      { label: 'Timing tip', value: 'Riads often need a clear arrival handoff' },
    ],
    routes: [
      ['Medina', 'Historic core and riads'],
      ['Gueliz', 'Modern city center'],
      ['Agafay', 'Desert camp access'],
      ['Palmeraie', 'Resort and villa area'],
    ],
    tips: [
      'If your hotel is in the medina, check the handoff point before you land.',
      'A private transfer is often worth it when the last few minutes are the trickiest part.',
      'For a first visit, removing arrival guesswork usually improves the whole trip.',
    ],
  }),
  createGuide({
    slug: 'ams',
    code: 'AMS',
    airportName: 'Amsterdam Airport Schiphol',
    city: 'Amsterdam',
    country: 'Netherlands',
    region: 'Europe',
    summary: 'Schiphol is efficient, but the right choice still depends on whether the train, taxi, or a door-to-door transfer fits your arrival time.',
    overview:
      'Amsterdam is one of those airports where the train can be brilliant in the right circumstances and annoying in the wrong ones. The guide helps you decide quickly.',
    facts: [
      { label: 'Best for', value: 'Amsterdam City Center, Haarlem, Leiden' },
      { label: 'Main concern', value: 'Late-night rail gaps' },
      { label: 'Transfer style', value: 'Train, taxi, or private transfer' },
      { label: 'Timing tip', value: 'Night arrivals change the answer fast' },
    ],
    routes: [
      ['Amsterdam City Center', 'Central hotels and canals'],
      ['Schiphol Area', 'Airport-adjacent stays'],
      ['Haarlem', 'Short regional transfer'],
      ['Leiden', 'Nearby university city'],
    ],
    tips: [
      'When the train is not running at the right time, a direct transfer is the cleaner option.',
      'For short stays, a simple door-to-door handoff can save time and mental load.',
      'If you are carrying luggage, the easiest route is not always the cheapest one.',
    ],
  }),
  createGuide({
    slug: 'jed',
    code: 'JED',
    airportName: 'Jeddah Airport',
    city: 'Jeddah',
    country: 'Saudi Arabia',
    region: 'Middle East',
    summary:
      'JED arrivals for Umrah: Terminal 1 vs Hajj Terminal, Miqat/Ihram planning, and fixed-fare private transfers to Makkah or Madinah.',
    overview:
      'King Abdulaziz International Airport (JED) is the main gateway for pilgrims heading to Makkah (~95 km, about 1h15) or Madinah (~420 km, 4–5 hours). Most international flights use Terminal 1; seasonal Hajj/Umrah charters may use the separate Hajj Terminal several kilometres away — booking with flight tracking avoids the wrong pickup point.',
    facts: [
      { label: 'Best for', value: 'Makkah & Madinah Umrah transfers' },
      { label: 'Main concern', value: 'Wrong terminal + Miqat timing' },
      { label: 'Transfer style', value: 'Fixed-fare private car' },
      { label: 'Timing tip', value: 'Immigration can take 2+ hours in peak season' },
    ],
    routes: [
      ['Makkah Hotel', '~95 km · ~1h15 · From SAR 210', '/transfer/jeddah-airport-to-makkah'],
      ['Madinah Hotel', '~420 km · 4–5 hrs · From SAR 375', '/transfer/jeddah-airport-to-madinah'],
      ['Jeddah Corniche', 'City / waterfront stays'],
      ['All transfer routes', 'Hub of fixed-fare Umrah routes', '/transfer'],
    ],
    tips: [
      'Confirm Terminal 1 vs Hajj Terminal when you book — they are physically separate.',
      'If intending Umrah, clarify Miqat/Ihram with your scholar or tour operator before flying; our vehicles are prepared without scented products for passengers in Ihram.',
      'Keep passport and visa accessible for the Makkah checkpoint (~20 km before the city).',
      'Size up the vehicle for Zamzam and family luggage — sedans fill fast.',
    ],
  }),
  createGuide({
    slug: 'med',
    code: 'MED',
    airportName: 'Prince Mohammad bin Abdulaziz International Airport',
    city: 'Medina',
    country: 'Saudi Arabia',
    region: 'Middle East',
    summary:
      'MED is ~15 km from the Prophet\'s Mosque ﷺ (20–25 min). Short airport hops, Haram-area access at prayer times, and onward Makkah transfers via Dhul Hulayfah.',
    overview:
      'Madinah Airport is the easier arrival if your flights allow it — you avoid the long Jeddah–Madinah road. Hotel drop-offs near the Haram can require a short walk during busy Maghrib/Isha when streets close. For onward Umrah, plan the Dhul Hulayfah (Abyar Ali) Miqat stop on the Madinah → Makkah leg.',
    facts: [
      { label: 'Best for', value: 'Haram-area hotels · ~15 km' },
      { label: 'Main concern', value: 'Prayer-time vehicle access' },
      { label: 'Transfer style', value: 'Fixed-price private transfer' },
      { label: 'Timing tip', value: 'Book early in busy pilgrimage periods' },
    ],
    routes: [
      ['Madinah Hotel', '20–25 min airport hop', '/transfer/madinah-airport-to-madinah'],
      ['Makkah Hotel', 'Via Dhul Hulayfah Miqat', '/transfer/madinah-to-makkah'],
      ['Jeddah Airport', '~420 km departure buffer', '/transfer/madinah-to-jeddah-airport'],
      ['Madinah ziyarat', 'Quba, Uhud, Qiblatain', '/transfer/madinah-ziyarat-tour'],
    ],
    tips: [
      'Give the hotel name and district, not only a map pin — local access beats GPS near the Haram.',
      'If continuing to Makkah for Umrah, request a Dhul Hulayfah (Abyar Ali) stop when booking.',
      'For departures to Jeddah Airport, leave with a generous 7–8 hour buffer for the long drive.',
    ],
  }),
  createGuide({
    slug: 'jfk',
    code: 'JFK',
    airportName: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'United States',
    region: 'Americas',
    summary: 'New York is a borough-and-neighborhood decision, not just an airport decision. The best transfer depends on where you are staying.',
    overview:
      'JFK has multiple ground-transport options, but the smoothest answer changes fast if you are carrying luggage, landing late, or heading deep into Manhattan.',
    facts: [
      { label: 'Best for', value: 'Manhattan, Brooklyn, Queens' },
      { label: 'Main concern', value: 'Traffic and terminal spread' },
      { label: 'Transfer style', value: 'Taxi, rideshare, AirTrain, or private car' },
      { label: 'Timing tip', value: 'Late arrivals can make direct transfers easier' },
    ],
    routes: [
      ['Manhattan', 'Hotels and business districts'],
      ['Brooklyn', 'Local neighborhoods and stays'],
      ['Queens', 'Airport-side areas'],
      ['Long Island City', 'Popular hotel base'],
    ],
    tips: [
      'The best route to Manhattan is not always the best route to Brooklyn or Queens.',
      'If you arrive late or with family luggage, a direct car can feel much simpler.',
      'Use the neighborhood name in the booking rather than just the city.',
    ],
  }),
  createGuide({
    slug: 'znz',
    code: 'ZNZ',
    airportName: 'Zanzibar Airport',
    city: 'Zanzibar',
    country: 'Tanzania',
    region: 'Africa',
    summary: 'Zanzibar is an island logistics game where a simple pre-booked pickup can save a lot of guesswork at the terminal.',
    overview:
      'The island setting means beach resort distances, local traffic, and luggage handling all matter. The easiest answer is usually the one that gets you straight to the resort.',
    facts: [
      { label: 'Best for', value: 'Stone Town, Nungwi, Paje, Kendwa' },
      { label: 'Main concern', value: 'Island distances and resort routing' },
      { label: 'Transfer style', value: 'Hotel pickup or private car' },
      { label: 'Timing tip', value: 'Beach resorts can be further than they look' },
    ],
    routes: [
      ['Stone Town', 'Historic city stays'],
      ['Nungwi', 'North coast resorts'],
      ['Paje', 'East coast beaches'],
      ['Kendwa', 'Popular island beach zone'],
    ],
    tips: [
      'If you are heading to a beach resort, check the actual coastline direction before you book.',
      'Hotel pickup is often the least stressful choice after a long flight and island landing.',
      'A direct transfer is useful when you want to avoid negotiating on arrival.',
    ],
  }),
]

export const AIRPORT_GUIDE_LOOKUP = AIRPORT_GUIDES.reduce((lookup, guide) => {
  lookup[guide.slug] = guide
  return lookup
}, {})

export const AIRPORT_GUIDE_SLUGS = AIRPORT_GUIDES.map((guide) => ({ slug: guide.slug }))

export function getAirportGuideBySlug(slug) {
  return AIRPORT_GUIDE_LOOKUP[slug] || null
}
