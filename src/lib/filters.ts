/**
 * Filter criteria interface for portfolio filtering
 */
export interface FilterCriteria {
  brokers: string[]
  positions: string[]
}

/**
 * Parses a search string into filter criteria
 * 
 * Supports:
 * - $broker for broker filtering (e.g., $robinhood)
 * - @symbol for position filtering (e.g., @aapl)
 * 
 * @param value - The search string to parse
 * @returns FilterCriteria object with brokers and positions arrays
 * 
 * @example
 * ```typescript
 * parseSearchFilters("$robinhood @aapl @msft")
 * // Returns: { brokers: ["robinhood"], positions: ["aapl", "msft"] }
 * ```
 */
export function parseSearchFilters(value: string): FilterCriteria {
  const brokers: string[] = []
  const positions: string[] = []

  const parts = value.split(/\s+/).filter(part => part.length > 0)

  for (const part of parts) {
    if (part.startsWith('$') && part.length > 1) {
      brokers.push(part.slice(1).toLowerCase())
    } else if (part.startsWith('@') && part.length > 1) {
      positions.push(part.slice(1).toLowerCase())
    }
  }

  return { brokers, positions }
}

/**
 * Converts filter criteria back to a search string
 * 
 * @param filters - The filter criteria to convert
 * @returns Search string representation
 * 
 * @example
 * ```typescript
 * formatFiltersToSearch({ brokers: ["robinhood"], positions: ["aapl", "msft"] })
 * // Returns: "$robinhood @aapl @msft"
 * ```
 */
export function formatFiltersToSearch(filters: FilterCriteria): string {
  const parts: string[] = []
  
  filters.brokers.forEach(broker => {
    parts.push(`$${broker}`)
  })
  
  filters.positions.forEach(position => {
    parts.push(`@${position}`)
  })
  
  return parts.join(' ')
}