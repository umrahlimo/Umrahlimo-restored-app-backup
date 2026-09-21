'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import PortalNavbar from '../components/Navbar/PortalNavbar'
import Footer from '../components/Footer/Footer'
import JsonLd from '../components/SEO/JsonLd'
import RouteKeywordHeadings from '../components/SEO/RouteKeywordHeadings'
import { db } from '../../lib/firebase'
import { PREDEFINED_ROUTES } from '../../lib/routeMatcher'
import { buildFaqSchema } from '../../lib/seo/schemas'
import styles from './blog1.module.css'
import { useTranslation } from '../../hooks/useTranslation'

/* ─────────── DATA ─────────── */

const serviceCards = [
  {
    icon: 'airplane',
    title: 'Airport Transfers with Real-Time Coordination',
    description:
      'From Jeddah to Makkah and Madinah, our chauffeurs coordinate flight schedules and terminal pickups so your arrival and departure remain stress-free. Real-time flight tracking ensures timely pickups even when flights are delayed.',
    points: [
      'Meet and greet at arrival terminal',
      'Luggage support for families & elderly',
      '24/7 dispatch monitoring & flight tracking',
      'Name-sign welcome at airport exit'
    ]
  },
  {
    icon: 'kaaba',
    title: 'Umrah and Ziyarah Chauffeur Programs',
    description:
      'Structured transport plans for pilgrims, scholars, and groups requiring safe, punctual, and respectful mobility throughout the holy cities. Our drivers understand the sacred journey and religious requirements.',
    points: [
      'Private and shared transfer options',
      'Professional multilingual drivers',
      'Flexible stop planning for Ziyarah',
      'Nusuk-compliant transportation'
    ]
  },
  {
    icon: 'building',
    title: 'Executive & Corporate Mobility',
    description:
      'Premium sedans and MPVs for business travelers and corporate clients who need comfort, reliability, and transparent service standards with latest model luxury vehicles.',
    points: [
      'Clean, modern executive fleet',
      'Transparent fare policy — no hidden costs',
      'Dedicated corporate support channel',
      'Invoice & receipt management'
    ]
  },
  {
    icon: 'family',
    title: 'Family & Group Travel',
    description:
      'Spacious SUVs and multi-seater vehicles designed for families with children, elderly members, and large groups. Child seats and wheelchair access available on request.',
    points: [
      'Child seats & booster seats available',
      'Wheelchair-accessible vehicles',
      'Extra luggage capacity for groups',
      'Door-to-door hotel transfers'
    ]
  },
  {
    icon: 'tent',
    title: 'Private Hajj Transport Service',
    description:
      'Dedicated Hajj chauffeur service providing luxury, reliability, and focus on worship instead of transport worries. Covering key routes between Makkah, Mina, Arafat, and Muzdalifah.',
    points: [
      'Air-conditioned luxury vehicles',
      'Experienced Hajj route drivers',
      'Mina to Arafat shuttle service',
      'VIP Hajj tent-to-hotel transfers'
    ]
  },
  {
    icon: 'camera',
    title: 'Tours & Sightseeing',
    description:
      'Explore the beauty and history of Saudi Arabia, Turkey, and Pakistan with our guided tour transfers. Comfortable vehicles and knowledgeable drivers who double as local guides.',
    points: [
      'Historical site visits in Madinah',
      'Istanbul cultural tour transfers',
      'Mountain & desert excursions',
      'Full-day & half-day packages'
    ]
  }
]

const blogCards = [
  {
    title: 'How to Plan a Smooth Airport Arrival in Saudi Arabia',
    excerpt:
      'A practical guide to terminal exits, communication checklists, and ideal transfer timing for first-time and repeat pilgrims arriving at King Abdulaziz International Airport.',
    image: '/blog/blog image 1.webp',
    readTime: '6 min read',
    category: 'Travel Guide',
    date: 'March 2026',
    link: 'https://blog.umrahlimo.com/jeddah-airport-transfers/'
  },
  {
    title: 'Makkah Hotel to Jeddah Airport: Timing and Route Essentials',
    excerpt:
      'Key travel windows, departure buffers, and chauffeur coordination tips to avoid stress before your international flight. Learn the optimal departure times by season.',
    image: '/blog/Makkah-Hotel-To-Jeddah-Airport-Taxi.webp',
    readTime: '5 min read',
    category: 'Route Guide',
    date: 'February 2026',
    link: 'https://blog.umrahlimo.com/posts/'
  },
  {
    title: 'Choosing the Right Vehicle for Umrah Family Transfers',
    excerpt:
      'Compare sedan, SUV, and multi-seater comfort based on luggage volume, elders, and travel duration between sacred destinations. A comprehensive vehicle selection guide.',
    image: '/blog/Banner-2025-2-1024x512.webp',
    readTime: '7 min read',
    category: 'Vehicle Guide',
    date: 'January 2026',
    link: 'https://blog.umrahlimo.com/private-car-service-for-umrah/'
  },
  {
    title: 'What is Hajj? Complete Nusuk Hajj Pilgrimage Guide',
    excerpt:
      'Millions of Muslims from all around the world gather at Makkah to perform Hajj. Learn about the rituals, preparation, and transport requirements for 2026.',
    image: '/blog/blog image 1.webp',
    readTime: '10 min read',
    category: 'Hajj Guide',
    date: 'March 2026',
    link: 'https://blog.umrahlimo.com/nusuk-hajj/'
  },
  {
    title: 'Mandatory Umrah Nusuk Transport Booking — 2026 Rules',
    excerpt:
      'For Umrah visa approval in 2026, Saudi authorities require confirmed, licensed transport via Nusuk or approved providers. Here is what you need to know.',
    image: '/blog/Makkah-Hotel-To-Jeddah-Airport-Taxi.webp',
    readTime: '4 min read',
    category: 'Regulations',
    date: 'February 2026',
    link: 'https://blog.umrahlimo.com/mandatory-umrah-nusuk-transport-booking/'
  },
  {
    title: 'Private Hajj Transport Service 2026 — Sacred Journey Transfers',
    excerpt:
      'Navigating massive crowds during Hajj 2026 can be overwhelming. Discover how a private Hajj limo service provides luxury, reliability, and focus on worship.',
    image: '/blog/Banner-2025-2-1024x512.webp',
    readTime: '8 min read',
    category: 'Hajj Transport',
    date: 'January 2026',
    link: 'https://blog.umrahlimo.com/private-hajj-transport-service-2026-comfortable-taxi-transfers-for-your-sacred-journey/'
  }
]

const popularRoutes = [
  { from: 'Jeddah Airport (JED)', to: 'Makkah Hotels', duration: '~1.5 hrs', distance: '85 km', price: 'From $45' },
  { from: 'Jeddah Airport (JED)', to: 'Madinah Hotels', duration: '~4 hrs', distance: '420 km', price: 'From $120' },
  { from: 'Makkah Hotels', to: 'Madinah Hotels', duration: '~4.5 hrs', distance: '450 km', price: 'From $130' },
  { from: 'Madinah Airport', to: 'Madinah Hotels', duration: '~30 min', distance: '15 km', price: 'From $25' },
  { from: 'Makkah Hotels', to: 'Jeddah Airport (JED)', duration: '~1.5 hrs', distance: '85 km', price: 'From $45' },
  { from: 'Istanbul Airport (IST)', to: 'Istanbul Hotels', duration: '~1 hr', distance: '50 km', price: 'From $35' }
]

const fleetData = [
  {
    name: 'Executive Sedans',
    description: 'Mercedes-Benz E-Class, BMW 5-Series, and Audi A6 for business and individual travelers. Maximum comfort with premium amenities.',
    passengers: 'Up to 3',
    luggage: '2 large bags',
    features: ['Leather seats', 'Climate control', 'WiFi', 'Water bottles']
  },
  {
    name: 'Luxury SUVs',
    description: 'GMC Yukon, Chevrolet Suburban, and Toyota Land Cruiser for families and groups needing extra space and comfort.',
    passengers: 'Up to 6',
    luggage: '4 large bags',
    features: ['Third row seating', 'Ample luggage', 'Premium AC', 'USB charging']
  },
  {
    name: 'Premium Vans & Coaches',
    description: 'Mercedes V-Class, Hyundai H1, and full-size coaches for large groups, tour parties, and corporate events.',
    passengers: 'Up to 50',
    luggage: 'Dedicated storage',
    features: ['Reclining seats', 'Entertainment', 'Luggage bay', 'Tour mic system']
  }
]

const testimonials = [
  {
    name: 'Ahmed Al-Rashid',
    location: 'Riyadh, Saudi Arabia',
    text: 'Exceptional service from pickup to drop-off. The driver was professional, knew all the routes, and the vehicle was immaculate. Made our Umrah journey truly blessed.',
    rating: 5,
    initial: 'A',
    service: 'Airport Transfer'
  },
  {
    name: 'Muhammad Hassan',
    location: 'Islamabad, Pakistan',
    text: 'Used UmrahLimo for our family\'s pilgrimage. The spacious SUV was perfect for our group. Driver spoke both Arabic and Urdu which was very helpful.',
    rating: 5,
    initial: 'M',
    service: 'Family Umrah Transfer'
  },
  {
    name: 'Fatima Abdullah',
    location: 'Istanbul, Turkey',
    text: 'Best limo service in the region! Flight was delayed by 3 hours but they tracked it and were waiting when we arrived. Professional service at its finest.',
    rating: 5,
    initial: 'F',
    service: 'Flight Tracking Pickup'
  },
  {
    name: 'Omar Yilmaz',
    location: 'Ankara, Turkey',
    text: 'Booked a private Hajj transport. The driver was incredibly patient during the long waits and knew every shortcut. Highly recommended for families.',
    rating: 5,
    initial: 'O',
    service: 'Hajj Transport'
  }
]

const timeline = [
  { year: '2015', title: 'Company Established', description: 'Launched our first chauffeur service, providing reliable and stylish airport transfers to pilgrims and travelers in Saudi Arabia.' },
  { year: '2015', title: 'Expanded Fleet', description: 'Increased our fleet size to meet growing demand, ensuring comfort and luxury for every ride across multiple cities.' },
  { year: '2018', title: 'Service Recognition', description: 'Honored with awards for outstanding customer service in the transportation industry. Expanded to Turkey operations.' },
  { year: '2022', title: 'New Service Areas', description: 'Opened operations in Pakistan and expanded our fleet with premium executive vehicles and family-size SUVs.' },
  { year: '2026', title: 'Nusuk Compliance', description: 'Became fully Nusuk-compliant for Umrah visa transportation requirements. Serving 15,000+ happy clients globally.' }
]

const faqData = [
  {
    question: 'How do I book a ride with UmrahLimo?',
    answer: 'Booking is simple! Use our search bar on the homepage to enter your pickup and drop-off locations, then select your preferred vehicle. You can also WhatsApp us at +1 (302) 401-4991 or call our 24/7 hotline for instant bookings. We confirm your booking within minutes.'
  },
  {
    question: 'What areas do you service?',
    answer: 'We operate in Saudi Arabia (Jeddah, Makkah, Madinah), Turkey (Istanbul, Ankara), and Pakistan (Islamabad, Lahore, Karachi). Our services include airport transfers, intercity travel, Umrah & Hajj pilgrimage transport, and local transportation.'
  },
  {
    question: 'Are your drivers multilingual?',
    answer: 'Yes! All our drivers are professionally trained and speak multiple languages including Arabic, English, Urdu, and Turkish. This ensures clear communication and a comfortable journey for pilgrims from different countries.'
  },
  {
    question: 'Do you provide child seats and special accommodations?',
    answer: 'Absolutely! We offer child seats, booster seats, wheelchair-accessible vehicles, and can accommodate special requests including extra luggage space, water and snacks, and stop-overs. Just mention your requirements during booking.'
  },
  {
    question: 'What is your cancellation policy?',
    answer: 'Free cancellation is available up to 24 hours before your scheduled pickup. Cancellations within 24 hours may incur a small fee. Contact our support team for any special circumstances — we are always understanding.'
  },
  {
    question: 'How do you track flights for airport pickups?',
    answer: 'We use real-time flight tracking technology. Our system monitors your flight status so if there are delays, your driver will automatically be notified and adjust their arrival time accordingly. No extra calls needed — we handle it all.'
  },
  {
    question: 'Is UmrahLimo Nusuk-compliant for Umrah visa transport?',
    answer: 'Yes! For Umrah visa approval in 2026, Saudi authorities require confirmed, licensed transport via Nusuk or approved providers. UmrahLimo is fully Nusuk-compliant — we handle registration so your visa processes smoothly.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept cash (SAR, USD, EUR, TRY, PKR), major credit & debit cards (Visa, Mastercard), bank transfers, and mobile payment apps. Corporate clients can also arrange monthly invoicing.'
  }
]

const contactItems = [
  { icon: 'phone', label: 'Phone', value: '+1 (302) 401-4991', href: 'tel:+13024014991' },
  { icon: 'email', label: 'Email', value: 'info@umrahlimo.com', href: 'mailto:info@umrahlimo.com' },
  { icon: 'chat', label: 'WhatsApp', value: '+1 (302) 401-4991', href: 'https://wa.me/13024014991' }
]

const stats = [
  { number: '15K+', label: 'Happy Clients' },
  { number: '50+', label: 'Premium Vehicles' },
  { number: '10+', label: 'Years of Service' },
  { number: '5', label: 'Countries Served' },
  { number: '24/7', label: 'Customer Support' },
  { number: '99%', label: 'On-Time Rate' }
]

const trustBadges = [
  { icon: 'shield', title: 'Licensed & Insured', desc: 'All vehicles fully licensed and insured for your safety.' },
  { icon: 'checkBadge', title: 'Nusuk Approved', desc: 'Compliant with Saudi Nusuk transportation requirements.' },
  { icon: 'globe', title: 'Global Coverage', desc: 'Operating in Saudi Arabia, Turkey, and Pakistan.' },
  { icon: 'star', title: '5-Star Rated', desc: 'Consistently rated 5 stars by thousands of pilgrims.' }
]

/* ─────────── COMPONENTS ─────────── */

function UiIcon({ name, className }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    'aria-hidden': 'true'
  }

  switch (name) {
    case 'airplane':
      return <svg {...common}><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" /></svg>
    case 'kaaba':
      return <svg {...common}><path d="M6 5.5 12 3l6 2.5V18L12 21l-6-3V5.5zm2 1.3V17l4 2 4-2V6.8l-4-1.7-4 1.7z" /><path d="M7.5 9h9v2h-9z" /></svg>
    case 'building':
      return <svg {...common}><path d="M4 21h16V3H4v18zm3-3H6v-2h1v2zm0-4H6v-2h1v2zm0-4H6V8h1v2zm4 8H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V8h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V8h2v2z" /></svg>
    case 'family':
      return <svg {...common}><path d="M16 11a3 3 0 1 0-2.99-3A3 3 0 0 0 16 11zm-8 0A2.5 2.5 0 1 0 8 6a2.5 2.5 0 0 0 0 5zm0 2c-2.67 0-8 1.34-8 4v2h10v-2c0-1.53.8-2.85 2.11-3.86C10.96 13.48 9.26 13 8 13zm8 0c-2.76 0-8 1.39-8 4.17V21h16v-3.83C24 14.39 18.76 13 16 13z" /></svg>
    case 'tent':
      return <svg {...common}><path d="M2 21h20L12 3 2 21zm10-13.5L18.6 19H13v-4h-2v4H5.4L12 7.5z" /></svg>
    case 'camera':
      return <svg {...common}><path d="M20 5h-3.2l-1.3-2H8.5L7.2 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm-8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" /></svg>
    case 'phone':
      return <svg {...common}><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02z" /></svg>
    case 'email':
      return <svg {...common}><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z" /></svg>
    case 'chat':
      return <svg {...common}><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 3v-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /></svg>
    case 'shield':
      return <svg {...common}><path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3zm0 18c-3.5-1.2-6-4.9-6-9V6.4l6-2.2 6 2.2V11c0 4.1-2.5 7.8-6 9z" /></svg>
    case 'checkBadge':
      return <svg {...common}><path d="m9 16.2-3.5-3.5L4 14.2 9 19l11-11-1.5-1.5z" /></svg>
    case 'globe':
      return <svg {...common}><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm7.9 9h-3.1a15.2 15.2 0 0 0-1.3-5A8 8 0 0 1 19.9 11zM12 4c1 1.4 1.8 3.2 2.2 5H9.8c.4-1.8 1.2-3.6 2.2-5zM4.1 13h3.1a15.2 15.2 0 0 0 1.3 5 8 8 0 0 1-4.4-5zm3.1-2H4.1a8 8 0 0 1 4.4-5 15.2 15.2 0 0 0-1.3 5zM12 20c-1-1.4-1.8-3.2-2.2-5h4.4c-.4 1.8-1.2 3.6-2.2 5zm2.7-7H9.3a13.3 13.3 0 0 1 0-2h5.4a13.3 13.3 0 0 1 0 2zm.8 5a15.2 15.2 0 0 0 1.3-5h3.1a8 8 0 0 1-4.4 5z" /></svg>
    case 'star':
      return <svg {...common}><path d="m12 2 2.9 5.9 6.6 1-4.8 4.7 1.1 6.6L12 17l-5.8 3.2 1.1-6.6L2.5 8.9l6.6-1z" /></svg>
    case 'car':
      return <svg {...common}><path d="M18.9 6A2 2 0 0 0 17 5H7a2 2 0 0 0-1.9 1L3 12v7a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-7zM7.4 7h9.2l1.4 4H6zm-.9 8A1.5 1.5 0 1 1 8 13.5 1.5 1.5 0 0 1 6.5 15zm11 0a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5z" /></svg>
    case 'book':
      return <svg {...common}><path d="M4 5a3 3 0 0 1 3-3h13v18H7a3 3 0 0 1-3-3zm3-1a1 1 0 0 0-1 1v12.2A3 3 0 0 1 7 17h11V4z" /></svg>
    case 'location':
      return <svg {...common}><path d="M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z" /></svg>
    case 'flag':
      return <svg {...common}><path d="M6 3h10l-1 3 1 3H8v12H6z" /></svg>
    case 'clock':
      return <svg {...common}><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 11h-5V7h2v4h3z" /></svg>
    case 'ruler':
      return <svg {...common}><path d="m21.7 13.3-11-11a1 1 0 0 0-1.4 0L2.3 9.3a1 1 0 0 0 0 1.4l11 11a1 1 0 0 0 1.4 0l7-7a1 1 0 0 0 0-1.4zM14 20l-2-2 1.5-1.5-1.4-1.4-1.5 1.5-1.1-1.1 1.5-1.5-1.4-1.4-1.5 1.5-1.1-1.1L9 11l-1.4-1.4-1.5 1.5-2-2 5.6-5.6L20 13.9z" /></svg>
    case 'users':
      return <svg {...common}><path d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM8 11A2.5 2.5 0 1 0 5.5 8.5 2.5 2.5 0 0 0 8 11zm0 2c-2.7 0-8 1.3-8 4v2h10v-2a3.8 3.8 0 0 1 1.9-3.3A9.6 9.6 0 0 0 8 13zm8 0c-2.8 0-8 1.4-8 4.2V21h16v-3.8C24 14.4 18.8 13 16 13z" /></svg>
    case 'luggage':
      return <svg {...common}><path d="M9 3h6v2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3zm2 2h2V5h-2zm-5 4h12V7H6zm0 2v8h12v-8z" /></svg>
    case 'calendar':
      return <svg {...common}><path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 15H5V9h14z" /><path d="M7 11h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" /></svg>
    case 'article':
      return <svg {...common}><path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm2 4v2h12V7zm0 4v2h12v-2zm0 4v2h8v-2z" /></svg>
    default:
      return null
  }
}

function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const num = parseInt(target.replace(/[^0-9]/g, ''), 10) || 0
          if (num === 0) { setCount(target); return }
          const duration = 2000
          const steps = 60
          const increment = num / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= num) { setCount(num); clearInterval(timer) }
            else setCount(Math.floor(current))
          }, duration / steps)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return (
    <span ref={ref}>
      {typeof count === 'number' ? count.toLocaleString() + suffix : count}
    </span>
  )
}

/* ─────────── MAIN PAGE ─────────── */

export default function Blog1Page() {
  const t = useTranslation()
  const [activeFaq, setActiveFaq] = useState(null)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [dynamicBlogCards, setDynamicBlogCards] = useState([])

  const toJsDate = (value) => value?.toDate?.() || null

  const getArticleSortDate = (data = {}) => (
    toJsDate(data.publishedAt) ||
    toJsDate(data.updatedAt) ||
    toJsDate(data.createdAt) ||
    new Date(0)
  )

  const mapArticleToCard = (data = {}) => {
    const publishDate = getArticleSortDate(data)
    return {
      title: data.title || 'Untitled Article',
      excerpt: data.excerpt || 'Read the full article for detailed guidance.',
      image: data.imageUrl || '/blog/Banner-2025-2-1024x512.webp',
      readTime: `${Math.max(3, Math.ceil((data.content || '').split(/\s+/).filter(Boolean).length / 220))} min read`,
      category: 'Latest Updates',
      date: publishDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      link: data.slug ? `/blog/${data.slug}` : '/blog1'
    }
  }

  useEffect(() => {
    const loadPublishedArticles = async () => {
      try {
        const articleQuery = query(
          collection(db, 'articles'),
          where('status', '==', 'published'),
          orderBy('publishedAt', 'desc'),
          limit(6)
        )
        const snapshot = await getDocs(articleQuery)
        const cards = snapshot.docs.map((item) => mapArticleToCard(item.data()))
        setDynamicBlogCards(cards)
      } catch (error) {
        console.warn('Primary article query failed, using fallback:', error)
        try {
          const fallbackQuery = query(
            collection(db, 'articles'),
            where('status', '==', 'published'),
            limit(30)
          )
          const fallbackSnapshot = await getDocs(fallbackQuery)
          const cards = fallbackSnapshot.docs
            .map((item) => item.data())
            .sort((a, b) => getArticleSortDate(b) - getArticleSortDate(a))
            .slice(0, 6)
            .map((item) => mapArticleToCard(item))
          setDynamicBlogCards(cards)
        } catch (fallbackError) {
          console.error('Error loading published articles:', fallbackError)
        }
      }
    }

    loadPublishedArticles()
  }, [])

  const visibleBlogCards = [...dynamicBlogCards, ...blogCards].filter((card, index, list) => {
    const key = (card.link || card.title || '').toLowerCase()
    return list.findIndex((item) => ((item.link || item.title || '').toLowerCase() === key)) === index
  })

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index)
  }

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email) { setSubscribed(true); setEmail('') }
  }

  return (
    <>
      <PortalNavbar />
      <JsonLd id="umrahlimo-blog1-faq-schema" data={buildFaqSchema(faqData)} />
      <main className={styles.blog1Page}>

        {/* ═══════ HERO ═══════ */}
        <section id="home" className={styles.heroSection}>
          <div className={styles.heroParticles}>
            {[...Array(12)].map((_, i) => (
              <span key={i} className={styles.particle} style={{ '--i': i }} />
            ))}
          </div>
          <div className="container">
            <div className={styles.heroCard}>
              <div className={styles.heroContent}>
                <span className={styles.heroBadge}><UiIcon name="star" className={styles.heroBadgeIcon} /> {t('bl1HeroBadge')}</span>
                <h1>{t('bl1HeroTitle')} <span className={styles.goldText}>{t('bl1HeroHighlight')}</span></h1>
                <p>{t('bl1HeroDesc')}</p>
                <div className={styles.heroStats}>
                  <div className={styles.heroStat}>
                    <strong>10+</strong>
                    <span>Years</span>
                  </div>
                  <div className={styles.heroStatDivider} />
                  <div className={styles.heroStat}>
                    <strong>50+</strong>
                    <span>Vehicles</span>
                  </div>
                  <div className={styles.heroStatDivider} />
                  <div className={styles.heroStat}>
                    <strong>5</strong>
                    <span>Countries</span>
                  </div>
                </div>
                <div className={styles.heroActions}>
                  <Link href="/search" className={styles.primaryBtn}>
                    <UiIcon name="car" className={styles.iconBtn} /> Book a Transfer
                  </Link>
                  <a href="#blog" className={styles.secondaryBtn}>
                    <UiIcon name="book" className={styles.iconBtn} /> {t('bl1ReadArticles')}
                  </a>
                  <a href="https://wa.me/13024014991" target="_blank" rel="noopener noreferrer" className={styles.whatsappBtn}>
                    <UiIcon name="chat" className={styles.iconBtn} /> {t('bl1WhatsappUs')}
                  </a>
                </div>
              </div>
              <div className={styles.heroMedia}>
                <Image
                  src="/blog/Banner-2025-2-1024x512.webp"
                  alt="Luxury airport transfer by UmrahLimo — Premium chauffeur service"
                  width={1024}
                  height={512}
                  priority
                />
                <div className={styles.heroMediaOverlay}>
                  <div className={styles.heroMediaBadge}>
                    <span>⭐ 5.0</span>
                    <small>Customer Rating</small>
                  </div>
                </div>
              </div>
            </div>

            <nav className={styles.localNav} aria-label="Blog1 sections">
              <a href="#home" className={styles.localNavActive}>Home</a>
              <a href="#about">About</a>
              <a href="#services">Services</a>
              <a href="#routes">Routes</a>
              <a href="#fleet">Fleet</a>
              <a href="#blog">Blog</a>
              <a href="#testimonials">Reviews</a>
              <a href="#faq">FAQ</a>
              <a href="#contact">Contact</a>
            </nav>
          </div>
        </section>

        {/* ═══════ TRUST BADGES ═══════ */}
        <section className={styles.trustSection}>
          <div className="container">
            <div className={styles.trustGrid}>
              {trustBadges.map((badge) => (
                <div key={badge.title} className={styles.trustItem}>
                  <span className={styles.trustIcon}><UiIcon name={badge.icon} /></span>
                  <div>
                    <strong>{badge.title}</strong>
                    <p>{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ ABOUT / TIMELINE ═══════ */}
        <section id="about" className={styles.aboutSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className={styles.kicker}>About UmrahLimo</span>
              <h2>A Journey of Excellence <span className={styles.goldText}>Since 2015</span></h2>
              <p className={styles.sectionSubtext}>
                At UmrahLimo, we specialize in providing premium chauffeur airport transfer services. Our mission
                is to ensure a seamless and comfortable travel experience for pilgrims and travelers worldwide.
                With a focus on reliability and professionalism, we are dedicated to making every journey enjoyable.
              </p>
            </div>

            <div className={styles.timeline}>
              {timeline.map((item, index) => (
                <div key={item.year} className={`${styles.timelineItem} ${index % 2 === 1 ? styles.timelineRight : ''}`}>
                  <div className={styles.timelineDot}>
                    <span>{item.year}</span>
                  </div>
                  <div className={styles.timelineContent}>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ STATS BAR ═══════ */}
        <section className={styles.statsSection}>
          <div className="container">
            <div className={styles.statsGrid}>
              {stats.map((stat) => (
                <div key={stat.label} className={styles.statItem}>
                  <div className={styles.statNumber}>{stat.number}</div>
                  <div className={styles.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ SERVICES ═══════ */}
        <section id="services" className={styles.servicesSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className={styles.kicker}>Our Premium Services</span>
              <h2>Designed for <span className={styles.goldText}>Comfort, Timing, and Trust</span></h2>
              <p className={styles.sectionSubtext}>
                Whether you&apos;re a pilgrim, business traveler, or family group, our comprehensive range of
                chauffeur services ensures comfort, punctuality, and peace of mind for every journey.
              </p>
            </div>
            <div className={styles.servicesGrid}>
              {serviceCards.map((service) => (
                <article key={service.title} className={styles.serviceCard}>
                  <div className={styles.serviceCardIcon}><UiIcon name={service.icon} /></div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <ul>
                    {service.points.map((point) => (
                      <li key={point}>
                        <span className={styles.checkIcon}>✓</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ POPULAR ROUTES ═══════ */}
        <section id="routes" className={styles.routesSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className={styles.kicker}>Popular Routes</span>
              <h2>Most Requested <span className={styles.goldText}>Transfer Routes</span></h2>
              <p className={styles.sectionSubtext}>
                Explore our most popular transfer routes across Saudi Arabia and Turkey. All prices are
                starting rates and may vary based on vehicle type, time, and group size.
              </p>
            </div>
            <RouteKeywordHeadings
              title="Exact Umrah Taxi Route Keywords"
              routes={PREDEFINED_ROUTES}
              compact
            />
            <div className={styles.routesGrid}>
              {popularRoutes.map((route, index) => (
                <div key={index} className={styles.routeCard}>
                  <div className={styles.routeHeader}>
                    <div className={styles.routePoints}>
                      <div className={styles.routeFrom}>
                        <span className={styles.routeDot}><UiIcon name="location" /></span>
                        <span>{route.from}</span>
                      </div>
                      <div className={styles.routeLine} />
                      <div className={styles.routeTo}>
                        <span className={styles.routeDot}><UiIcon name="flag" /></span>
                        <span>{route.to}</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.routeDetails}>
                    <div><UiIcon name="clock" className={styles.iconXs} /> {route.duration}</div>
                    <div><UiIcon name="ruler" className={styles.iconXs} /> {route.distance}</div>
                    <div className={styles.routePrice}>{route.price}</div>
                  </div>
                  <Link href="/search" className={styles.routeBookBtn}>Book This Route →</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ FLEET SHOWCASE ═══════ */}
        <section id="fleet" className={styles.fleetSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className={styles.kicker}>Our Luxury Fleet</span>
              <h2>Premium Vehicles for <span className={styles.goldText}>Every Journey</span></h2>
              <p className={styles.sectionSubtext}>
                Choose from our range of meticulously maintained luxury vehicles — from executive sedans
                for solo travelers to full-size coaches for large groups and pilgrim parties.
              </p>
            </div>
            <div className={styles.fleetGrid}>
              {fleetData.map((vehicle) => (
                <div key={vehicle.name} className={styles.fleetCard}>
                  <div className={styles.fleetCardHeader}>
                    <h3>{vehicle.name}</h3>
                  </div>
                  <p>{vehicle.description}</p>
                  <div className={styles.fleetMeta}>
                    <div>
                      <UiIcon name="users" className={styles.iconSm} />
                      <div>
                        <small>Passengers</small>
                        <strong>{vehicle.passengers}</strong>
                      </div>
                    </div>
                    <div>
                      <UiIcon name="luggage" className={styles.iconSm} />
                      <div>
                        <small>Luggage</small>
                        <strong>{vehicle.luggage}</strong>
                      </div>
                    </div>
                  </div>
                  <div className={styles.fleetFeatures}>
                    {vehicle.features.map((f) => (
                      <span key={f} className={styles.fleetFeatureTag}>{f}</span>
                    ))}
                  </div>
                  <Link href="/search" className={styles.primaryBtn}>{t('bl1BookNow')}</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ BLOG ARTICLES ═══════ */}
        <section id="blog" className={styles.postsSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className={styles.kicker}>Blog & Resources</span>
              <h2>Featured Customer <span className={styles.goldText}>Guidance & Articles</span></h2>
              <p className={styles.sectionSubtext}>
                Stay informed with our latest articles covering travel tips, route guides, vehicle comparisons,
                Hajj & Umrah regulations, and practical advice for seamless pilgrimage transportation.
              </p>
            </div>
            <div className={styles.postsGrid}>
              {visibleBlogCards.map((post) => (
                <article key={post.title} className={styles.postCard}>
                  <div className={styles.postImageWrap}>
                    <Image src={post.image} alt={post.title} width={1024} height={512} />
                    <span className={styles.postCategory}>{post.category}</span>
                  </div>
                  <div className={styles.postContent}>
                    <div className={styles.postMeta}>
                      <span className={styles.postReadTime}><UiIcon name="book" className={styles.iconXs} /> {post.readTime}</span>
                      <span className={styles.postDate}><UiIcon name="calendar" className={styles.iconXs} /> {post.date}</span>
                    </div>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                    {post.link?.startsWith('/') ? (
                      <Link href={post.link} className={styles.readMoreBtn}>Continue reading →</Link>
                    ) : (
                      <a href={post.link} target="_blank" rel="noopener noreferrer" className={styles.readMoreBtn}>
                        Continue reading →
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
            <div className={styles.postsViewAll}>
              <a href="https://blog.umrahlimo.com/posts/" target="_blank" rel="noopener noreferrer" className={styles.secondaryBtn}>
                <UiIcon name="article" className={styles.iconBtn} /> View All Articles
              </a>
            </div>
          </div>
        </section>

        {/* ═══════ TESTIMONIALS ═══════ */}
        <section id="testimonials" className={styles.testimonialsSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className={styles.kicker}>Client Testimonials</span>
              <h2>What Our <span className={styles.goldText}>Clients Say</span></h2>
              <p className={styles.sectionSubtext}>
                Trusted by thousands of pilgrims and travelers across the globe. Read authentic reviews
                from our valued customers.
              </p>
            </div>
            <div className={styles.testimonialsGrid}>
              {testimonials.map((t) => (
                <div key={t.name} className={styles.testimonialCard}>
                  <div className={styles.testimonialStars}>
                    {[...Array(t.rating)].map((_, i) => (
                      <UiIcon key={i} name="star" className={styles.iconSm} />
                    ))}
                  </div>
                  <p className={styles.testimonialText}>&ldquo;{t.text}&rdquo;</p>
                  <div className={styles.testimonialFooter}>
                    <div className={styles.testimonialAvatar}>{t.initial}</div>
                    <div className={styles.testimonialInfo}>
                      <strong>{t.name}</strong>
                      <span>{t.location}</span>
                      <span className={styles.testimonialService}>{t.service}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ FAQ ═══════ */}
        <section id="faq" className={styles.faqSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className={styles.kicker}>FAQ</span>
              <h2>Frequently Asked <span className={styles.goldText}>Questions</span></h2>
              <p className={styles.sectionSubtext}>
                Find answers to common questions about our services, booking process,
                cancellation policy, and more.
              </p>
            </div>
            <div className={styles.faqContainer}>
              {faqData.map((faq, index) => (
                <div
                  key={index}
                  className={`${styles.faqItem} ${activeFaq === index ? styles.faqActive : ''}`}
                >
                  <button className={styles.faqQuestion} onClick={() => toggleFaq(index)}>
                    <span className={styles.faqNumber}>{String(index + 1).padStart(2, '0')}</span>
                    <h4>{faq.question}</h4>
                    <span className={styles.faqToggle}>{activeFaq === index ? '−' : '+'}</span>
                  </button>
                  <div className={styles.faqAnswer}>
                    <div className={styles.faqAnswerContent}>
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ NEWSLETTER ═══════ */}
        <section className={styles.newsletterSection}>
          <div className="container">
            <div className={styles.newsletterCard}>
              <div className={styles.newsletterContent}>
                <span className={styles.kicker}>Stay Updated</span>
                <h2>Subscribe to Our <span className={styles.goldText}>Newsletter</span></h2>
                <p>
                  Get the latest travel tips, route guides, special offers, and important Hajj & Umrah
                  transport updates delivered straight to your inbox.
                </p>
                {subscribed ? (
                  <div className={styles.subscribedMsg}>
                    ✅ Thank you for subscribing! Check your inbox for updates.
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className={styles.newsletterForm}>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button type="submit" className={styles.primaryBtn}>Subscribe →</button>
                  </form>
                )}
                <small>By subscribing, you agree to receive newsletters from UmrahLimo. Unsubscribe anytime.</small>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ CONTACT ═══════ */}
        <section id="contact" className={styles.contactSection}>
          <div className="container">
            <div className={styles.contactCard}>
              <div>
                <span className={styles.kicker}>Contact Us</span>
                <h2>Speak with Our <span className={styles.goldText}>Transfer Desk</span></h2>
                <p>
                  Need a custom transfer plan for airport arrivals, intercity movement, Hajj logistics,
                  or family group travel? Our team is available around the clock to support your route and schedule.
                  We provide personalized assistance in Arabic, English, Urdu, and Turkish.
                </p>
                <div className={styles.contactHighlights}>
                  <div><UiIcon name="clock" className={styles.iconSm} /> <strong>24/7</strong> Support Available</div>
                  <div><UiIcon name="globe" className={styles.iconSm} /> <strong>Multi-Language</strong> Assistance</div>
                  <div><UiIcon name="article" className={styles.iconSm} /> <strong>Custom</strong> Travel Plans</div>
                </div>
                <div className={styles.contactActions}>
                  <Link href="/search" className={styles.primaryBtn}>
                    <UiIcon name="car" className={styles.iconBtn} /> {t('bl1StartBooking')}
                  </Link>
                  <a href="https://wa.me/13024014991" target="_blank" rel="noopener noreferrer" className={styles.whatsappBtn}>
                    <UiIcon name="chat" className={styles.iconBtn} /> {t('bl1WhatsappUs')}
                  </a>
                  <a href="https://blog.umrahlimo.com/" target="_blank" rel="noopener noreferrer" className={styles.secondaryBtn}>
                    <UiIcon name="book" className={styles.iconBtn} /> {t('bl1VisitBlog')}
                  </a>
                </div>
              </div>

              <div className={styles.contactList}>
                <Image
                  src="/blog/Logo-Umrahlimo-Small-golden-Black-Kaba2026-2-blog.svg"
                  alt="UmrahLimo logo"
                  width={220}
                  height={80}
                />
                {contactItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className={styles.contactLink}
                  >
                    <span className={styles.contactLinkIcon}><UiIcon name={item.icon} /></span>
                    <div>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  </a>
                ))}
                <div className={styles.contactHours}>
                  <strong><UiIcon name="clock" className={styles.iconSm} /> Operating Hours</strong>
                  <p>24 hours a day, 7 days a week</p>
                  <p>Including weekends & holidays</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
