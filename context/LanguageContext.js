'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en')
  const [direction, setDirection] = useState('ltr')

  useEffect(() => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      // Load saved language from localStorage
      const savedLanguage = localStorage.getItem('language') || 'en'
      setLanguage(savedLanguage)
      setDirection(savedLanguage === 'ar' ? 'rtl' : 'ltr')

      // Update document direction
      document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = savedLanguage
    }
  }, [])

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage)
    const newDirection = newLanguage === 'ar' ? 'rtl' : 'ltr'
    setDirection(newDirection)

    // Update document direction
    document.documentElement.dir = newDirection
    document.documentElement.lang = newLanguage

    // Save to localStorage
    localStorage.setItem('language', newLanguage)
  }

  return (
    <LanguageContext.Provider value={{ language, direction, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}
