import { describe, it, expect, beforeEach } from 'bun:test'
import { PortfolioAggregator } from './portfolio-aggregator'
import type { TradeExecution } from './position-calculator'

describe('PortfolioAggregator', () => {
	const aggregator = new PortfolioAggregator()
	
	const createTradeExecution = (overrides: Partial<TradeExecution> = {}): TradeExecution => ({
		id: 'trade-1',
		isin: 'US0378331005',
		symbol: 'AAPL',
		assetType: 'STOCK',
		direction: 'BUY',
		quantity: 100,
		price: 150,
		totalValue: 15000,
		fees: 1,
		commission: 1,
		totalCost: 15002,
		currency: 'USD',
		tradeDate: new Date('2024-01-01'),
		brokerName: 'Test Broker',
		accountId: 'ACC123',
		...overrides
	})

	describe('getEnrichedPositions', () => {
		it('returns empty array for no trades', async () => {
			const result = await aggregator.getEnrichedPositions([])
			expect(result).toEqual([])
		})

		it('enriches positions with market data for known assets', async () => {
			const trades = [
				createTradeExecution({
					id: 'buy-1',
					isin: 'US0378331005', // Apple ISIN - should be known by mock provider
					symbol: 'AAPL',
					quantity: 100,
					price: 150,
					totalCost: 15002
				})
			]

			const result = await aggregator.getEnrichedPositions(trades)

			expect(result).toHaveLength(1)
			const position = result[0]
			
			expect(position).toMatchObject({
				isin: 'US0378331005',
				symbol: 'AAPL',
				currentQuantity: 100
			})
			
			expect(position.totalCostBasis).toBeCloseTo(15002, 1)

			// Should have enrichment data
			expect(typeof position.currentMarketValue).toBe('number')
			expect(typeof position.unrealizedGain).toBe('number')
			expect(typeof position.unrealizedGainPercent).toBe('number')
			expect(typeof position.totalGain).toBe('number')
			expect(typeof position.totalGainPercent).toBe('number')

			// Should have price data or error
			expect(
				position.priceData !== undefined || position.priceError !== undefined
			).toBe(true)
		})

		it('handles positions without price data', async () => {
			const trades = [
				createTradeExecution({
					isin: 'UNKNOWN_ISIN',
					symbol: 'UNKNOWN',
					quantity: 100,
					totalCost: 15002
				})
			]

			const result = await aggregator.getEnrichedPositions(trades)

			expect(result).toHaveLength(1)
			const position = result[0]
			
			expect(position.currentMarketValue).toBe(0)
			expect(position.priceError).toBe('Price data not available')
		})

		it('calculates gains correctly with price data', async () => {
			const trades = [
				createTradeExecution({
					id: 'buy-1',
					isin: 'US0378331005', // Known asset
					quantity: 100,
					price: 150,
					totalValue: 15000,
					totalCost: 15002
				})
			]

			const result = await aggregator.getEnrichedPositions(trades)
			const position = result[0]

			if (position.priceData && position.currentPrice && position.currentPrice > 0) {
				// Verify calculations
				expect(position.currentMarketValue).toBe(position.currentQuantity * position.currentPrice)
				expect(position.unrealizedGain).toBe(position.currentMarketValue - position.totalCostBasis)
				
				if (position.totalCostBasis > 0) {
					expect(position.unrealizedGainPercent).toBeCloseTo(
						(position.unrealizedGain / position.totalCostBasis) * 100,
						2
					)
				}
			}
		})

		it('handles multiple assets', async () => {
			const trades = [
				createTradeExecution({
					id: 'trade-1',
					isin: 'US0378331005',
					symbol: 'AAPL',
					quantity: 100
				}),
				createTradeExecution({
					id: 'trade-2',
					isin: 'US5949181045',
					symbol: 'MSFT',
					quantity: 50
				})
			]

			const result = await aggregator.getEnrichedPositions(trades)

			expect(result).toHaveLength(2)
			
			const applePosition = result.find(p => p.symbol === 'AAPL')
			const msftPosition = result.find(p => p.symbol === 'MSFT')

			expect(applePosition).toBeDefined()
			expect(msftPosition).toBeDefined()
		})
	})

	describe('getPortfolioSummary', () => {
		it('calculates summary for empty portfolio', async () => {
			const summary = await aggregator.getPortfolioSummary([])

			expect(summary).toMatchObject({
				totalInvested: 0,
				totalMarketValue: 0,
				totalUnrealizedGain: 0,
				totalRealizedGain: 0,
				totalGain: 0,
				positionCount: 0,
				totalShares: 0,
				averagePositionSize: 0,
				totalFeesAndCommissions: 0,
				positionsWithoutPrices: 0
			})

			expect(summary.currencyBreakdown).toEqual([])
			expect(summary.lastUpdated).toBeInstanceOf(Date)
		})

		it('calculates portfolio summary correctly', async () => {
			const trades = [
				createTradeExecution({
					id: 'buy-1',
					isin: 'US0378331005',
					symbol: 'AAPL',
					quantity: 100,
					price: 150,
					totalValue: 15000,
					totalCost: 15002,
					fees: 1,
					commission: 1
				})
			]

			const summary = await aggregator.getPortfolioSummary(trades)

			expect(summary.totalInvested).toBeCloseTo(15002, 1)
			expect(summary.positionCount).toBe(1)
			expect(summary.totalShares).toBe(100)
			expect(summary.totalFeesAndCommissions).toBe(2)

			expect(summary.currencyBreakdown).toHaveLength(1)
			expect(summary.currencyBreakdown[0].currency).toBe('USD')
			expect(summary.currencyBreakdown[0].positions).toBe(1)
			expect(summary.currencyBreakdown[0].invested).toBeCloseTo(15002, 1)

			expect(typeof summary.averagePositionSize).toBe('number')
			expect(typeof summary.totalMarketValue).toBe('number')
			expect(summary.lastUpdated).toBeInstanceOf(Date)
		})

		it('handles multiple currencies in breakdown', async () => {
			const trades = [
				createTradeExecution({
					id: 'buy-1',
					symbol: 'AAPL',
					currency: 'USD',
					quantity: 100,
					totalCost: 15000
				}),
				createTradeExecution({
					id: 'buy-2',
					isin: 'DE0007164600', // SAP ISIN - EUR asset
					symbol: 'SAP',
					currency: 'EUR',
					quantity: 50,
					totalCost: 5000
				})
			]

			const summary = await aggregator.getPortfolioSummary(trades)

			expect(summary.currencyBreakdown.length).toBeGreaterThanOrEqual(1)
			
			const usdBreakdown = summary.currencyBreakdown.find(c => c.currency === 'USD')
			expect(usdBreakdown).toBeDefined()
			
			// Might have EUR breakdown if SAP is recognized
			if (summary.currencyBreakdown.length > 1) {
				const eurBreakdown = summary.currencyBreakdown.find(c => c.currency === 'EUR')
				expect(eurBreakdown).toBeDefined()
			}
		})

		it('calculates percentage gains correctly', async () => {
			const trades = [
				createTradeExecution({
					id: 'buy-1',
					isin: 'US0378331005', // Known asset
					quantity: 100,
					price: 100, // Lower buy price
					totalValue: 10000,
					totalCost: 10002
				})
			]

			const summary = await aggregator.getPortfolioSummary(trades)

			expect(summary.totalInvested).toBe(10002)
			
			// If price data is available and higher than cost basis
			if (summary.totalMarketValue > summary.totalInvested) {
				expect(summary.totalUnrealizedGainPercent).toBeGreaterThan(0)
				expect(summary.totalGainPercent).toBeGreaterThan(0)
			}
		})
	})

	describe('getAssetPosition', () => {
		it('returns null for asset with no trades', async () => {
			const result = await aggregator.getAssetPosition([], 'US0378331005')
			expect(result).toBeNull()
		})

		it('returns enriched position for specific asset', async () => {
			const trades = [
				createTradeExecution({
					isin: 'US0378331005',
					quantity: 100,
					totalCost: 15002
				}),
				createTradeExecution({
					isin: 'US5949181045', // Different asset, should be filtered out
					quantity: 50
				})
			]

			const result = await aggregator.getAssetPosition(trades, 'US0378331005')

			expect(result).not.toBeNull()
			expect(result?.isin).toBe('US0378331005')
			expect(result?.currentQuantity).toBe(100)
			
			// Should have enrichment data
			expect(typeof result?.currentMarketValue).toBe('number')
			expect(typeof result?.unrealizedGain).toBe('number')
		})

		it('filters trades to only include specified asset', async () => {
			const trades = [
				createTradeExecution({
					id: 'aapl-1',
					isin: 'US0378331005',
					symbol: 'AAPL',
					quantity: 100
				}),
				createTradeExecution({
					id: 'msft-1',
					isin: 'US5949181045',
					symbol: 'MSFT',
					quantity: 200
				})
			]

			const applePosition = await aggregator.getAssetPosition(trades, 'US0378331005')
			const msftPosition = await aggregator.getAssetPosition(trades, 'US5949181045')

			expect(applePosition?.currentQuantity).toBe(100)
			expect(msftPosition?.currentQuantity).toBe(200)
		})

		it('handles asset with price data', async () => {
			const trades = [createTradeExecution({ isin: 'US0378331005' })]

			const result = await aggregator.getAssetPosition(trades, 'US0378331005')

			expect(result).not.toBeNull()
			
			// Should have price data or error
			expect(
				result?.priceData !== undefined || result?.priceError !== undefined
			).toBe(true)
		})
	})

	describe('calculatePortfolioTimeline', () => {
		it('returns empty array for no trades', () => {
			const result = aggregator.calculatePortfolioTimeline([])
			expect(result).toEqual([])
		})

		it('groups trades by month', () => {
			const trades = [
				createTradeExecution({
					id: 'trade-1',
					quantity: 100,
					totalCost: 15000,
					tradeDate: new Date('2024-01-15')
				}),
				createTradeExecution({
					id: 'trade-2',
					quantity: 50,
					totalCost: 8000,
					tradeDate: new Date('2024-01-20') // Same month
				}),
				createTradeExecution({
					id: 'trade-3',
					quantity: 25,
					totalCost: 4000,
					tradeDate: new Date('2024-02-10') // Next month
				})
			]

			const timeline = aggregator.calculatePortfolioTimeline(trades)

			expect(timeline).toHaveLength(2) // Two months
			expect(timeline[0].date).toBe('2024-01')
			expect(timeline[1].date).toBe('2024-02')

			// Should have cumulative data
			expect(timeline[0].invested).toBe(23000) // 15000 + 8000
			expect(timeline[1].invested).toBe(27000) // 15000 + 8000 + 4000
		})

		it('sorts timeline chronologically', () => {
			const trades = [
				createTradeExecution({
					id: 'trade-1',
					tradeDate: new Date('2024-03-15')
				}),
				createTradeExecution({
					id: 'trade-2',
					tradeDate: new Date('2024-01-15')
				}),
				createTradeExecution({
					id: 'trade-3',
					tradeDate: new Date('2024-02-15')
				})
			]

			const timeline = aggregator.calculatePortfolioTimeline(trades)

			expect(timeline[0].date).toBe('2024-01')
			expect(timeline[1].date).toBe('2024-02')
			expect(timeline[2].date).toBe('2024-03')
		})

		it('includes position data for each time point', () => {
			const trades = [
				createTradeExecution({
					id: 'trade-1',
					isin: 'US0378331005',
					quantity: 100,
					totalCost: 15000,
					tradeDate: new Date('2024-01-15')
				})
			]

			const timeline = aggregator.calculatePortfolioTimeline(trades)

			expect(timeline).toHaveLength(1)
			expect(timeline[0].positions).toHaveLength(1)
			expect(timeline[0].positions[0]).toMatchObject({
				isin: 'US0378331005',
				currentQuantity: 100
			})
		})

		it('handles multiple assets in timeline', () => {
			const trades = [
				createTradeExecution({
					id: 'trade-1',
					isin: 'US0378331005',
					symbol: 'AAPL',
					quantity: 100,
					totalCost: 15000,
					tradeDate: new Date('2024-01-15')
				}),
				createTradeExecution({
					id: 'trade-2',
					isin: 'US5949181045',
					symbol: 'MSFT',
					quantity: 50,
					totalCost: 10000,
					tradeDate: new Date('2024-01-20')
				})
			]

			const timeline = aggregator.calculatePortfolioTimeline(trades)

			expect(timeline).toHaveLength(1)
			expect(timeline[0].positions).toHaveLength(2) // Two different assets
			expect(timeline[0].invested).toBe(25000) // Total across both assets
		})
	})

	describe('Integration Tests', () => {
		it('processes complex trading scenario correctly', async () => {
			const trades = [
				// Initial AAPL purchase
				createTradeExecution({
					id: 'buy-1',
					isin: 'US0378331005',
					symbol: 'AAPL',
					direction: 'BUY',
					quantity: 200,
					price: 150,
					totalValue: 30000,
					totalCost: 30005,
					tradeDate: new Date('2024-01-01')
				}),
				// Partial AAPL sale
				createTradeExecution({
					id: 'sell-1',
					isin: 'US0378331005',
					symbol: 'AAPL',
					direction: 'SELL',
					quantity: 100,
					price: 170,
					totalValue: 17000,
					totalCost: 16995,
					tradeDate: new Date('2024-02-01')
				}),
				// MSFT purchase
				createTradeExecution({
					id: 'buy-2',
					isin: 'US5949181045',
					symbol: 'MSFT',
					direction: 'BUY',
					quantity: 100,
					price: 300,
					totalValue: 30000,
					totalCost: 30010,
					tradeDate: new Date('2024-02-15')
				})
			]

			const summary = await aggregator.getPortfolioSummary(trades)

			expect(summary.positionCount).toBe(2) // AAPL and MSFT
			expect(summary.totalShares).toBe(200) // 100 AAPL + 100 MSFT
			
			// Should have realized gains from AAPL sale
			expect(summary.totalRealizedGain).toBeGreaterThan(0)
			
			// Should have proper currency breakdown
			expect(summary.currencyBreakdown).toHaveLength(1)
			expect(summary.currencyBreakdown[0].currency).toBe('USD')
			expect(summary.currencyBreakdown[0].positions).toBe(2)
		})

		it('handles edge cases gracefully', async () => {
			// Test with zero quantity trades, unknown assets, etc.
			const trades = [
				createTradeExecution({
					isin: 'UNKNOWN_ISIN',
					symbol: 'UNKNOWN',
					quantity: 1, // Very small quantity
					price: 0.01, // Very small price
					totalValue: 0.01,
					totalCost: 0.02
				})
			]

			const summary = await aggregator.getPortfolioSummary(trades)

			expect(summary).toBeDefined()
			expect(summary.positionCount).toBe(1)
			expect(summary.totalInvested).toBeCloseTo(0.02, 2)
		})
	})
})