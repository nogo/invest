import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import enCommon from '../locales/en/common.json'
import deCommon from '../locales/de/common.json'

export const resources = {
  en: {
    common: enCommon
  },
  de: {
    common: deCommon
  }
} as const

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    // Language detection options
    detection: {
      // Order and priorities of detection methods
      order: ['navigator', 'htmlTag', 'path', 'subdomain'],
      
      // Keys to lookup language from
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
      
      // Cache user language on
      caches: ['localStorage']
    },
    
    // Only allow supported languages
    supportedLngs: ['en', 'de'],
    
    // Namespace configuration
    defaultNS: 'common',
    ns: ['common'],
    
    interpolation: {
      escapeValue: false // React already does escaping
    },
    
    // React specific options
    react: {
      useSuspense: false // We'll handle loading states manually
    }
  })

export default i18n

// Financial formatting utilities with locale support
export const formatCurrency = (amount: number, currency = 'EUR', locale?: string) => {
  const currentLocale = locale || i18n.language
  return new Intl.NumberFormat(currentLocale, {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export const formatPercentage = (value: number, locale?: string) => {
  const currentLocale = locale || i18n.language
  return new Intl.NumberFormat(currentLocale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100)
}

export const formatNumber = (value: number, locale?: string) => {
  const currentLocale = locale || i18n.language
  return new Intl.NumberFormat(currentLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

export const formatDate = (date: Date, locale?: string, options?: Intl.DateTimeFormatOptions) => {
  const currentLocale = locale || i18n.language
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  return new Intl.DateTimeFormat(currentLocale, options || defaultOptions).format(date)
}