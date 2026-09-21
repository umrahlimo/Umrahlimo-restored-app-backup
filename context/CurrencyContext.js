'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CurrencyContext = createContext()

// Exchange rates relative to 1 USD (canonical storage currency)
const EXCHANGE_RATES = {
    USD: 1,
    SAR: 3.75,
    EUR: 0.92,
    GBP: 0.79,
    PKR: 278.0,
    INR: 83.9,
    AED: 3.6725,
    EGP: 49.4,
    IDR: 15600,
    MYR: 4.72,
    TRY: 36.0
}

// Currency display config
const CURRENCY_CONFIG = {
    SAR: { symbol: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦', locale: 'ar-SA', decimals: 2 },
    USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸', locale: 'en-US', decimals: 2 },
    EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺', locale: 'de-DE', decimals: 2 },
    GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧', locale: 'en-GB', decimals: 2 },
    PKR: { symbol: 'Rs', name: 'Pakistani Rupee', flag: '🇵🇰', locale: 'ur-PK', decimals: 0 },
    INR: { symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', locale: 'en-IN', decimals: 0 },
    AED: { symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪', locale: 'ar-AE', decimals: 2 },
    EGP: { symbol: 'E£', name: 'Egyptian Pound', flag: '🇪🇬', locale: 'ar-EG', decimals: 2 },
    IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩', locale: 'id-ID', decimals: 0 },
    MYR: { symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾', locale: 'ms-MY', decimals: 2 },
    TRY: { symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷', locale: 'tr-TR', decimals: 2 }
}

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_CONFIG)

export const useCurrency = () => {
    const context = useContext(CurrencyContext)
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider')
    }
    return context
}

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState('USD')

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('currency') || 'USD'
            if (CURRENCY_CONFIG[saved]) {
                setCurrency(saved)
            }
        }
    }, [])

    const changeCurrency = useCallback((newCurrency) => {
        if (CURRENCY_CONFIG[newCurrency]) {
            setCurrency(newCurrency)
            localStorage.setItem('currency', newCurrency)
        }
    }, [])

    // Convert USD amount to selected currency and format
    const formatPrice = useCallback((usdAmount) => {
        if (usdAmount === null || usdAmount === undefined || isNaN(usdAmount)) return `${CURRENCY_CONFIG[currency].symbol} 0`

        const rate = EXCHANGE_RATES[currency] || 1
        const converted = parseFloat(usdAmount) * rate
        const config = CURRENCY_CONFIG[currency]

        return `${config.symbol} ${converted.toFixed(config.decimals)}`
    }, [currency])

    // Convert USD amount without formatting (raw number)
    const convertPrice = useCallback((usdAmount) => {
        if (!usdAmount || isNaN(usdAmount)) return 0
        const rate = EXCHANGE_RATES[currency] || 1
        return parseFloat(usdAmount) * rate
    }, [currency])

    // Get current currency config
    const getCurrencyConfig = useCallback(() => {
        return CURRENCY_CONFIG[currency]
    }, [currency])

    return (
        <CurrencyContext.Provider value={{
            currency,
            changeCurrency,
            formatPrice,
            convertPrice,
            getCurrencyConfig,
            currencies: CURRENCY_CONFIG,
            rates: EXCHANGE_RATES
        }}>
            {children}
        </CurrencyContext.Provider>
    )
}
