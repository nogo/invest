import { describe, it, expect } from 'bun:test'
import { MockPriceProvider } from './mock-provider'
import type { PriceRequest, BatchPriceRequest } from '../types'

describe('MockPriceProvider', () => {
	const provider = new MockPriceProvider()

	describe('Basic Provider Properties', () => {
		it('has correct name and priority', () => {
			expect(provider.name).toBe('mock')
			expect(provider.priority).toBe(999) // Lowest priority
		})

		it('returns valid config', () => {
			const config = provider.getConfig()
			expect(config).toMatchObject({
				name: 'mock',
				enabled: true,
				priority: 999
			})
			expect(config.config).toBeDefined()
			expect(config.rateLimit).toBeDefined()
		})
	})

	describe('Health Check', () => {
		it('always reports healthy', async () => {
			const isHealthy = await provider.healthCheck()
			expect(isHealthy).toBe(true)
		})
	})

	describe('getCurrentPrice', () => {
		it('returns mock price data for known assets', async () => {
			const request: PriceRequest = {
				identifier: 'US0378331005',
				identifierType: 'ISIN',
				currency: 'USD'
			}

			const result = await provider.getCurrentPrice(request)
			
			expect(result.success).toBe(true)
			expect(result.data).toMatchObject({
				identifier: 'US0378331005',
				identifierType: 'ISIN',
				symbol: 'AAPL',
				name: 'Apple Inc.',
				currency: 'USD'
			})
			expect(result.data?.price).toBeGreaterThan(0)
			expect(result.data?.timestamp).toBeInstanceOf(Date)
			expect(result.data?.change).toBeDefined()
			expect(result.data?.changePercent).toBeDefined()
		})

		it('uses symbol as identifier directly', async () => {
			const request: PriceRequest = {
				identifier: 'AAPL',
				identifierType: 'SYMBOL',
				currency: 'USD'
			}

			const result = await provider.getCurrentPrice(request)
			
			expect(result.success).toBe(true)
			expect(result.data).toMatchObject({
				identifier: 'AAPL',
				identifierType: 'SYMBOL',
				symbol: 'AAPL',
				name: 'Apple Inc.',
				currency: 'USD'
			})
		})

		it('defaults to USD currency when not specified', async () => {
			const request: PriceRequest = {
				identifier: 'AAPL',
				identifierType: 'SYMBOL'
				// No currency specified
			}

			const result = await provider.getCurrentPrice(request)
			
			expect(result.success).toBe(true)
			expect(result.data?.currency).toBe('USD')
		})

		it('uses requested currency', async () => {
			const request: PriceRequest = {
				identifier: 'AAPL',
				identifierType: 'SYMBOL',
				currency: 'EUR'
			}

			const result = await provider.getCurrentPrice(request)
			
			expect(result.success).toBe(true)
			expect(result.data?.currency).toBe('EUR')
		})

		it('generates consistent price for same identifier', async () => {
			const request: PriceRequest = {
				identifier: 'AAPL',
				identifierType: 'SYMBOL',
				currency: 'USD'
			}

			const result1 = await provider.getCurrentPrice(request)
			const result2 = await provider.getCurrentPrice(request)
			
			expect(result1.data?.price).toBe(result2.data?.price)
		})

		it('returns error for unknown symbols', async () => {
			const request: PriceRequest = {
				identifier: 'UNKNOWN',
				identifierType: 'SYMBOL',
				currency: 'USD'
			}

			const result = await provider.getCurrentPrice(request)
			
			expect(result.success).toBe(false)
			expect(result.code).toBe('NOT_FOUND')
		})

		it('generates different prices for different identifiers', async () => {
			const request1: PriceRequest = {
				identifier: 'AAPL',
				identifierType: 'SYMBOL',
				currency: 'USD'
			}
			
			const request2: PriceRequest = {
				identifier: 'MSFT',
				identifierType: 'SYMBOL',
				currency: 'USD'
			}

			const result1 = await provider.getCurrentPrice(request1)
			const result2 = await provider.getCurrentPrice(request2)
			
			expect(result1.data?.price).not.toBe(result2.data?.price)
		})

		it('includes reasonable change values', async () => {
			const request: PriceRequest = {
				identifier: 'AAPL',
				identifierType: 'SYMBOL',
				currency: 'USD'
			}

			const result = await provider.getCurrentPrice(request)
			
			expect(result.data?.change).toBeDefined()
			expect(result.data?.changePercent).toBeDefined()
			expect(result.data?.previousClose).toBeDefined()
			
			// Change should be reasonable relative to price
			const price = result.data!.price
			const change = Math.abs(result.data!.change!)
			expect(change).toBeLessThan(price * 0.2) // Less than 20% change
		})
	})

	describe('getBatchPrices', () => {
		it('returns prices for multiple requests', async () => {
			const request: BatchPriceRequest = {
				requests: [
					{ identifier: 'AAPL', identifierType: 'SYMBOL', currency: 'USD' },
					{ identifier: 'MSFT', identifierType: 'SYMBOL', currency: 'USD' },
					{ identifier: 'US0378331005', identifierType: 'ISIN', currency: 'USD' }
				]
			}

			const result = await provider.getBatchPrices(request)
			
			expect(result.success).toBe(true)
			expect(result.data).toHaveLength(3)
			
			const prices = result.data!
			expect(prices[0].identifier).toBe('AAPL')
			expect(prices[1].identifier).toBe('MSFT')
			expect(prices[2].identifier).toBe('US0378331005')
		})

		it('handles empty batch request', async () => {
			const request: BatchPriceRequest = {
				requests: []
			}

			const result = await provider.getBatchPrices(request)
			
			expect(result.success).toBe(true)
			expect(result.data).toEqual([])
		})

		it('maintains consistency between single and batch requests', async () => {
			const singleRequest: PriceRequest = {
				identifier: 'AAPL',
				identifierType: 'SYMBOL',
				currency: 'USD'
			}

			const batchRequest: BatchPriceRequest = {
				requests: [singleRequest]
			}

			const singleResult = await provider.getCurrentPrice(singleRequest)
			const batchResult = await provider.getBatchPrices(batchRequest)
			
			expect(singleResult.data?.price).toBe(batchResult.data![0].price)
			expect(singleResult.data?.symbol).toBe(batchResult.data![0].symbol)
		})

		it('handles mixed currencies in batch', async () => {
			const request: BatchPriceRequest = {
				requests: [
					{ identifier: 'AAPL', identifierType: 'SYMBOL', currency: 'USD' },
					{ identifier: 'SAP', identifierType: 'SYMBOL', currency: 'EUR' }
				]
			}

			const result = await provider.getBatchPrices(request)
			
			expect(result.success).toBe(true)
			expect(result.data).toHaveLength(2)
			expect(result.data![0].currency).toBe('USD')
			expect(result.data![1].currency).toBe('EUR')
		})
	})

	describe('Price Generation Logic', () => {
		it('generates prices in reasonable range', async () => {
			const identifiers = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA']
			
			for (const identifier of identifiers) {
				const request: PriceRequest = {
					identifier,
					identifierType: 'SYMBOL',
					currency: 'USD'
				}

				const result = await provider.getCurrentPrice(request)
				const price = result.data!.price

				expect(price).toBeGreaterThan(10) // Not penny stock
				expect(price).toBeLessThan(10000) // Not unreasonably high
			}
		})

		it('generates deterministic prices based on identifier', async () => {
			// Same identifier should always generate same price for known assets
			const results = []
			for (let i = 0; i < 5; i++) {
				const result = await provider.getCurrentPrice({
					identifier: 'AAPL',
					identifierType: 'SYMBOL',
					currency: 'USD'
				})
				if (result.success) {
					results.push(result.data!.price)
				}
			}

			// All prices should be the same
			const uniquePrices = [...new Set(results)]
			expect(uniquePrices).toHaveLength(1)
		})

		it('calculates change percentage correctly', async () => {
			const request: PriceRequest = {
				identifier: 'AAPL',
				identifierType: 'SYMBOL',
				currency: 'USD'
			}

			const result = await provider.getCurrentPrice(request)
			const data = result.data!
			
			const expectedChangePercent = (data.change! / data.previousClose!) * 100
			expect(data.changePercent).toBeCloseTo(expectedChangePercent, 2)
		})

		it('ensures previousClose + change = price', async () => {
			const request: PriceRequest = {
				identifier: 'AAPL',
				identifierType: 'SYMBOL',
				currency: 'USD'
			}

			const result = await provider.getCurrentPrice(request)
			const data = result.data!
			
			const calculatedPrice = data.previousClose! + data.change!
			expect(calculatedPrice).toBeCloseTo(data.price, 2)
		})
	})

	describe('Error Handling', () => {
		it('returns errors for unknown identifiers', async () => {
			const requests: PriceRequest[] = [
				{ identifier: '', identifierType: 'SYMBOL', currency: 'USD' }, // Empty identifier
				{ identifier: 'UNKNOWN123', identifierType: 'SYMBOL', currency: 'USD' },
				{ identifier: 'SPECIAL@CHARS#', identifierType: 'SYMBOL', currency: 'EUR' }
			]

			for (const request of requests) {
				const result = await provider.getCurrentPrice(request)
				expect(result.success).toBe(false)
			}
		})

		it('handles batch requests with unknown identifiers gracefully', async () => {
			const request: BatchPriceRequest = {
				requests: [
					{ identifier: 'UNKNOWN1', identifierType: 'SYMBOL', currency: 'USD' },
					{ identifier: 'UNKNOWN2', identifierType: 'SYMBOL', currency: 'USD' },
					{ identifier: 'UNKNOWN3', identifierType: 'SYMBOL', currency: 'USD' }
				]
			}

			const result = await provider.getBatchPrices(request)
			expect(result.success).toBe(true)
			expect(result.data).toHaveLength(0) // No known assets found
		})

		it('filters out unknown assets in batch requests', async () => {
			const request: BatchPriceRequest = {
				requests: [
					{ identifier: 'AAPL', identifierType: 'SYMBOL', currency: 'USD' }, // Known
					{ identifier: 'UNKNOWN', identifierType: 'SYMBOL', currency: 'USD' }, // Unknown
					{ identifier: 'MSFT', identifierType: 'SYMBOL', currency: 'USD' } // Known
				]
			}

			const result = await provider.getBatchPrices(request)
			expect(result.success).toBe(true)
			expect(result.data).toHaveLength(2) // Only known assets returned
		})
	})
})