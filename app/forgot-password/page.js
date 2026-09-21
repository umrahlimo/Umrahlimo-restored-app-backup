'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { resetPassword } from '../../lib/firebase'
import styles from '../login/auth.module.scss'

// Icons
const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
  </svg>
)

const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
)

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
)

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
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

const ForgotPasswordContent = () => {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      setError('Email is required')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email')
      return
    }

    setIsSubmitting(true)
    setError('')

    const result = await resetPassword(email)

    if (result.success) {
      setIsSuccess(true)
    } else {
      let errorMessage = 'Failed to send reset email. Please try again.'
      if (result.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email'
      } else if (result.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      } else if (result.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later'
      }
      setError(errorMessage)
    }

    setIsSubmitting(false)
  }

  return (
    <div className={styles.authPage}>
      {/* Left Side - Brand Showcase */}
      <div className={styles.brandShowcase}>
        <div className={styles.brandContent}>
          <div className={styles.brandLogo}>
            <img src="/logobg.png" alt="UmrahLimo" />
          </div>
          <div className={styles.brandTagline}>
            <h2>Reset Your <span>Password</span></h2>
            <p>Don&apos;t worry! It happens. We&apos;ll help you get back into your account safely.</p>
          </div>
          <div className={styles.brandFeatures}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <ShieldIcon />
              </div>
              <div className={styles.featureText}>
                <h4>Secure Process</h4>
                <p>Encrypted reset link</p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <ClockIcon />
              </div>
              <div className={styles.featureText}>
                <h4>Quick Recovery</h4>
                <p>Get back in minutes</p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <CarIcon />
              </div>
              <div className={styles.featureText}>
                <h4>Resume Booking</h4>
                <p>Continue your journey</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className={styles.authFormSide}>
        <div className={styles.authWrapper}>
          <div className={styles.authCard}>
            {!isSuccess ? (
              <>
                <div className={styles.cardHeader}>
                  <div className={styles.iconWrapper}>
                    <LockIcon />
                  </div>
                  <h1>Forgot Password?</h1>
                  <p>Enter your email and we&apos;ll send you a reset link</p>
                </div>

                {error && (
                  <div className={styles.errorAlert}>
                    <ErrorIcon />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className={styles.authForm}>
                  <div className={styles.inputGroup}>
                    <label>Email Address</label>
                    <div className={`${styles.inputWrapper} ${error ? styles.error : ''}`}>
                      <EmailIcon />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError('') }}
                        placeholder="Enter your email"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className={styles.btnSpinner}></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Reset Link
                        <SendIcon />
                      </>
                    )}
                  </button>
                </form>

                <p className={styles.switchAuth}>
                  Remember your password? <Link href={`/login${redirect !== '/dashboard' ? `?redirect=${redirect}` : ''}`}>Sign In</Link>
                </p>
              </>
            ) : (
              <div className={styles.successState}>
                <div className={styles.successIcon}>
                  <CheckIcon />
                </div>
                <h2>Check Your Email</h2>
                <p>We&apos;ve sent a password reset link to:</p>
                <span className={styles.emailSent}>{email}</span>
                <p className={styles.instructions}>
                  Click the link in the email to reset your password. If you don&apos;t see it, check your spam folder.
                </p>
                <Link href={`/login${redirect !== '/dashboard' ? `?redirect=${redirect}` : ''}`} className={styles.backToLogin}>
                  <ArrowLeftIcon />
                  Back to Sign In
                </Link>
                <button onClick={() => { setIsSuccess(false); setEmail('') }} className={styles.resendBtn}>
                  Didn&apos;t receive email? Try again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const ForgotPasswordPage = () => {
  return (
    <Suspense fallback={
      <div className={styles.authPage}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  )
}

export default ForgotPasswordPage
