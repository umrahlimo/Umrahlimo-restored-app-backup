'use client'

import { useState, useRef, useEffect } from 'react'
import { useCurrency, SUPPORTED_CURRENCIES } from '../../../context/CurrencyContext'
import './CurrencySwitcher.css'

const CurrencySwitcher = () => {
    const { currency, changeCurrency, currencies } = useCurrency()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const currentConfig = currencies[currency]

    return (
        <div className="currency-switcher" ref={dropdownRef}>
            <button
                className="currency-switcher__toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Select currency"
                aria-expanded={isOpen}
            >
                <span className="currency-switcher__flag">{currentConfig.flag}</span>
                <span className="currency-switcher__code">{currency}</span>
                <svg className={`currency-switcher__arrow ${isOpen ? 'open' : ''}`} width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {isOpen && (
                <div className="currency-switcher__dropdown">
                    {SUPPORTED_CURRENCIES.map((code) => {
                        const config = currencies[code]
                        return (
                            <button
                                key={code}
                                className={`currency-switcher__option ${code === currency ? 'active' : ''}`}
                                onClick={() => {
                                    changeCurrency(code)
                                    setIsOpen(false)
                                }}
                            >
                                <span className="currency-switcher__option-flag">{config.flag}</span>
                                <span className="currency-switcher__option-code">{code}</span>
                                <span className="currency-switcher__option-name">{config.name}</span>
                                {code === currency && (
                                    <svg className="currency-switcher__check" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                    </svg>
                                )}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default CurrencySwitcher
