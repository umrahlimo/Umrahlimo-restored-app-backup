'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from '../Logo/Logo'
import CurrencySwitcher from '../CurrencySwitcher/CurrencySwitcher'
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher'
import { useLanguage } from '../../../context/LanguageContext'
import { useAuth } from '../../../context/AuthContext'
import styles from './PortalNavbar.module.css'

const NAV_LINK_KEYS = [
  { labelEn: 'Transfers', labelUr: 'ٹرانسفرز', labelAr: 'النقل', href: '/transfer' },
  { labelEn: 'Popular Routes', labelUr: 'مشہور روٹس', labelAr: 'المسارات الشائعة', href: '/popular-routes' },
  { labelEn: 'Airport Guides', labelUr: 'ایئرپورٹ گائیڈز', labelAr: 'دليل المطار', href: '/airport-guides' },
  { labelEn: 'Inquiry', labelUr: 'انکوائری', labelAr: 'استفسار', href: '/inquiry' },
  { labelEn: 'FAQs', labelUr: 'اکثر پوچھے جانے والے سوالات', labelAr: 'الأسئلة الشائعة', href: '/faq' },
]

const BLOG_LABEL = { en: 'Blog', ur: 'بلاگ', ar: 'المدونة' }
const PARTNER_CTA = { en: 'Become a Partner', ur: 'پارٹنر بنیں', ar: 'كن شريكاً' }
const AUTH_LABEL = {
  login: { en: 'Login', ur: 'لاگ ان', ar: 'تسجيل الدخول' },
  myBookings: { en: 'My Bookings', ur: 'میری بکنگز', ar: 'حجوزاتي' },
}

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M3 6H21V8H3V6ZM3 11H21V13H3V11ZM3 16H21V18H3V16Z" />
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M18.3 5.71L12 12L5.71 5.71L4.29 7.12L10.59 13.41L4.29 19.71L5.71 21.12L12 14.82L18.3 21.12L19.71 19.71L13.41 13.41L19.71 7.12L18.3 5.71Z" />
  </svg>
)

export default function PortalNavbar({ forceDark = false }) {
  const pathname = usePathname()
  const { language } = useLanguage()
  const { user } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80)
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setIsMenuOpen(false) }, [pathname])

  const isActiveLink = (href) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const getLinkClassName = (base, active, href) =>
    `${base} ${isActiveLink(href) ? active : ''}`.trim()

  const getLabel = (item) => {
    if (language === 'ur') return item.labelUr
    if (language === 'ar') return item.labelAr
    return item.labelEn
  }

  const blogLabel = BLOG_LABEL[language] || BLOG_LABEL.en
  const ctaLabel = PARTNER_CTA[language] || PARTNER_CTA.en
  const BLOG_HREF = '/blog'
  const authHref = user ? '/dashboard' : '/login'
  const authLabel = user
    ? (AUTH_LABEL.myBookings[language] || AUTH_LABEL.myBookings.en)
    : (AUTH_LABEL.login[language] || AUTH_LABEL.login.en)

  return (
    <nav className={`${styles.navbar} ${(isScrolled || forceDark) ? styles.scrolled : styles.transparent}`}>
      <div className={styles.container}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand} aria-label="UmrahLimo home">
            <Logo className={styles.logo} />
          </Link>

          <div className={styles.desktopLinks}>
            {NAV_LINK_KEYS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={getLinkClassName(styles.navLink, styles.activeLink, item.href)}
                aria-current={isActiveLink(item.href) ? 'page' : undefined}
              >
                {getLabel(item)}
              </Link>
            ))}
            <Link
              href={BLOG_HREF}
              className={getLinkClassName(styles.navLink, styles.activeLink, BLOG_HREF)}
              aria-current={isActiveLink(BLOG_HREF) ? 'page' : undefined}
            >
              {blogLabel}
            </Link>
            <Link
              href={authHref}
              className={getLinkClassName(styles.navLink, styles.activeLink, authHref)}
              aria-current={isActiveLink(authHref) ? 'page' : undefined}
            >
              {authLabel}
            </Link>
            <div className={styles.switchersGroup}>
              <CurrencySwitcher />
              <LanguageSwitcher />
            </div>
            <a
              href="https://www.roadtoumrah.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaLink}
            >
              {ctaLabel}
            </a>
          </div>

          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <div className={`${styles.mobilePanel} ${isMenuOpen ? styles.mobilePanelOpen : ''}`}>
        <div className={styles.mobileMenuContent}>
          {NAV_LINK_KEYS.map((item) => (
            <Link
              key={`mobile-${item.href}`}
              href={item.href}
              className={getLinkClassName(styles.mobileLink, styles.activeMobileLink, item.href)}
              aria-current={isActiveLink(item.href) ? 'page' : undefined}
            >
              {getLabel(item)}
            </Link>
          ))}
          <Link
            href={BLOG_HREF}
            className={getLinkClassName(styles.mobileLink, styles.activeMobileLink, BLOG_HREF)}
            aria-current={isActiveLink(BLOG_HREF) ? 'page' : undefined}
          >
            {blogLabel}
          </Link>
          <Link
            href={authHref}
            className={getLinkClassName(styles.mobileLink, styles.activeMobileLink, authHref)}
            aria-current={isActiveLink(authHref) ? 'page' : undefined}
          >
            {authLabel}
          </Link>
          <div className={styles.mobileSwitchers}>
            <CurrencySwitcher />
            <LanguageSwitcher />
          </div>
          <a
            href="https://www.roadtoumrah.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mobileCta}
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </nav>
  )
}
