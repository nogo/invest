/**
 * TanStack Query hooks for price data
 */

import { queryOptions, useQuery } from "@tanstack/react-query"
import { getCurrentPrice, getBatchPrices, getEnrichedPortfolioPositions, getPriceServiceStats } from "./server"
import type { PriceRequest, BatchPriceRequest, PortfolioPosition } from '../domain/types'

export const priceQueries = {
	all: ["prices"],
	
	currentPrice: (request: PriceRequest) =>
		queryOptions({
			queryKey: [...priceQueries.all, "current", request.identifierType, request.identifier, request.currency],
			queryFn: () => getCurrentPrice(request),
			staleTime: 10 * 60 * 1000, // 10 minutes
			gcTime: 30 * 60 * 1000, // 30 minutes
		}),
	
	batchPrices: (request: BatchPriceRequest) =>
		queryOptions({
			queryKey: [...priceQueries.all, "batch", request],
			queryFn: () => getBatchPrices(request),
			staleTime: 10 * 60 * 1000, // 10 minutes
			gcTime: 30 * 60 * 1000, // 30 minutes
		}),
	
	portfolioPrices: (positions: PortfolioPosition[]) =>
		queryOptions({
			queryKey: [...priceQueries.all, "portfolio", positions],
			queryFn: () => getEnrichedPortfolioPositions(positions),
			staleTime: 10 * 60 * 1000, // 10 minutes
			gcTime: 30 * 60 * 1000, // 30 minutes
			enabled: positions.length > 0,
		}),
	
	stats: () =>
		queryOptions({
			queryKey: [...priceQueries.all, "stats"],
			queryFn: () => getPriceServiceStats(),
			staleTime: 5 * 60 * 1000, // 5 minutes
		}),
}

/**
 * Hook to get current price for a single asset
 */
export function useCurrentPrice(request: PriceRequest) {
	return useQuery(priceQueries.currentPrice(request))
}

/**
 * Hook to get current prices for multiple assets
 */
export function useBatchPrices(request: BatchPriceRequest) {
	return useQuery(priceQueries.batchPrices(request))
}

/**
 * Hook to get enriched portfolio positions with prices
 */
export function usePortfolioPrices(positions: PortfolioPosition[]) {
	return useQuery(priceQueries.portfolioPrices(positions))
}

/**
 * Hook to get price service statistics
 */
export function usePriceServiceStats() {
	return useQuery(priceQueries.stats())
}