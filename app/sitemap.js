// app/sitemap.js — Next.js App Router sitemap
// Auto-served at /sitemap.xml after deploy

import { TRANSFER_ROUTES } from '../lib/transferRoutes'

const BASE_URL = 'https://www.umrahlimo.com'

// All valid airport-guide slugs that have real guide data
const AIRPORT_GUIDE_SLUGS = ['jed', 'med', 'ruh', 'isb', 'lhe', 'khi', 'lhr', 'bkk', 'dps', 'cun', 'rak', 'ams', 'jfk', 'znz']


// City pages
const CITY_SLUGS = ['makkah', 'madinah', 'jeddah', 'riyadh', 'taif', 'islamabad', 'lahore', 'karachi']

// Airport pages
const AIRPORT_SLUGS = ['jed', 'med', 'ruh', 'tif', 'isb', 'lhe', 'khi', 'lhr']

// Blog slugs — add new ones here as you publish
const BLOG_SLUGS = [
  'umrah-hajj-airport-transfer-guide',
  'how-to-save-money-on-airport-transfers',
  'airport-transfer-vs-taxi-which-is-better',
  'traveling-with-children-airport-transfer-tips',
  'business-travel-airport-transfer-guide',
  'jeddah-airport-transfer-guide',
]

export default function sitemap() {
  const now = new Date().toISOString()

  // Static core pages
  const staticPages = [
    { url: BASE_URL,                     lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/booking`,        lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/transfer`,       lastModified: now, changeFrequency: 'weekly',  priority: 0.95 },
    { url: `${BASE_URL}/airport-guides`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/popular-routes`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/blog`,          lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/login`,          lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/signup`,         lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]

  // Airport guide pages
  const airportGuidePages = AIRPORT_GUIDE_SLUGS.map((slug) => ({
    url: `${BASE_URL}/airport-guides/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  // Static SEO transfer route pages
  const transferPages = TRANSFER_ROUTES.map((route) => ({
    url: `${BASE_URL}/transfer/${route.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: route.featured ? 0.9 : 0.75,
  }))

  // City pages
  const cityPages = CITY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/city/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  // Airport pages (SEO landing pages)
  const airportPages = AIRPORT_SLUGS.map((slug) => ({
    url: `${BASE_URL}/airport/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  // Blog article pages
  const blogPages = BLOG_SLUGS.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [
    ...staticPages,
    ...airportGuidePages,
    ...transferPages,
    ...cityPages,
    ...airportPages,
    ...blogPages,
  ]
}
