/**
 * TanStack Query hooks for asset data
 */

import { queryOptions, useQuery } from "@tanstack/react-query"
import { getAssetDetail, getAssetTrades } from "./server"

export const assetQueries = {
  all: ["assets"],
  
  assetDetail: (symbol: string) =>
    queryOptions({
      queryKey: [...assetQueries.all, "detail", symbol.toUpperCase()],
      queryFn: () => getAssetDetail({ data: { symbol: symbol.toUpperCase() } }),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    }),
  
  assetTrades: (symbol: string) =>
    queryOptions({
      queryKey: [...assetQueries.all, "trades", symbol.toUpperCase()],
      queryFn: () => getAssetTrades({ data: { symbol: symbol.toUpperCase() } }),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    }),
}

/**
 * Hook to get detailed asset information
 */
export function useAssetDetail(symbol: string) {
  return useQuery(assetQueries.assetDetail(symbol))
}

/**
 * Hook to get asset trade history
 */
export function useAssetTrades(symbol: string) {
  return useQuery(assetQueries.assetTrades(symbol))
}