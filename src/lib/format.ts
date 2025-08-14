import { formatCurrency as i18nFormatCurrency, formatPercentage as i18nFormatPercentage } from './i18n'

/**
 * Financial formatting utilities
 * 
 * These utilities provide consistent formatting for financial data
 * across the application, with locale support.
 */

/**
 * Format currency amounts with proper locale support
 */
export const formatCurrency = (amount: number, currency = 'EUR', locale?: string) => {
	return i18nFormatCurrency(amount, currency, locale)
}

/**
 * Format percentage values with proper locale support and sign display
 * @param percent - The percentage value (as a number, e.g. 5.5 for 5.5%)
 * @param showSign - Whether to always show the sign (+ or -)
 */
export const formatPercent = (percent: number, showSign = false, locale?: string) => {
	if (showSign) {
		const formatted = i18nFormatPercentage(percent, locale)
		if (percent > 0 && !formatted.startsWith('+')) {
			return '+' + formatted
		}
		return formatted
	}
	return i18nFormatPercentage(percent, locale)
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

/**
 * Format numbers with appropriate decimal places
 */
export const formatNumber = (value: number, decimals = 2, locale?: string) => {
	const currentLocale = locale || 'en-US'
	return new Intl.NumberFormat(currentLocale, {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals
	}).format(value)
}

export function numberColor(value: number): string {
	if (!value || isNaN(value)) return '';

	return value >= 0 ? 'text-red-600' : 'text-green-600'
}