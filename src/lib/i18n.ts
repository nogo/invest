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

export const formatCurrencyCutted = (amount: number, currency = 'EUR', locale?: string) => {
  const currentLocale = locale || i18n.language
  return new Intl.NumberFormat(currentLocale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

/**
 * Format percentage values with proper locale support and sign display
 * @param percent - The percentage value (as a number, e.g. 5.5 for 5.5%)
 * @param showSign - Whether to always show the sign (+ or -)
 */
export const formatPercent = (percent: number, showSign = false, locale?: string) => {
  if (showSign) {
    const formatted = formatPercentage(percent, locale)
    if (percent > 0 && !formatted.startsWith('+')) {
      return '+' + formatted
    }
    return formatted
  }
  return formatPercentage(percent, locale)
}

export const formatNumber = (value: number, decimals = 2, locale?: string) => {
  const currentLocale = locale || i18n.language
  return new Intl.NumberFormat(currentLocale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 * Useful for compact display of large monetary values
 */
export const formatCompactCurrency = (amount: number, currency = 'EUR', locale?: string) => {
  const absAmount = Math.abs(amount)

  if (absAmount >= 1_000_000_000) {
    return formatCurrency(amount / 1_000_000_000, currency, locale) + 'B'
  } else if (absAmount >= 1_000_000) {
    return formatCurrency(amount / 1_000_000, currency, locale) + 'M'
  } else if (absAmount >= 1_000) {
    return formatCurrency(amount / 1_000, currency, locale) + 'K'
  }

  return formatCurrency(amount, currency, locale)
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

