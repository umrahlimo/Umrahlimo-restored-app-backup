'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signUpUser, signInWithGoogle } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import PortalNavbar from '../components/Navbar/PortalNavbar'
import Footer from '../components/Footer/Footer'
import styles from '../login/auth.module.scss'

// Icons
const UserAddIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
)

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
  </svg>
)

const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
)

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
  </svg>
)

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
  </svg>
)

const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
  </svg>
)

// Feature Icons for Brand Showcase
const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
  </svg>
)

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
  </svg>
)

const CarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
  </svg>
)

const SignupPageContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+966',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.push(redirect)
    }
  }, [user, loading, router, redirect])

  const validateForm = () => {
    const newErrors = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.phone) newErrors.phone = 'Phone number is required'
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (!acceptTerms) newErrors.terms = 'You must accept the terms and conditions'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    setErrors({})

    const result = await signUpUser(formData.email, formData.password, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      countryCode: formData.countryCode
    })

    if (result.success) {
      router.push(redirect)
    } else {
      let errorMessage = 'Signup failed. Please try again.'
      if (result.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists'
      } else if (result.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak'
      } else if (result.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      }
      setErrors({ general: errorMessage })
    }
    setIsSubmitting(false)
  }

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true)
    setErrors({})
    const result = await signInWithGoogle()
    if (result.success) {
      router.push(redirect)
    } else {
      setErrors({ general: 'Google sign in failed. Please try again.' })
    }
    setIsSubmitting(false)
  }

  if (loading) {
    return (
      <div className={styles.authPageWrapper}>
        <PortalNavbar />
        <div className={styles.authPage}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className={styles.authPageWrapper}>
      <PortalNavbar />
      <div className={styles.authPage}>
      {/* Left Side - Brand Showcase */}
      <div className={styles.brandShowcase}>
        <div className={styles.brandContent}>
          <div className={styles.brandLogo}>
            <img src="/logobg.png" alt="UmrahLimo" />
          </div>
          <div className={styles.brandTagline}>
            <h2>Join <span>UmrahLimo</span></h2>
            <p>Create your account and experience premium chauffeur services for your sacred journey.</p>
          </div>
          <div className={styles.brandFeatures}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <ShieldIcon />
              </div>
              <div className={styles.featureText}>
                <h4>Safe & Secure</h4>
                <p>Licensed & insured drivers</p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <ClockIcon />
              </div>
              <div className={styles.featureText}>
                <h4>24/7 Available</h4>
                <p>Round-the-clock service</p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <CarIcon />
              </div>
              <div className={styles.featureText}>
                <h4>Luxury Fleet</h4>
                <p>Premium vehicles only</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className={styles.authFormSide}>
        <div className={`${styles.authWrapper} ${styles.signupWrapper}`}>
          <div className={`${styles.authCard} ${styles.signupCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper}>
                <UserAddIcon />
              </div>
              <h1>Create Account</h1>
              <p>Join UmrahLimo for premium travel services</p>
            </div>

            {errors.general && (
              <div className={styles.errorAlert}>
                <ErrorIcon />
                <span>{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.authForm}>
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label>First Name</label>
                  <div className={`${styles.inputWrapper} ${errors.firstName ? styles.error : ''}`}>
                    <UserIcon />
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First name" />
                  </div>
                  {errors.firstName && <span className={styles.errorText}>{errors.firstName}</span>}
                </div>
                <div className={styles.inputGroup}>
                  <label>Last Name</label>
                  <div className={`${styles.inputWrapper} ${errors.lastName ? styles.error : ''}`}>
                    <UserIcon />
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last name" />
                  </div>
                  {errors.lastName && <span className={styles.errorText}>{errors.lastName}</span>}
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Email Address</label>
                <div className={`${styles.inputWrapper} ${errors.email ? styles.error : ''}`}>
                  <EmailIcon />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" autoComplete="email" />
                </div>
                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label>Phone Number</label>
                <div className={`${styles.phoneInputWrapper} ${errors.phone ? styles.error : ''}`}>
                  <select name="countryCode" value={formData.countryCode} onChange={handleChange}>
                    <option value="+966">🇸🇦 +966</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+92">🇵🇰 +92</option>
                    <option value="+971">🇦🇪 +971</option>
                  </select>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="5XX XXX XXXX" />
                </div>
                {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
              </div>

              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label>Password</label>
                  <div className={`${styles.inputWrapper} ${errors.password ? styles.error : ''}`}>
                    <LockIcon />
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Create password" autoComplete="new-password" />
                    <button type="button" className={styles.togglePassword} onClick={() => setShowPassword(!showPassword)}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d={showPassword ? "M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27z" : "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"} />
                      </svg>
                    </button>
                  </div>
                  {errors.password && <span className={styles.errorText}>{errors.password}</span>}
                </div>
                <div className={styles.inputGroup}>
                  <label>Confirm Password</label>
                  <div className={`${styles.inputWrapper} ${errors.confirmPassword ? styles.error : ''}`}>
                    <LockIcon />
                    <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" autoComplete="new-password" />
                    <button type="button" className={styles.togglePassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d={showConfirmPassword ? "M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27z" : "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"} />
                      </svg>
                    </button>
                  </div>
                  {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
                </div>
              </div>

              <div className={styles.termsCheckbox}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={acceptTerms} onChange={(e) => { setAcceptTerms(e.target.checked); if (errors.terms) setErrors(prev => ({ ...prev, terms: '' })) }} />
                  <span className={styles.checkmark}></span>
                  <span>I agree to the <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link></span>
                </label>
                {errors.terms && <span className={styles.errorText}>{errors.terms}</span>}
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className={styles.btnSpinner}></div>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRightIcon />
                  </>
                )}
              </button>
            </form>

            <div className={styles.divider}>
              <span>or continue with</span>
            </div>

            <button type="button" className={styles.googleBtn} onClick={handleGoogleSignIn} disabled={isSubmitting}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <p className={styles.switchAuth}>
              Already have an account? <Link href={`/login${redirect !== '/dashboard' ? `?redirect=${redirect}` : ''}`}>Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
  )
}

const SignupPage = () => {
  return (
    <Suspense fallback={
      <div className={styles.authPageWrapper}>
        <PortalNavbar />
        <div className={styles.authPage}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  )
}

export default SignupPage
