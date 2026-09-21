'use client'

import { useState, useEffect, useCallback } from 'react'
import PortalNavbar from '../components/Navbar/PortalNavbar'
import PortalFooter from '../components/PortalFooter/PortalFooter'
import { fetchCountryCodes, detectDialCodeByIP } from '../../lib/countryCodes'
import styles from './inquiry.module.css'

/* ═══════════════════════════════════════
   SVG Icon Components (inline, no dependency)
═══════════════════════════════════════ */
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)

const IconPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.08 1.18L6.18 1a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 5.1 5.1l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 20 15.06"/>
  </svg>
)

const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const IconBriefcase = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
)

const IconCar = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 0 1-2-2V9l2-5h14l2 5v6a2 2 0 0 1-2 2h-2"/>
    <circle cx="7" cy="17" r="2"/>
    <circle cx="17" cy="17" r="2"/>
  </svg>
)

const IconSuv = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17h18M3 14V9l2-5h14l2 5v5"/>
    <path d="M5 9h14"/>
    <circle cx="7" cy="17" r="2"/>
    <circle cx="17" cy="17" r="2"/>
  </svg>
)

const IconVan = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16v-6l-2-4H4L2 10v6"/>
    <path d="M2 16h20"/>
    <path d="M7 10h4V6H7z"/>
    <circle cx="6.5" cy="17.5" r="1.5"/>
    <circle cx="17.5" cy="17.5" r="1.5"/>
  </svg>
)

const IconBus = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 6v6M3 6h18M3 16h18M3 8a2 2 0 0 0-2 2v6h2M21 8a2 2 0 0 1 2 2v6h-2"/>
    <path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
    <circle cx="7" cy="18" r="2"/>
    <circle cx="17" cy="18" r="2"/>
  </svg>
)

const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)

const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const IconLock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const IconMessageCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

const IconSend = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

const IconCheckCircle = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

const IconAlertCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

/* ═══════════════════════════════════════
   Vehicle Options
═══════════════════════════════════════ */
const VEHICLE_OPTIONS = [
  { id: 'Sedan', name: 'Sedan', icon: <IconCar />, cap: 'Up to 3 passengers\n2 luggage bags' },
  { id: 'SUV', name: 'SUV', icon: <IconSuv />, cap: 'Up to 6 passengers\n6 luggage bags' },
  { id: 'VAN', name: 'VAN', icon: <IconVan />, cap: 'Up to 10 passengers\n7 luggage bags' },
  { id: 'Bus', name: 'Bus', icon: <IconBus />, cap: '15-45 passengers\nLarge group' },
]

/* ═══════════════════════════════════════
   Main Page Component
═══════════════════════════════════════ */
export default function InquiryPage() {
  const [countryCodes, setCountryCodes] = useState([])
  const [codesLoading, setCodesLoading] = useState(true)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+966',
    phone: '',
    arrivalDate: '',
    persons: '1',
    luggage: '1',
    vehicleChoice: 'Sedan',
    comments: '',
    honeypot: '',
    subscribeNewsletter: true,
  })

  // Anti-Spam
  const [spam, setSpam] = useState({ n1: 5, n2: 3 })
  const [spamAnswer, setSpamAnswer] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // ── Load country codes from free API
  useEffect(() => {
    let mounted = true

    const init = async () => {
      const [codes, detectedCode] = await Promise.all([
        fetchCountryCodes(),
        detectDialCodeByIP(),
      ])

      if (!mounted) return

      setCountryCodes(codes)
      setCodesLoading(false)

      // Pre-select the user's detected country code
      if (detectedCode) {
        setFormData((prev) => ({ ...prev, countryCode: detectedCode }))
      }
    }

    init()
    newSpam()

    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const newSpam = useCallback(() => {
    const n1 = Math.floor(Math.random() * 9) + 2
    const n2 = Math.floor(Math.random() * 9) + 1
    setSpam({ n1, n2 })
    setSpamAnswer('')
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleVehicle = (id) =>
    setFormData((prev) => ({ ...prev, vehicleChoice: id }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate mandatory fields
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Please enter your first and last name.')
      return
    }
    if (!formData.email.trim()) {
      setError('Please enter a valid email address.')
      return
    }
    if (!formData.phone.trim()) {
      setError('Please enter your phone number.')
      return
    }
    if (!formData.arrivalDate) {
      setError('Please select your arrival date.')
      return
    }

    // Spam validation
    if (parseInt(spamAnswer, 10) !== spam.n1 + spam.n2) {
      setError(`Spam check failed: ${spam.n1} + ${spam.n2} ≠ ${spamAnswer || '?'}. Please try again.`)
      newSpam()
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          spamUserAnswer: spamAnswer,
          spamExpectedAnswer: spam.n1 + spam.n2,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Submission failed. Please try again.')
      }

      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
      newSpam()
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSuccess(false)
    setFormData({
      firstName: '', lastName: '', email: '',
      countryCode: '+966', phone: '',
      arrivalDate: '', persons: '1', luggage: '1',
      vehicleChoice: 'Sedan', comments: '', honeypot: '',
      subscribeNewsletter: true,
    })
    newSpam()
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className={styles.page}>
      <PortalNavbar forceDark />

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={`${styles.heroGlow} ${styles.heroGlow1}`} />
          <div className={`${styles.heroGlow} ${styles.heroGlow2}`} />
        </div>
        <div className={styles.heroContent}>
          <div className={styles.container}>
            <span className={styles.heroBadge}>
              <IconShield />
              Custom VIP Transport Inquiry
            </span>
            <h1 className={styles.heroTitle}>
              Submit a{' '}
              <span className={styles.heroTitleAccent}>Trip Inquiry</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Planning a Umrah transfer, corporate trip or group journey? Tell us your requirements — our team will reply within same day with a tailored quote.
            </p>

            <div className={styles.trustRow}>
              <span className={styles.trustBadge}>
                <span className={styles.trustBadgeIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                No booking fee
              </span>
              <span className={styles.trustBadge}>
                <span className={styles.trustBadgeIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </span>
                Reply within same day
              </span>
              <span className={styles.trustBadge}>
                <span className={styles.trustBadgeIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </span>
                Secure & private
              </span>
              <span className={styles.trustBadge}>
                <span className={styles.trustBadgeIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                </span>
                Verified local drivers
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FORM ── */}
      <main className={styles.section}>
        <div className={styles.container}>
          {success ? (
            /* SUCCESS STATE */
            <div className={styles.successBox}>
              <div className={styles.successIconWrap}>
                <IconCheckCircle />
              </div>
              <h2 className={styles.successTitle}>Inquiry Received!</h2>
              <p className={styles.successDesc}>
                Thank you for contacting UmrahLimo. Your trip details have been submitted and our transport concierge team will contact you via Email or WhatsApp within 2 hours with personalised options and pricing.
              </p>
              <div className={styles.successActions}>
                <button onClick={handleReset} className={styles.newInquiryBtn}>
                  Submit Another Inquiry
                </button>
              </div>
            </div>
          ) : (
            /* FORM CARD */
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderIcon}>
                  <IconMessageCircle />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Inquiry Form</h2>
                  <p className={styles.cardSub}>
                    Fields marked with <span style={{ color: '#ef4444' }}>*</span> are required.
                  </p>
                </div>
              </div>

              {error && (
                <div className={styles.errorMsg}>
                  <span className={styles.errorIcon}><IconAlertCircle /></span>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Honeypot — hidden from users, bots fill it */}
                <input
                  type="text"
                  name="honeypot"
                  value={formData.honeypot}
                  onChange={handleChange}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                <div className={styles.formGrid}>

                  {/* ── First Name ── */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      <span className={styles.labelIcon}><IconUser /></span>
                      First Name <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="e.g. Mohammad"
                      className={styles.input}
                      autoComplete="given-name"
                      required
                    />
                  </div>

                  {/* ── Last Name ── */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      <span className={styles.labelIcon}><IconUser /></span>
                      Last Name <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="e.g. Al-Farsi"
                      className={styles.input}
                      autoComplete="family-name"
                      required
                    />
                  </div>

                  {/* ── Email ── */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      <span className={styles.labelIcon}><IconMail /></span>
                      Email Address <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. name@example.com"
                      className={styles.input}
                      autoComplete="email"
                      required
                    />
                  </div>

                  {/* ── Phone with Country Code ── */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      <span className={styles.labelIcon}><IconPhone /></span>
                      WhatsApp / Mobile Phone <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.phoneFlex}>
                      <div className={styles.countryCodeWrap}>
                        <select
                          name="countryCode"
                          value={formData.countryCode}
                          onChange={handleChange}
                          className={styles.countrySelect}
                          disabled={codesLoading}
                        >
                          {codesLoading ? (
                            <option value="+966">🇸🇦 +966 (Loading…)</option>
                          ) : (
                            countryCodes.map((c, i) => (
                              <option key={`${c.iso}-${i}`} value={c.dialCode}>
                                {c.flag} {c.dialCode} ({c.name})
                              </option>
                            ))
                          )}
                        </select>
                        <span className={styles.countryChevron}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </span>
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="50 123 4567"
                        className={styles.phoneInput}
                        autoComplete="tel-national"
                        required
                      />
                    </div>
                  </div>

                  {/* ── Arrival Date ── */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      <span className={styles.labelIcon}><IconCalendar /></span>
                      Arrival / Travel Date <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="date"
                      name="arrivalDate"
                      min={today}
                      value={formData.arrivalDate}
                      onChange={handleChange}
                      className={styles.input}
                      required
                    />
                  </div>

                  {/* ── Persons & Luggage ── */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      <span className={styles.labelIcon}><IconUsers /></span>
                      Passengers &amp; Luggage <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.numericRow}>
                      <select
                        name="persons"
                        value={formData.persons}
                        onChange={handleChange}
                        className={styles.select}
                      >
                        {[...Array(50)].map((_, i) => (
                          <option key={i + 1} value={String(i + 1)}>
                            {i + 1} Person{i > 0 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                      <select
                        name="luggage"
                        value={formData.luggage}
                        onChange={handleChange}
                        className={styles.select}
                      >
                        {[...Array(30)].map((_, i) => (
                          <option key={i} value={String(i)}>
                            {i} Bag{i !== 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ── Vehicle Choice ── */}
                  <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>
                      <span className={styles.labelIcon}><IconBriefcase /></span>
                      Vehicle Type <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.vehicleGrid}>
                      {VEHICLE_OPTIONS.map((v) => {
                        const isSelected = formData.vehicleChoice === v.id
                        return (
                          <div
                            key={v.id}
                            className={`${styles.vehicleOption} ${isSelected ? styles.vehicleSelected : ''}`}
                            onClick={() => handleVehicle(v.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleVehicle(v.id)}
                            aria-label={`Select ${v.name}`}
                          >
                            {isSelected && (
                              <div className={styles.vehicleSelectedCheck}>
                                <IconCheck />
                              </div>
                            )}
                            <div className={styles.vehicleIconWrap}>{v.icon}</div>
                            <span className={styles.vehicleName}>{v.name}</span>
                            <span className={styles.vehicleCap}>{v.cap}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* ── Comments ── */}
                  <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>
                      <span className={styles.labelIcon}><IconMessageCircle /></span>
                      Comments / Special Requests
                    </label>
                    <textarea
                      name="comments"
                      value={formData.comments}
                      onChange={handleChange}
                      placeholder="Enter route details, pickup address, flight number, child seats, or any special requirements…"
                      className={styles.textarea}
                    />
                  </div>

                  {/* ── Subscribe Newsletter ── */}
                  <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.95rem', color: '#334155', marginTop: '10px' }}>
                      <input
                        type="checkbox"
                        name="subscribeNewsletter"
                        checked={formData.subscribeNewsletter}
                        onChange={handleChange}
                        style={{ width: '18px', height: '18px', marginRight: '10px', accentColor: '#0d9488', cursor: 'pointer' }}
                      />
                      Subscribe for newsletter and important information.
                    </label>
                  </div>

                  {/* ── Anti-Spam ── */}
                  <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                    <div className={styles.spamBox}>
                      <div className={styles.spamHeader}>
                        <span className={styles.spamShieldIcon}><IconShield /></span>
                        <span className={styles.spamHeaderText}>Security Verification</span>
                      </div>
                      <div className={styles.spamBody}>
                        <div className={styles.spamQuestion}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginRight: 8 }}>Solve:</span>
                          <div className={styles.spamMathBox}>
                            <div className={styles.spamNum}>{spam.n1}</div>
                            <span className={styles.spamOperator}>+</span>
                            <div className={styles.spamNum}>{spam.n2}</div>
                            <span className={styles.spamEquals}>=</span>
                            <span className={styles.spamQuestionMark}>?</span>
                          </div>
                        </div>
                        <div className={styles.spamInputWrap}>
                          <span className={styles.spamLabel}>Your answer:</span>
                          <input
                            type="number"
                            value={spamAnswer}
                            onChange={(e) => setSpamAnswer(e.target.value)}
                            placeholder="—"
                            className={styles.spamInput}
                            required
                            min="0"
                            max="99"
                          />
                          <button
                            type="button"
                            onClick={newSpam}
                            className={styles.spamRefreshBtn}
                            title="Get a new question"
                          >
                            <IconRefresh />
                            New
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Submit ── */}
                  <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                    <button type="submit" disabled={loading} className={styles.submitBtn}>
                      {loading ? (
                        <>
                          <div className={styles.spinner} />
                          Submitting Inquiry…
                        </>
                      ) : (
                        <>
                          <IconSend />
                          Send Inquiry Request
                        </>
                      )}
                    </button>
                    <p className={styles.privacyNote}>
                      <IconLock /> Your information is encrypted and never shared with third parties.
                    </p>
                  </div>

                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <PortalFooter />
    </div>
  )
}
