'use client'

export default function Logo({ className = '' }) {
  return (
    <img
      src="/logo.png"
      alt="UmrahLimo"
      className={className}
      loading="eager"
      decoding="async"
    />
  )
}
