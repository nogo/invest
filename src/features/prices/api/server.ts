/**
 * Server-side functions for price data
 * TanStack Start server functions for price service integration
 */

import { priceService } from '../domain/price-service'
import type { PriceRequest, BatchPriceRequest, PortfolioPosition } from '../domain/types'

/**
 * Get current price for a single asset
 */
export async function getCurrentPrice(request: PriceRequest) {
	return await priceService.getCurrentPrice(request)
}

/**
 * Get current prices for multiple assets
 */
export async function getBatchPrices(request: BatchPriceRequest) {
	return await priceService.getBatchPrices(request)
}

/**
 * Get enriched portfolio positions with current prices
 */
export async function getEnrichedPortfolioPositions(positions: PortfolioPosition[]) {
	return await priceService.enrichPortfolioPositions(positions)
}

/**
 * Get price service health and statistics
 */
export async function getPriceServiceStats() {
	return priceService.getCacheStats()
}