'use client'

import { useLanguage } from '../../../context/LanguageContext'
import styles from './LanguageSwitcher.module.scss'

const LanguageSwitcher = () => {
  const { language, changeLanguage } = useLanguage()

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ]

  return (
    <div className={styles.languageSwitcher}>
      <div className={styles.dropdown}>
        <button className={styles.dropdownToggle}>
          <span className={styles.flag}>
            {languages.find(lang => lang.code === language)?.flag}
          </span>
          <span className={styles.langName}>
            {languages.find(lang => lang.code === language)?.name}
          </span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            className={styles.chevron}
          >
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
          </svg>
        </button>
        <div className={styles.dropdownMenu}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`${styles.dropdownItem} ${language === lang.code ? styles.active : ''}`}
              onClick={() => changeLanguage(lang.code)}
            >
              <span className={styles.flag}>{lang.flag}</span>
              <span className={styles.langName}>{lang.name}</span>
              {language === lang.code && (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  className={styles.checkIcon}
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LanguageSwitcher
