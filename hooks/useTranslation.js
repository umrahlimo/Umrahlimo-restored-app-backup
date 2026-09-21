'use client'

import { useLanguage } from '../context/LanguageContext'
import { getTranslation } from '../translations/translations'

/**
 * Custom hook for easy translation access
 * Usage: const t = useTranslation()
 * Then: t('keyName')
 */
export const useTranslation = () => {
  const { language } = useLanguage()
  
  return (key) => getTranslation(language, key)
}
