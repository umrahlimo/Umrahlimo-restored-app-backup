'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext'
import { getTranslation } from '../../../translations/translations'
import { signOutUser } from '../../../lib/firebase'
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher'
import CurrencySwitcher from '../CurrencySwitcher/CurrencySwitcher'
import Logo from '../Logo/Logo'
import './Navbar.css'

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
  </svg>
)

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
  </svg>
)

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
  </svg>
)

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="25" height="25">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
)

export default function Navbar({ isStatic = false }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isBookingLoading, setIsBookingLoading] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, userData, loading } = useAuth()
  const { language } = useLanguage()

  const t = (key) => getTranslation(language, key)

  useEffect(() => {
    // Only add scroll effect if not static
    if (isStatic) return

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isStatic])

  const handleLogout = async () => {
    await signOutUser()
    setShowUserMenu(false)
  }

  const handleBookNow = () => {
    setIsBookingLoading(true)
    router.push('/search')
  }

  const navbarClasses = `navbar navbar-expand-lg navbar-custom ${isScrolled ? 'scrolled' : ''} ${isStatic ? 'navbar-static' : ''}`

  return (
    <nav className={navbarClasses}>
      <div className="container">
        <Link className="navbar-brand navbar-brand-custom" href="/">
          <Logo className="brand-logo-img" />
        </Link>
        <button
          className="navbar-toggler navbar-toggler-custom"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <MenuIcon />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mx-auto">
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom ${pathname === '/' ? 'active' : ''}`} href="/">{t('home')}</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link nav-link-custom" href="/#about">{t('about')}</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link nav-link-custom" href="/#services">{t('services')}</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link nav-link-custom" href="/#fleet">{t('fleet')}</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link nav-link-custom" href="/#contact">{t('contact')}</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom ${pathname === '/inquiry' ? 'active' : ''}`} href="/inquiry">{t('inquiryNav') || 'Inquiry'}</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom ${pathname === '/faq' ? 'active' : ''}`} href="/faq">{t('faqNav')}</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom ${pathname === '/blog' ? 'active' : ''}`} href="/blog">Blog</Link>
            </li>
          </ul>
          <div className="navbar-cta">
            <CurrencySwitcher />
            <LanguageSwitcher />
            {!loading && (
              user ? (
                <div className="user-menu-container">
                  <button
                    className="user-menu-btn"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <div className="user-avatar">
                      {userData?.firstName?.[0] || user?.displayName?.[0] || 'U'}
                    </div>
                    <span className="user-name">{userData?.firstName || user?.displayName?.split(' ')[0] || 'User'}</span>
                  </button>
                  {showUserMenu && (
                    <div className="user-dropdown">
                      <Link href="/dashboard" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                        </svg>
                        {t('dashboard')}
                      </Link>
                      <Link href="/dashboard/bookings" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                        </svg>
                        My Bookings
                      </Link>
                      <button className="dropdown-item logout" onClick={handleLogout}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                        </svg>
                        {t('logout')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login" className="nav-login-btn">
                    <UserIcon />
                    <span>{t('login')}</span>
                  </Link>
                </>
              )
            )}
            <button
              className={`btn btn-book ${isBookingLoading ? 'loading' : ''}`}
              onClick={handleBookNow}
              disabled={isBookingLoading}
            >
              {isBookingLoading ? (
                <>
                  <span className="btn-book-spinner"></span>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>{t('bookNow')}</span>
                  <ArrowRightIcon />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

