/**
 * Main price service orchestrator
 * Manages multiple price providers with fallback and caching
 */

import type {
	PriceProvider,
	PriceRequest,
	BatchPriceRequest,
	PriceData,
	PriceServiceResponse,
	CacheEntry,
	PortfolioPosition,
	EnrichedPosition
} from './types'
import { MockPriceProvider } from './providers/mock-provider'

/**
 * Simple in-memory cache with TTL
 */
class PriceCache {
	private cache = new Map<string, CacheEntry<PriceData>>()
	private readonly defaultTTL = 15 * 60 * 1000 // 15 minutes in ms

	private generateKey(identifier: string, identifierType: string, currency: string): string {
		return `${identifierType}:${identifier}:${currency}`
	}

	set(identifier: string, identifierType: string, currency: string, data: PriceData, ttl?: number): void {
		const key = this.generateKey(identifier, identifierType, currency)
		const expiresAt = new Date(Date.now() + (ttl || this.defaultTTL))
		
		this.cache.set(key, {
			data,
			timestamp: new Date(),
			expiresAt
		})
	}

	get(identifier: string, identifierType: string, currency: string): PriceData | null {
		const key = this.generateKey(identifier, identifierType, currency)
		const entry = this.cache.get(key)
		
		if (!entry) return null
		
		if (new Date() > entry.expiresAt) {
			this.cache.delete(key)
			return null
		}
		
		return entry.data
	}

	clear(): void {
		this.cache.clear()
	}

	size(): number {
		return this.cache.size
	}
}

/**
 * Main price service class
 */
export class PriceService {
	private static instance: PriceService
	private providers: PriceProvider[] = []
	private cache = new PriceCache()

	private constructor() {
		this.initializeProviders()
	}

	static getInstance(): PriceService {
		if (!PriceService.instance) {
			PriceService.instance = new PriceService()
		}
		return PriceService.instance
	}

	private initializeProviders(): void {
		// For MVP, only use mock provider
		// Later: add AlphaVantageProvider, YahooFinanceProvider, etc.
		this.providers = [
			new MockPriceProvider()
		]

		// Sort providers by priority (lower number = higher priority)
		this.providers.sort((a, b) => a.priority - b.priority)
	}

	private async tryProvider(
		provider: PriceProvider,
		request: PriceRequest
	): Promise<PriceServiceResponse<PriceData>> {
		try {
			const isHealthy = await provider.healthCheck()
			if (!isHealthy) {
				return {
					success: false,
					error: `Provider ${provider.name} is not healthy`,
					code: 'API_ERROR'
				}
			}

			return await provider.getCurrentPrice(request)
		} catch (error) {
			return {
				success: false,
				error: `Provider ${provider.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				code: 'API_ERROR'
			}
		}
	}

	async getCurrentPrice(request: PriceRequest): Promise<PriceServiceResponse<PriceData>> {
		const currency = request.currency || 'USD'
		
		// Check cache first
		const cached = this.cache.get(request.identifier, request.identifierType, currency)
		if (cached) {
			return {
				success: true,
				data: cached
			}
		}

		// Try each provider in priority order
		for (const provider of this.providers) {
			const result = await this.tryProvider(provider, { ...request, currency })
			
			if (result.success && result.data) {
				// Cache successful result
				this.cache.set(request.identifier, request.identifierType, currency, result.data)
				return result
			}
			
			// If rate limited, respect retry-after
			if (result.code === 'RATE_LIMITED') {
				continue // Try next provider
			}
		}

		return {
			success: false,
			error: `No provider could fetch price for ${request.identifier}`,
			code: 'NOT_FOUND'
		}
	}

	async getBatchPrices(request: BatchPriceRequest): Promise<PriceServiceResponse<PriceData[]>> {
		const results: PriceData[] = []
		const failedRequests: PriceRequest[] = []

		// First, check cache for all requests
		for (const priceRequest of request.requests) {
			const currency = priceRequest.currency || 'USD'
			const cached = this.cache.get(priceRequest.identifier, priceRequest.identifierType, currency)
			
			if (cached) {
				results.push(cached)
			} else {
				failedRequests.push({ ...priceRequest, currency })
			}
		}

		// If all requests were cached, return early
		if (failedRequests.length === 0) {
			return {
				success: true,
				data: results
			}
		}

		// Try providers for remaining requests
		for (const provider of this.providers) {
			if (failedRequests.length === 0) break

			try {
				const isHealthy = await provider.healthCheck()
				if (!isHealthy) continue

				const batchResult = await provider.getBatchPrices({
					requests: failedRequests
				})

				if (batchResult.success && batchResult.data) {
					// Add successful results and cache them
					for (const priceData of batchResult.data) {
						results.push(priceData)
						this.cache.set(
							priceData.identifier,
							priceData.identifierType,
							priceData.currency,
							priceData
						)
					}

					// Remove successful requests from failed list
					const successfulIdentifiers = new Set(
						batchResult.data.map(d => `${d.identifierType}:${d.identifier}:${d.currency}`)
					)
					
					const remainingFailed = failedRequests.filter(req => {
						const key = `${req.identifierType}:${req.identifier}:${req.currency}`
						return !successfulIdentifiers.has(key)
					})
					
					failedRequests.length = 0
					failedRequests.push(...remainingFailed)
				}
			} catch (error) {
				continue // Try next provider
			}
		}

		return {
			success: true,
			data: results
		}
	}

	/**
	 * Enrich portfolio positions with current price data
	 */
	async enrichPortfolioPositions(positions: PortfolioPosition[]): Promise<EnrichedPosition[]> {
		const requests: PriceRequest[] = positions.map(position => ({
			identifier: position.isin || position.symbol,
			identifierType: position.isin ? 'ISIN' : 'SYMBOL',
			currency: position.currency
		}))

		const priceResult = await this.getBatchPrices({ requests })
		const priceMap = new Map<string, PriceData>()

		if (priceResult.success && priceResult.data) {
			for (const priceData of priceResult.data) {
				const key = `${priceData.identifierType}:${priceData.identifier}:${priceData.currency}`
				priceMap.set(key, priceData)
			}
		}

		return positions.map(position => {
			const priceKey = `${position.isin ? 'ISIN' : 'SYMBOL'}:${position.isin || position.symbol}:${position.currency}`
			const priceData = priceMap.get(priceKey)
			
			const enriched: EnrichedPosition = {
				...position,
				priceData
			}

			if (priceData) {
				enriched.currentValue = position.quantity * priceData.price
			} else {
				enriched.error = 'Price data not available'
			}

			return enriched
		})
	}

	/**
	 * Clear all cached prices
	 */
	clearCache(): void {
		this.cache.clear()
	}

	/**
	 * Get cache statistics
	 */
	getCacheStats(): { size: number; providers: string[] } {
		return {
			size: this.cache.size(),
			providers: this.providers.map(p => p.name)
		}
	}
}

// Export singleton instance
export const priceService = PriceService.getInstance()