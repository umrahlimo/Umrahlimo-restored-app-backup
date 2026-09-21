import { PREDEFINED_ROUTES } from '../routeMatcher'
import {
  TRIPADVISOR_RATING,
  TRIPADVISOR_REVIEW_COUNT,
  TRIPADVISOR_LISTING_URL,
} from '../tripAdvisor'

// ─── Constants ───────────────────────────────────────────────────────────────
const BASE_URL = 'https://www.umrahlimo.com'
const FOUNDING_YEAR = '2015'

// ─── LocalBusiness + AggregateRating ─────────────────────────────────────────
export function buildLocalBusinessSchema(routes = PREDEFINED_ROUTES) {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'TaxiService'],
    name: 'UmrahLimo',
    alternateName: 'Umrah Limo',
    url: BASE_URL,
    foundingDate: FOUNDING_YEAR,
    logo: `${BASE_URL}/logo.png`,
    image: `${BASE_URL}/Hero_Makkah.jpeg`,
    telephone: '+1-302-401-4991',
    email: 'info@umrahlimo.com',
    priceRange: '$55+',
    description:
      'UmrahLimo is a premium Umrah taxi and airport transfer service operating since 2015, providing reliable, Nusuk-compliant transport for pilgrims between Jeddah Airport, Makkah, Madinah, Taif, and Riyadh. Pay a small deposit online and pay the rest to your driver on arrival.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: "Level 26, King's Road Tower, King Abdul Aziz Road",
      addressLocality: 'Jeddah',
      postalCode: '21499',
      addressCountry: 'SA',
    },
    areaServed: [
      { '@type': 'City', name: 'Jeddah' },
      { '@type': 'City', name: 'Makkah' },
      { '@type': 'City', name: 'Madinah' },
      { '@type': 'City', name: 'Taif' },
      { '@type': 'City', name: 'Riyadh' },
    ],
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday',
      ],
      opens: '00:00',
      closes: '23:59',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: String(TRIPADVISOR_RATING),
      reviewCount: String(TRIPADVISOR_REVIEW_COUNT),
      bestRating: '5',
      worstRating: '1',
    },
    sameAs: [TRIPADVISOR_LISTING_URL],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'UmrahLimo Route Transfers',
      itemListElement: routes.map((routeName) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: routeName,
          provider: { '@type': 'Organization', name: 'UmrahLimo' },
        },
      })),
    },
  }
}

// ─── Organization (global brand entity) ──────────────────────────────────────
export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'UmrahLimo',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    foundingDate: FOUNDING_YEAR,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+1-302-401-4991',
        contactType: 'customer service',
        email: 'info@umrahlimo.com',
        availableLanguage: ['English', 'Arabic', 'Urdu'],
        contactOption: 'TollFree',
        hoursAvailable: 'Mo-Su 00:00-23:59',
        areaServed: 'US',
      },
      {
        '@type': 'ContactPoint',
        telephone: '+966-53-392-4547',
        contactType: 'customer service',
        availableLanguage: ['English', 'Arabic', 'Urdu'],
        hoursAvailable: 'Mo-Su 00:00-23:59',
        areaServed: 'SA',
      },
    ],
    sameAs: [TRIPADVISOR_LISTING_URL],
  }
}

// ─── Individual Service schemas ───────────────────────────────────────────────
export function buildServiceSchemas() {
  const provider = {
    '@type': 'Organization',
    name: 'UmrahLimo',
    url: BASE_URL,
  }

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Jeddah Airport to Makkah Transfer',
      description:
        'Private airport transfer from King Abdulaziz International Airport (JED) to Makkah hotels. Fixed price, meet & greet, Nusuk-compliant vehicles.',
      provider,
      areaServed: ['Jeddah', 'Makkah'],
      url: `${BASE_URL}/transfer/jeddah-airport-to-makkah`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Makkah to Madinah Transfer',
      description:
        'Comfortable intercity transfer from Makkah hotels to Madinah Haram area. Prayer stops included. Fixed price, no meters.',
      provider,
      areaServed: ['Makkah', 'Madinah'],
      url: `${BASE_URL}/transfer/makkah-to-madinah`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Jeddah Airport to Madinah Transfer',
      description:
        'Direct private transfer from Jeddah Airport (JED) to Madinah hotels. Fixed fares, prayer stops, flight tracking.',
      provider,
      areaServed: ['Jeddah', 'Madinah'],
      url: `${BASE_URL}/transfer/jeddah-airport-to-madinah`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Mazarat Tours (Makkah & Madinah)',
      description:
        'Guided tour transfers to sacred sites including Masjid Aisha, Masjid Jurana, Taif Mazarats, Badr, and Wadi Jinn with experienced drivers.',
      provider,
      areaServed: ['Makkah', 'Madinah', 'Taif'],
      url: `${BASE_URL}/popular-routes`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Umrah & Hajj Group Transport',
      description:
        'Group transportation for Umrah and Hajj pilgrims. Luxury vans and buses for 4 to 50+ passengers with multilingual drivers.',
      provider,
      areaServed: ['Jeddah', 'Makkah', 'Madinah'],
      url: `${BASE_URL}/popular-routes`,
    },
  ]
}

// ─── FAQPage schema ───────────────────────────────────────────────────────────
export const HOMEPAGE_FAQS = [
  {
    question: 'How do I book a transfer with UmrahLimo?',
    answer:
      'Simply use the search bar on our homepage: enter your pickup and drop-off locations, select your travel date and time, choose the right vehicle for your group, and complete the booking online in minutes. You will receive a confirmation email immediately.',
  },
  {
    question: 'Do I have to pay the full amount upfront?',
    answer:
      'No. UmrahLimo uses a deposit model — you pay a small deposit online to secure your booking, and pay the remaining balance directly to your driver in cash (or card) on the day of travel. This protects you against cancellations and gives you peace of mind.',
  },
  {
    question: 'Are UmrahLimo vehicles Nusuk-compliant?',
    answer:
      'Yes. All vehicles used for Umrah and Hajj routes are compliant with the Saudi Ministry of Hajj and Umrah (Nusuk) requirements. Our drivers hold valid permits for operating within Makkah and Madinah restricted zones.',
  },
  {
    question: 'What is the cancellation policy?',
    answer:
      'You can cancel free of charge up to 24 hours before your scheduled pickup time and receive a full refund of your deposit. Cancellations within 24 hours may be subject to a 50% charge. No-shows are non-refundable.',
  },
  {
    question: 'Does UmrahLimo track my flight?',
    answer:
      'Yes. We monitor your flight in real time. If your flight is delayed, your driver automatically adjusts the pickup time at no extra charge. You do not need to call or update us — it is handled automatically.',
  },
  {
    question: 'What languages do your drivers speak?',
    answer:
      'Most of our drivers in Saudi Arabia speak Arabic and Urdu, with many also conversant in English. We can arrange English-speaking drivers on request when you book.',
  },
  {
    question: 'How much does a Jeddah Airport to Makkah transfer cost?',
    answer:
      'Prices depend on the vehicle type and group size. UmrahLimo offers fixed prices with no hidden charges or surge pricing. Search your route on our homepage to see the exact price for your date and vehicle class.',
  },
  {
    question: 'Can UmrahLimo handle large groups and pilgrimage groups?',
    answer:
      'Absolutely. We offer vehicles from standard sedans (3 passengers) up to minibuses and coaches for 30+ passengers. Group packages are available for Umrah and Hajj groups — contact us for custom quotes.',
  },
  {
    question: 'What is meet & greet and is it included?',
    answer:
      'Meet & greet means your driver will be waiting in the arrivals hall with a name board displaying your name, so you do not need to search for them. This is included as standard with all UmrahLimo airport transfers.',
  },
  {
    question: 'Is UmrahLimo rated on TripAdvisor?',
    answer:
      'Yes. UmrahLimo is rated 4.5 out of 5 on TripAdvisor and is ranked #6 of 101 Transportation Providers in Mecca. You can read all verified traveller reviews on our TripAdvisor listing.',
  },
]

export function buildFaqSchema(faqItems = HOMEPAGE_FAQS) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

