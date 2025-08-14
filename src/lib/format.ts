/**
 * CSS and display formatting utilities
 * 
 * These utilities provide non-i18n formatting helpers like CSS classes
 * and display-related functions.
 */

/**
 * Get CSS color class for positive/negative numbers
 */
export function numberColor(value: number): string {
  if (!value || isNaN(value)) return '';

  return value >= 0 ? 'text-green-600' : 'text-red-600'
}

// Re-export i18n formatting functions for convenience
export { 
  formatCurrency, 
  formatCurrencyCutted,
  formatPercent, 
  formatPercentage,
  formatCompactCurrency, 
  formatNumber,
  formatDate 
} from './i18n'