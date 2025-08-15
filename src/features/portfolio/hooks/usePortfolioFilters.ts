import { useSearch } from '@tanstack/react-router'
import type { PortfolioFilter } from '../api/server'

/**
 * Custom hook to extract portfolio filters from URL search parameters
 * Provides a clean interface for components to access current filter state
 */
export function usePortfolioFilters(): PortfolioFilter {
  const search = useSearch({ from: '/' })
  
  return {
    q: search.q,
    tradeType: search.tradeType,
    assetType: search.assetType,
    dateFrom: search.dateFrom,
    dateTo: search.dateTo,
  }
}