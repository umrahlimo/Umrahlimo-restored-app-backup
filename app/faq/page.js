'use client'

import { useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import PortalNavbar from '../components/Navbar/PortalNavbar'
import Footer from '../components/Footer/Footer'
import { buildFaqSchema } from '../../lib/seo/schemas'
import { TRIPADVISOR_LISTING_URL } from '../../lib/tripAdvisor'
import styles from './faq.module.css'

/* ━━━ FAQ DATA ━━━ */
const FAQ_CATEGORIES = [
  {
    id: 'all',
    label: 'All',
    icon: null,
  },
  {
    id: 'booking',
    label: 'Booking',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'payment',
    label: 'Payment',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    id: 'transfers',
    label: 'Transfers',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <circle cx="5" cy="18" r="3" /><circle cx="19" cy="18" r="3" /><path d="M10 18H14M3 9l2-5h10l4 5" /><line x1="1" y1="14" x2="23" y2="14" />
      </svg>
    ),
  },
  {
    id: 'fleet',
    label: 'Fleet',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2h-2" /><circle cx="9" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
      </svg>
    ),
  },
  {
    id: 'policies',
    label: 'Policies',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: 'services',
    label: 'Services',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
]

const ALL_FAQ_ITEMS = [
  /* ── Booking ── */
  {
    category: 'booking',
    question: 'How do I book a transfer with UmrahLimo?',
    answer:
      'Booking is 100% online. Enter your pickup and drop-off locations on our website, select your travel date and time, choose a vehicle, and confirm with a small deposit. You will receive an instant confirmation email with your booking details and driver information.',
  },
  {
    category: 'booking',
    question: 'How far in advance should I book?',
    answer:
      'We recommend booking at least 48 hours in advance to guarantee availability, especially during peak Umrah and Hajj seasons (Ramadan, Dhul Hijjah). However, we do accept last-minute bookings subject to vehicle availability. Book 30 days in advance for our 10% early-bird discount.',
  },
  {
    category: 'booking',
    question: 'Can I book for a group?',
    answer:
      'Yes. We accommodate groups of all sizes — from families to large Umrah delegations. Options include vans (7 seats), minibuses (14 seats), and full-size buses (up to 49 seats). Groups save up to 20% on their booking. Contact us directly for group quotes.',
  },
  {
    category: 'booking',
    question: 'Do I need to create an account to book?',
    answer:
      'No account is required to make a booking. You can book as a guest using just your email address. An account lets you view and manage all past and upcoming bookings in one place, which is useful for repeat pilgrims.',
  },
  /* ── Payment ── */
  {
    category: 'payment',
    question: 'Do I have to pay the full amount online?',
    answer:
      'No. UmrahLimo uses a deposit model — you pay a small deposit online to confirm your booking, and the remaining balance is paid directly to your driver on arrival. This gives you peace of mind without requiring full upfront payment.',
  },
  {
    category: 'payment',
    question: 'What payment methods do you accept?',
    answer:
      'Online deposits can be paid via major credit and debit cards (Visa, Mastercard). The remaining balance paid to the driver on arrival can be made in cash (SAR or USD accepted) or by card. Please confirm cash currency options with our support team when booking.',
  },
  {
    category: 'payment',
    question: 'Are the prices fixed or can they change?',
    answer:
      'All UmrahLimo prices are fixed. There is no surge pricing, no hidden fees, and no surprises. The price you see when booking is the price you pay — nothing more. This includes all tolls, taxes, and standard meet & greet.',
  },
  {
    category: 'payment',
    question: 'Are there any extra charges I should know about?',
    answer:
      'No hidden extras. Meet & greet, flight tracking, and standard waiting time (up to 60 minutes after landing) are all included in the price. Extra stops (e.g., Meeqat during Makkah–Madinah transfers) may incur a small additional fee — ask at the time of booking.',
  },
  /* ── Transfers ── */
  {
    category: 'transfers',
    question: 'How long does the Jeddah Airport to Makkah transfer take?',
    answer:
      'The journey from Jeddah King Abdulaziz International Airport (KAIA) to Makkah is approximately 85 km and takes around 1 to 1.5 hours depending on traffic. During peak Hajj and Umrah seasons, traffic can extend this to 2 hours or more.',
  },
  {
    category: 'transfers',
    question: 'How long is the Makkah to Madinah transfer?',
    answer:
      'The road journey from Makkah to Madinah is approximately 430 km and takes around 4 to 4.5 hours under normal traffic. Our drivers take regular rest stops and can stop at Meeqat on request at no extra charge.',
  },
  {
    category: 'transfers',
    question: 'Do your drivers meet us inside the airport?',
    answer:
      'Yes. All airport transfers include a meet & greet service. Your driver will be waiting in the arrivals hall with a name board displaying your name. They will assist with your luggage and guide you to the vehicle.',
  },
  {
    category: 'transfers',
    question: 'What happens if my flight is delayed?',
    answer:
      'We track every flight in real time. If your flight is delayed, your driver\'s pickup time is automatically adjusted to match your new arrival time. You do not need to contact us — and there is no extra charge for flight delays.',
  },
  {
    category: 'transfers',
    question: 'Which airports do you serve?',
    answer:
      'We serve all major Saudi airports including Jeddah King Abdulaziz International Airport (JED), Prince Mohammad Bin Abdulaziz Airport in Madinah (MED), King Khalid International Airport in Riyadh (RUH), and Taif Regional Airport (TIF).',
  },
  /* ── Fleet ── */
  {
    category: 'fleet',
    question: 'What types of vehicles do you offer?',
    answer:
      'Our fleet includes luxury sedans (Toyota Camry, Lexus ES), 7-seater SUVs and vans (Toyota Hiace, GMC Yukon), 14-seat minibuses, and full-size coaches for up to 49 passengers. All vehicles are air-conditioned, clean, and well-maintained.',
  },
  {
    category: 'fleet',
    question: 'Are your vehicles Nusuk compliant?',
    answer:
      'Yes. UmrahLimo is fully Nusuk compliant. All our vehicles and drivers meet the official Saudi Ministry of Hajj and Umrah transport requirements for pilgrims travelling on Umrah visas. This is required for access to Makkah and the holy sites.',
  },
  {
    category: 'fleet',
    question: 'How much luggage can your standard family vans and luxury VIP vehicles hold?',
    answer:
      'Our standard family vans (like the Hyundai H1 or Hiace) comfortably hold up to 7 passengers and 5-6 large bags. Our luxury VIP fleets (like the GMC Yukon) are ideal for 4-5 passengers with up to 5 large suitcases. Exact capacities are explicitly listed next to each vehicle variation during checkout.',
  },
  {
    category: 'fleet',
    question: 'How much luggage can I bring?',
    answer:
      'Luggage allowance depends on the vehicle type. Sedans accommodate 2 large suitcases and 2 carry-ons. Vans and minibuses have generous luggage space. If you have an unusually large amount of luggage (e.g., a group with 10+ bags), please mention it at booking so we can assign the right vehicle.',
  },
  /* ── Policies ── */
  {
    category: 'policies',
    question: 'What is your cancellation policy?',
    answer:
      'You can cancel for free up to 24 hours before your scheduled pickup time and receive a full refund of your deposit. Cancellations made less than 24 hours before pickup are non-refundable. To cancel, log in to your account or contact our support team via email or WhatsApp +1 302 401 4991.',
  },
  {
    category: 'policies',
    question: 'Can I change my booking after confirming?',
    answer:
      'Yes. You can change your pickup time, vehicle type, or passenger count through the Manage Booking section of our website, or by contacting our support team. Changes are subject to availability and must be made at least 12 hours before pickup. As shown in our reviews, we have accommodated changes of over 10 hours at no extra charge.',
  },
  {
    category: 'policies',
    question: 'What if I can\'t find my driver at the airport?',
    answer:
