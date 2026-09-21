'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './TestimonialsCarousel.module.css'
import { useLanguage } from '../../../context/LanguageContext'
import { translations } from '../../../translations/translations'
import {
  TRIPADVISOR_LISTING_URL,
  TRIPADVISOR_BADGE_IMG,
  TESTIMONIALS,
} from '../../../lib/tripAdvisor'

function StarRating({ rating }) {
  return (
    <div className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={star <= rating ? '#fbbf24' : '#e5e7eb'}
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

export default function TestimonialsCarousel() {
  const { language } = useLanguage()
  const t = translations[language] || translations.en
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const nextSlide = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length)
    setTimeout(() => setIsAnimating(false), 600)
  }, [isAnimating])

  const prevSlide = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
    setTimeout(() => setIsAnimating(false), 600)
  }

  const goToSlide = (index) => {
    if (isAnimating || index === currentIndex) return
    setIsAnimating(true)
    setCurrentIndex(index)
    setTimeout(() => setIsAnimating(false), 600)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide()
    }, 6000)

    return () => clearInterval(interval)
  }, [nextSlide])

  const getCardClass = (index) => {
    const diff = (index - currentIndex + TESTIMONIALS.length) % TESTIMONIALS.length

    if (diff === 0) return styles.cardActive
    if (diff === 1) return styles.cardRight
    if (diff === TESTIMONIALS.length - 1) return styles.cardLeft
    return styles.cardHidden
  }

  return (
    <div className={styles.carouselWrapper}>
      <div className={styles.carouselContainer}>
        <button
          type="button"
          className={`${styles.navButton} ${styles.navButtonPrev}`}
          onClick={prevSlide}
          aria-label="Previous testimonial"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className={styles.cardsContainer}>
          {TESTIMONIALS.map((review, index) => (
            <a
              key={review.name}
              href={TRIPADVISOR_LISTING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.reviewCard} ${getCardClass(index)}`}
              aria-label={`Read ${review.name}'s review on TripAdvisor`}
            >
              <StarRating rating={review.rating} />
              <p className={styles.reviewQuote}>&ldquo;{review.quote}&rdquo;</p>
              <div className={styles.reviewerRow}>
                <span className={styles.reviewerAvatar}>
                  <img src={TRIPADVISOR_BADGE_IMG} alt="TripAdvisor" className={styles.taBadge} />
                </span>
                <div className={styles.reviewerInfo}>
                  <p className={styles.reviewerName}>{review.name}</p>
                  <p className={styles.reviewerLocation}>{review.location}</p>
                  <p className={styles.reviewSource}>{review.source}</p>
                </div>
              </div>
            </a>
          ))}
        </div>

        <button
          type="button"
          className={`${styles.navButton} ${styles.navButtonNext}`}
          onClick={nextSlide}
          aria-label="Next testimonial"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className={styles.dotsContainer}>
        {TESTIMONIALS.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`${styles.dot} ${index === currentIndex ? styles.dotActive : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>

      <div className={styles.ctaWrap}>
        <a
          href={TRIPADVISOR_LISTING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaLink}
        >
          {t.readAllTripAdvisorReviews || 'Read all reviews on TripAdvisor →'}
        </a>
      </div>
    </div>
  )
}
