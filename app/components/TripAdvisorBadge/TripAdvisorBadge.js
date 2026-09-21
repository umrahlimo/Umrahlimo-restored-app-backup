'use client'

import { useEffect, useRef } from 'react'
import styles from './TripAdvisorBadge.module.css'

/**
 * TripAdvisorRatingBadge
 * Embeds the official TA "rated" widget (wtype=rated, uniq=545).
 * Drop it anywhere — checkout sidebar, footer, etc.
 */
export default function TripAdvisorBadge({ className = '' }) {
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true

    // Guard: don't add the script twice if component mounts twice (StrictMode)
    if (!document.querySelector('script[data-ta-uniq="545"]')) {
      const script = document.createElement('script')
      script.src =
        'https://www.jscache.com/wejs?wtype=rated&uniq=545&locationId=11832007&lang=en_US&display_version=2'
      script.async = true
      script.setAttribute('data-loadtrk', '')
      script.setAttribute('data-ta-uniq', '545')
      script.onload = function () {
        this.loadtrk = true
      }
      document.body.appendChild(script)
    }

    return () => {
      const s = document.querySelector('script[data-ta-uniq="545"]')
      if (s) s.remove()
      loaded.current = false
    }
  }, [])

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {/* Official TA rated widget markup */}
      <div id="TA_rated545" className="TA_rated">
        <ul id="wflY5qTgkc1" className="TA_links UNOf9zt">
          <li id="AZoOhpw" className="qnsFPK5Gqsf">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.tripadvisor.com/Attraction_Review-g293993-d11832007-Reviews-Umrah_Limo-Mecca_Makkah_Province.html"
            >
              <img
                src="https://www.tripadvisor.com/img/cdsi/img2/badges/ollie-11424-2.gif"
                alt="TripAdvisor"
              />
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}
