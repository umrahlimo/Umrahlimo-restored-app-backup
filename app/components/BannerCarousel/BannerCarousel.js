'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { db } from '../../../lib/firebase'
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore'
import styles from './BannerCarousel.module.scss'

export default function BannerCarousel() {
    const [banners, setBanners] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [isHovered, setIsHovered] = useState(false)

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                // Fetch active banners ordered by order field
                const q = query(
                    collection(db, 'admin_banners'),
                    where('isActive', '==', true),
                    orderBy('order', 'asc')
                )
                const snapshot = await getDocs(q)
                const bannersList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                setBanners(bannersList)
            } catch (error) {
                console.error('Error fetching banners:', error)
                // Try without ordering if index doesn't exist
                try {
                    const snapshot = await getDocs(collection(db, 'admin_banners'))
                    const bannersList = snapshot.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .filter(b => b.isActive !== false)
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                    setBanners(bannersList)
                } catch (e) {
                    console.error('Error fetching banners:', e)
                }
            } finally {
                setLoading(false)
            }
        }

        fetchBanners()
    }, [])

    // Auto-slide
    useEffect(() => {
        if (banners.length <= 1 || isHovered) return

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % banners.length)
        }, 5000)

        return () => clearInterval(interval)
    }, [banners.length, isHovered])

    const goToSlide = useCallback((index) => {
        setCurrentIndex(index)
    }, [])

    const goToPrev = useCallback(() => {
        setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length)
    }, [banners.length])

    const goToNext = useCallback(() => {
        setCurrentIndex(prev => (prev + 1) % banners.length)
    }, [banners.length])

    const handleBannerClick = (banner) => {
        const targetUrl = typeof banner.linkUrl === 'string' ? banner.linkUrl.trim() : ''
        if (targetUrl) {
            window.open(targetUrl, '_blank', 'noopener,noreferrer')
        }
    }

    // Don't render if no banners
    if (loading || banners.length === 0) {
        return null
    }

    return (
        <div
            className={styles.carousel}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Slides */}
            <div className={styles.slidesContainer}>
                {banners.map((banner, index) => {
                    const hasContent = Boolean(banner.title || banner.description)

                    return (
                        <div
                            key={banner.id}
                            className={`${styles.slide} ${index === currentIndex ? styles.active : ''}`}
                            onClick={() => handleBannerClick(banner)}
                            style={{ cursor: banner.linkUrl ? 'pointer' : 'default' }}
                        >
                            <div className={styles.imageLayer}>
                                <Image
                                    src={banner.imageUrl}
                                    alt={banner.title || 'Jeddah airport to Makkah taxi luxury transfer banner'}
                                    fill
                                    unoptimized
                                    priority={index === 0}
                                    quality={90}
                                    className={styles.slideImage}
                                    onError={(event) => {
                                        event.currentTarget.style.display = 'none'
                                    }}
                                />
                            </div>

                            <div className={styles.readabilityScrim} aria-hidden="true"></div>

                            {hasContent && (
                                <div className={styles.contentArea}>
                                    <div className={styles.contentCard}>
                                        {banner.title && <h2 className={styles.bannerTitle}>{banner.title}</h2>}
                                        {banner.description && <p className={styles.bannerDescription}>{banner.description}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Navigation Arrows */}
            {banners.length > 1 && (
                <>
                    <button
                        className={`${styles.navBtn} ${styles.prevBtn}`}
                        onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                        aria-label="Previous slide"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                        </svg>
                    </button>
                    <button
                        className={`${styles.navBtn} ${styles.nextBtn}`}
                        onClick={(e) => { e.stopPropagation(); goToNext(); }}
                        aria-label="Next slide"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                        </svg>
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {banners.length > 1 && (
                <div className={styles.dots}>
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            className={`${styles.dot} ${index === currentIndex ? styles.active : ''}`}
                            onClick={() => goToSlide(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
