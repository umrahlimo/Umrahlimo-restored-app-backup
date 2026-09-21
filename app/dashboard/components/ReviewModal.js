'use client'

import { useMemo, useState } from 'react'

export default function ReviewModal({ booking, onClose, onSubmit, submitting, styles }) {
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')

  const rideTitle = useMemo(() => {
    if (!booking) return ''
    const fromLocation = booking.fromLocation || booking.from || 'Pickup'
    const toLocation = booking.toLocation || booking.to || 'Dropoff'
    return `${fromLocation} → ${toLocation}`
  }, [booking])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSubmit({ rating, reviewText })
  }

  if (!booking) return null

  return (
    <div className={styles.reviewModalOverlay} onClick={onClose}>
      <div className={styles.reviewModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.reviewModalHeader}>
          <h3>Leave a Review</h3>
          <button type="button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.reviewForm}>
          <p className={styles.reviewRoute}>{rideTitle}</p>

          <label className={styles.reviewLabel}>Your Rating</label>
          <div className={styles.starRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={`${styles.starBtn} ${value <= rating ? styles.activeStar : ''}`}
                onClick={() => setRating(value)}
                aria-label={`Rate ${value} stars`}
              >
                ★
              </button>
            ))}
          </div>

          <label className={styles.reviewLabel}>Your Feedback</label>
          <textarea
            className={styles.reviewTextarea}
            rows={4}
            placeholder="Share your experience about the driver and ride quality..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            maxLength={500}
          />

          <div className={styles.reviewActions}>
            <button type="button" className={styles.reviewCancel} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.reviewSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
