'use client'

import { useState } from 'react'
import styles from './WhatsAppFloat.module.css'

const WHATSAPP_NUMBER = '13024014991' // E.164 format — no + no spaces
const WHATSAPP_MESSAGE = 'Hello UmrahLimo! I need help with my transfer booking.'

export default function WhatsAppFloat() {
  const [hovered, setHovered] = useState(false)

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.float}
      aria-label="Chat with us on WhatsApp"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pulse ring */}
      <span className={styles.pulse} />

      {/* WhatsApp SVG icon */}
      <svg
        className={styles.icon}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          fill="#ffffff"
          d="M16 0C7.163 0 0 7.163 0 16c0 2.824.737 5.474 2.027 7.773L0 32l8.437-2.007A15.933 15.933 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.268 13.268 0 0 1-6.773-1.853l-.485-.293-5.007 1.193 1.213-4.88-.32-.507A13.234 13.234 0 0 1 2.667 16C2.667 8.637 8.637 2.667 16 2.667S29.333 8.637 29.333 16 23.363 29.333 16 29.333zm7.307-9.92c-.4-.2-2.36-1.16-2.727-1.293-.367-.133-.633-.2-.9.2s-1.033 1.293-1.267 1.56c-.233.267-.467.3-.867.1-.4-.2-1.687-.62-3.213-1.973-1.187-1.053-1.987-2.353-2.22-2.753-.233-.4-.025-.62.175-.82.18-.18.4-.467.6-.7.2-.233.267-.4.4-.667.133-.267.067-.5-.033-.7-.1-.2-.9-2.167-1.233-2.967-.327-.78-.66-.673-.9-.687-.233-.013-.5-.017-.767-.017s-.7.1-1.067.5c-.367.4-1.4 1.367-1.4 3.333s1.433 3.867 1.633 4.133c.2.267 2.82 4.3 6.827 6.027.953.413 1.7.66 2.28.847.957.307 1.827.263 2.517.16.767-.113 2.36-.967 2.693-1.9.333-.933.333-1.733.233-1.9-.1-.167-.367-.267-.767-.467z"
        />
      </svg>

      {/* Tooltip label */}
      <span className={`${styles.tooltip} ${hovered ? styles.tooltipVisible : ''}`}>
        Chat on WhatsApp
      </span>
    </a>
  )
}
