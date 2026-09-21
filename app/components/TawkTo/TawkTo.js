'use client'

import { useEffect, useRef } from 'react'

const TawkTo = () => {
    const loaded = useRef(false)

    useEffect(() => {
        if (loaded.current) return
        loaded.current = true

        console.log('[TawkTo] Initializing Tawk.to chat widget...')

        // Set up Tawk.to globals
        if (!window.Tawk_API) {
            window.Tawk_API = {}
        }
        window.Tawk_LoadStart = new Date()

        // Create and inject the script
        const script = document.createElement('script')
        script.async = true
        script.src = 'https://embed.tawk.to/59f2922ec28eca75e46287e5/default'
        script.charset = 'UTF-8'
        script.setAttribute('crossorigin', '*')

        script.onload = () => {
            console.log('[TawkTo] Script loaded successfully')
        }

        script.onerror = (err) => {
            console.error('[TawkTo] Script failed to load:', err)
        }

        document.body.appendChild(script)
        console.log('[TawkTo] Script tag appended to body')
    }, [])

    return null
}

export default TawkTo
