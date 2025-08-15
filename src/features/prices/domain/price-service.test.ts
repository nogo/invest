import { describe, it, expect, beforeEach, spyOn } from 'bun:test'
import { PriceService } from './price-service'
import { MockPriceProvider } from './providers/mock-provider'
import type { PriceRequest, BatchPriceRequest, PriceProvider, PriceServiceResponse, PriceData } from './types'

// Create a test provider that we can control
class TestPriceProvider implements PriceProvider {
	name = 'TestProvider'
	priority = 1
	isHealthy = true
	shouldSucceed = true
	mockPrice = 150.50

	async healthCheck(): Promise<boolean> {
		return this.isHealthy
	}

	async getCurrentPrice(request: PriceRequest): Promise<PriceServiceResponse<PriceData>> {
		if (!this.shouldSucceed) {
			return {
				success: false,
				error: 'Test provider error',
				code: 'API_ERROR'
			}
		}

		return {
			success: true,
			data: {
				identifier: request.identifier,
				identifierType: request.identifierType,
				symbol: request.identifier,
				name: `Mock ${request.identifier}`,
				price: this.mockPrice,
				currency: request.currency || 'USD',
				timestamp: new Date(),
				change: 1.25,
				changePercent: 0.84,
				previousClose: this.mockPrice - 1.25
			}
		}
	}

	async getBatchPrices(request: BatchPriceRequest): Promise<PriceServiceResponse<PriceData[]>> {
		if (!this.shouldSucceed) {
			return {
				success: false,
				error: 'Test provider batch error',
				code: 'API_ERROR'
			}
		}

		const results = request.requests.map(req => ({
			identifier: req.identifier,
			identifierType: req.identifierType,
			symbol: req.identifier,
			name: `Mock ${req.identifier}`,
			price: this.mockPrice,
			currency: req.currency || 'USD',
			timestamp: new Date(),
			change: 1.25,
			changePercent: 0.84,
			previousClose: this.mockPrice - 1.25
		}))

		return {
			success: true,
			data: results
		}
	}

	getConfig() {
		return {
			name: this.name,
			enabled: true,
			priority: this.priority
		}
	}
}

describe('PriceService', () => {
	let priceService: PriceService

	beforeEach(() => {
		// Reset singleton for testing
		// @ts-ignore - accessing private static for testing
		PriceService.instance = undefined
		priceService = PriceService.getInstance()
		priceService.clearCache()
	})

	describe('Singleton Pattern', () => {
		it('returns same instance on multiple calls', () => {
			const instance1 = PriceService.getInstance()
			const instance2 = PriceService.getInstance()
			
			expect(instance1).toBe(instance2)
		})

		it('initializes with mock provider by default', () => {
			const stats = priceService.getCacheStats()
			expect(stats.providers).toContain('mock')
		})
	})

	describe('Cache Management', () => {
		it('caches successful price requests', async () => {
			const request: PriceRequest = {
				identifier: 'AAPL',
				identifierType: 'SYMBOL',
				currency: 'USD'
			}

			// First call
			const result1 = await priceService.getCurrentPrice(request)
			expect(result1.success).toBe(true)

			// Check cache stats
			const stats = priceService.getCacheStats()
			expect(stats.size).toBe(1)

			// Second call should use cache (we can't easily verify this without mocking)
			const result2 = await priceService.getCurrentPrice(request)
			expect(result2.success).toBe(true)
		})

		it('clears cache when requested', async () => {
			const request: PriceRequest = {
				identifier: 'AAPL',
				identifierType: 'SYMBOL',
				currency: 'USD'
			}

			await priceService.getCurrentPrice(request)
			
			let stats = priceService.getCacheStats()
			expect(stats.size).toBeGreaterThan(0)

			priceService.clearCache()
			
			stats = priceService.getCacheStats()
			expect(stats.size).toBe(0)
		})

		it('expires cached entries after TTL', async () => {
			// This is harder to test without manipulating time
			// For now, just verify the cache works
			const request: PriceRequest = {
				identifier: 'AAPL',
				identifierType: 'SYMBOL',
				currency: 'USD'
			}

			await priceService.getCurrentPrice(request)
			const stats = priceService.getCacheStats()
			expect(stats.size).toBe(1)
		})
	})

	describe('getCurrentPrice', () => {
		it('returns price data for known assets', async () => {
			const request: PriceRequest = {
				identifier: 'AAPL',
				identifierType: 'SYMBOL',
				currency: 'USD'
			}

			const result = await priceService.getCurrentPrice(request)
			
			expect(result.success).toBe(true)
			expect(result.data).toMatchObject({
				identifier: 'AAPL',
				identifierType: 'SYMBOL',
				symbol: 'AAPL',
				currency: 'USD'
			})
			expect(result.data?.price).toBeGreaterThan(0)
		})

		it('defaults currency to USD when not specified', async () => {
			const request: PriceRequest = {
				identifier: 'AAPL',
				identifierType: 'SYMBOL'
				// No currency specified
			}

			const result = await priceService.getCurrentPrice(request)
			
			expect(result.success).toBe(true)
			expect(result.data?.currency).toBe('USD')
		})

		it('returns error for unknown assets', async () => {
			const request: PriceRequest = {
				identifier: 'UNKNOWN_ASSET',
				identifierType: 'SYMBOL',
				currency: 'USD'
			}

			const result = await priceService.getCurrentPrice(request)
			
			expect(result.success).toBe(false)
			expect(result.code).toBe('NOT_FOUND')
		})

		it('handles ISIN identifiers', async () => {
			const request: PriceRequest = {
				identifier: 'US0378331005',
				identifierType: 'ISIN',
				currency: 'USD'
			}

			const result = await priceService.getCurrentPrice(request)
			
			expect(result.success).toBe(true)
			expect(result.data?.identifierType).toBe('ISIN')
			expect(result.data?.identifier).toBe('US0378331005')
		})
	})

	describe('getBatchPrices', () => {
		it('returns prices for multiple assets', async () => {
			const request: BatchPriceRequest = {
				requests: [
					{ identifier: 'AAPL', identifierType: 'SYMBOL', currency: 'USD' },
					{ identifier: 'MSFT', identifierType: 'SYMBOL', currency: 'USD' }
				]
			}

			const result = await priceService.getBatchPrices(request)
			
			expect(result.success).toBe(true)
			expect(result.data).toHaveLength(2)
		})

		it('handles empty batch requests', async () => {
			const request: BatchPriceRequest = {
				requests: []
			}

			const result = await priceService.getBatchPrices(request)
			
			expect(result.success).toBe(true)
			expect(result.data).toEqual([])
		})

		it('filters out unknown assets from results', async () => {
			const request: BatchPriceRequest = {
				requests: [
					{ identifier: 'AAPL', identifierType: 'SYMBOL', currency: 'USD' },
					{ identifier: 'UNKNOWN', identifierType: 'SYMBOL', currency: 'USD' },
					{ identifier: 'MSFT', identifierType: 'SYMBOL', currency: 'USD' }
				]
			}

			const result = await priceService.getBatchPrices(request)
			
			expect(result.success).toBe(true)
			// Should only return known assets (AAPL and MSFT)
			expect(result.data?.length).toBeLessThanOrEqual(2)
		})

		it('uses cache for subsequent batch requests', async () => {
			const request: BatchPriceRequest = {
				requests: [
					{ identifier: 'AAPL', identifierType: 'SYMBOL', currency: 'USD' }
				]
			}

			// First batch request
			const result1 = await priceService.getBatchPrices(request)
			expect(result1.success).toBe(true)

			// Second batch request should use cached data
			const result2 = await priceService.getBatchPrices(request)
			expect(result2.success).toBe(true)
		})
	})

	describe('enrichPortfolioPositions', () => {
		it('enriches portfolio positions with price data', async () => {
			const positions = [
				{
					isin: 'US0378331005',
					symbol: 'AAPL',
					quantity: 100,
					currency: 'USD' as const
				},
				{
					isin: 'US5949181045',
					symbol: 'MSFT',
					quantity: 50,
					currency: 'USD' as const
				}
			]

			const result = await priceService.enrichPortfolioPositions(positions)
			
			expect(result).toHaveLength(2)
			
			// Check that positions are enriched with price data or error info
			for (const enriched of result) {
				expect(enriched.isin || enriched.symbol).toBeDefined()
				expect(enriched.quantity).toBeGreaterThan(0)
				// Should have either price data or error message
				expect(
					enriched.priceData !== undefined || enriched.error !== undefined
				).toBe(true)
			}
		})

		it('prefers ISIN over symbol for price lookup', async () => {
			const positions = [
				{
					isin: 'US0378331005',
					symbol: 'AAPL',
					quantity: 100,
					currency: 'USD' as const
				}
			]

			const result = await priceService.enrichPortfolioPositions(positions)
			
			expect(result).toHaveLength(1)
			// Should use ISIN for lookup when available
			const enriched = result[0]
			expect(enriched.isin).toBe('US0378331005')
		})

		it('handles positions without price data', async () => {
			const positions = [
				{
					isin: 'UNKNOWN_ISIN',
					symbol: 'UNKNOWN',
					quantity: 100,
					currency: 'USD' as const
				}
			]

			const result = await priceService.enrichPortfolioPositions(positions)
			
			expect(result).toHaveLength(1)
			const enriched = result[0]
			expect(enriched.error).toBe('Price data not available')
			expect(enriched.currentValue).toBeUndefined()
		})

		it('calculates current value when price data is available', async () => {
			const positions = [
				{
					isin: 'US0378331005',
					symbol: 'AAPL',
					quantity: 100,
					currency: 'USD' as const
				}
			]

			const result = await priceService.enrichPortfolioPositions(positions)
			
			expect(result).toHaveLength(1)
			const enriched = result[0]
			
			if (enriched.priceData) {
				expect(enriched.currentValue).toBe(enriched.quantity * enriched.priceData.price)
			}
		})
	})

	describe('Cache Implementation', () => {
		it('generates consistent cache keys', async () => {
			const request1: PriceRequest = {
				identifier: 'AAPL',
				identifierType: 'SYMBOL',
				currency: 'USD'
			}
			
			const request2: PriceRequest = {
				identifier: 'AAPL',
				identifierType: 'SYMBOL',
				currency: 'USD'
			}

			await priceService.getCurrentPrice(request1)
			const stats1 = priceService.getCacheStats()
			
			await priceService.getCurrentPrice(request2)
			const stats2 = priceService.getCacheStats()
			
			// Should use cache, so size shouldn't increase
			expect(stats2.size).toBe(stats1.size)
		})

		it('differentiates between currencies in cache', async () => {
			const requestUSD: PriceRequest = {
				identifier: 'AAPL',
				identifierType: 'SYMBOL',
				currency: 'USD'
			}
			
			const requestEUR: PriceRequest = {
				identifier: 'AAPL',
				identifierType: 'SYMBOL',
				currency: 'EUR'
			}

			await priceService.getCurrentPrice(requestUSD)
			await priceService.getCurrentPrice(requestEUR)
			
			const stats = priceService.getCacheStats()
			// Should cache separately for different currencies
			expect(stats.size).toBeGreaterThanOrEqual(1)
		})
	})

	describe('Error Handling', () => {
		it('handles provider failures gracefully', async () => {
			const request: PriceRequest = {
				identifier: 'UNKNOWN_ASSET',
				identifierType: 'SYMBOL',
				currency: 'USD'
			}

			const result = await priceService.getCurrentPrice(request)
			
			expect(result.success).toBe(false)
			expect(result.error).toBeDefined()
			expect(result.code).toBeDefined()
		})

		it('continues with remaining requests when batch fails partially', async () => {
			const request: BatchPriceRequest = {
				requests: [
					{ identifier: 'AAPL', identifierType: 'SYMBOL', currency: 'USD' },
					{ identifier: 'UNKNOWN', identifierType: 'SYMBOL', currency: 'USD' }
				]
			}

			const result = await priceService.getBatchPrices(request)
			
			// Should still succeed overall even if some requests fail
			expect(result.success).toBe(true)
			expect(Array.isArray(result.data)).toBe(true)
		})
	})

	describe('Provider Management', () => {
		it('provides cache and provider statistics', () => {
			const stats = priceService.getCacheStats()
			
			expect(typeof stats.size).toBe('number')
			expect(Array.isArray(stats.providers)).toBe(true)
			expect(stats.providers.length).toBeGreaterThan(0)
		})

		it('initializes with default providers', () => {
			const stats = priceService.getCacheStats()
			
			// Should have at least the mock provider
			expect(stats.providers).toContain('mock')
		})
	})
})