import { describe, it, expect, spyOn } from 'bun:test'
import { FIFOPositionCalculator, type TradeExecution, type AssetPosition } from './position-calculator'

describe('FIFOPositionCalculator', () => {
	const calculator = new FIFOPositionCalculator()

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

	describe('calculateAssetPosition', () => {
		it('returns null for empty trades array', () => {
			const result = calculator.calculateAssetPosition([])
			expect(result).toBeNull()
		})

		it('calculates position for single buy trade', () => {
			const trades = [createTradeExecution()]
			const position = calculator.calculateAssetPosition(trades)

			expect(position).toMatchObject({
				isin: 'US0378331005',
				symbol: 'AAPL',
				assetType: 'STOCK',
				currency: 'USD',
				totalBought: 100,
				totalSold: 0,
				currentQuantity: 100,
				averageCostPerShare: 150.02,
				totalBuyValue: 15000,
				totalSellValue: 0,
				totalFeesAndCommissions: 2,
				totalRealizedGain: 0,
				realizedGains: [],
				tradeCount: 1
			})

			expect(position?.totalCostBasis).toBeCloseTo(15002, 1)

			expect(position?.remainingLots).toHaveLength(1)
			expect(position?.remainingLots[0]).toMatchObject({
				tradeId: 'trade-1',
				remainingQuantity: 100,
				costPerShare: 150.02
			})
		})

		it('calculates position with multiple buy trades', () => {
			const trades = [
				createTradeExecution({
					id: 'trade-1',
					quantity: 100,
					price: 150,
					totalValue: 15000,
					totalCost: 15002,
					tradeDate: new Date('2024-01-01')
				}),
				createTradeExecution({
					id: 'trade-2',
					quantity: 50,
					price: 160,
					totalValue: 8000,
					totalCost: 8002,
					tradeDate: new Date('2024-01-02')
				})
			]

			const position = calculator.calculateAssetPosition(trades)
			
			expect(position?.totalBought).toBe(150)
			expect(position?.currentQuantity).toBe(150)
			expect(position?.totalCostBasis).toBe(23004) // 15002 + 8002
			expect(position?.averageCostPerShare).toBeCloseTo(153.36, 2) // 23004 / 150
			expect(position?.remainingLots).toHaveLength(2)
		})

		it('handles FIFO sell logic correctly', () => {
			const trades = [
				// Buy 100 shares at $150
				createTradeExecution({
					id: 'buy-1',
					direction: 'BUY',
					quantity: 100,
					price: 150,
					totalValue: 15000,
					totalCost: 15002,
					tradeDate: new Date('2024-01-01')
				}),
				// Buy 50 shares at $160  
				createTradeExecution({
					id: 'buy-2',
					direction: 'BUY',
					quantity: 50,
					price: 160,
					totalValue: 8000,
					totalCost: 8002,
					tradeDate: new Date('2024-01-02')
				}),
				// Sell 75 shares at $170 (should sell first 75 from first lot)
				createTradeExecution({
					id: 'sell-1',
					direction: 'SELL',
					quantity: 75,
					price: 170,
					totalValue: 12750,
					fees: 1,
					commission: 1,
					totalCost: 12748, // proceeds - fees
					tradeDate: new Date('2024-01-03')
				})
			]

			const position = calculator.calculateAssetPosition(trades)

			expect(position?.totalBought).toBe(150)
			expect(position?.totalSold).toBe(75)
			expect(position?.currentQuantity).toBe(75)
			
			// Remaining lots: 25 from first buy (100-75) + 50 from second buy
			expect(position?.remainingLots).toHaveLength(2)
			expect(position?.remainingLots[0]).toMatchObject({
				tradeId: 'buy-1',
				remainingQuantity: 25,
				costPerShare: 150.02
			})
			expect(position?.remainingLots[1]).toMatchObject({
				tradeId: 'buy-2',
				remainingQuantity: 50,
				costPerShare: 160.04
			})

			// Check realized gains
			expect(position?.realizedGains).toHaveLength(1)
			const realizedGain = position?.realizedGains[0]
			expect(realizedGain).toMatchObject({
				sellTradeId: 'sell-1',
				buyTradeId: 'buy-1',
				quantity: 75,
				sellPrice: 170,
				buyPrice: 150.02
			})

			// Calculate expected realized gain: (170 * 75) - (150.02 * 75) - fees
			const expectedGain = 12750 - (150.02 * 75) - (2 * (75/75)) // fees allocated proportionally
			expect(realizedGain?.realizedGain).toBeCloseTo(expectedGain, 1)
		})

		it('handles complete position closure', () => {
			const trades = [
				createTradeExecution({
					id: 'buy-1',
					direction: 'BUY',
					quantity: 100,
					price: 150,
					totalValue: 15000,
					totalCost: 15002,
					tradeDate: new Date('2024-01-01')
				}),
				createTradeExecution({
					id: 'sell-1',
					direction: 'SELL',
					quantity: 100,
					price: 170,
					totalValue: 17000,
					totalCost: 16998, // proceeds - fees
					tradeDate: new Date('2024-01-02')
				})
			]

			const position = calculator.calculateAssetPosition(trades)

			expect(position?.currentQuantity).toBe(0)
			expect(position?.remainingLots).toHaveLength(0)
			expect(position?.realizedGains).toHaveLength(1)
			expect(position?.totalRealizedGain).toBeCloseTo(1996, 2) // 17000 - 15002 - 2 (sell fees)
		})

		it('handles multiple sells from same lot', () => {
			const trades = [
				// Buy 100 shares
				createTradeExecution({
					id: 'buy-1',
					direction: 'BUY',
					quantity: 100,
					price: 150,
					totalValue: 15000,
					totalCost: 15002,
					tradeDate: new Date('2024-01-01')
				}),
				// Sell 30 shares
				createTradeExecution({
					id: 'sell-1',
					direction: 'SELL',
					quantity: 30,
					price: 160,
					totalValue: 4800,
					totalCost: 4798,
					tradeDate: new Date('2024-01-02')
				}),
				// Sell 40 shares
				createTradeExecution({
					id: 'sell-2',
					direction: 'SELL',
					quantity: 40,
					price: 170,
					totalValue: 6800,
					totalCost: 6798,
					tradeDate: new Date('2024-01-03')
				})
			]

			const position = calculator.calculateAssetPosition(trades)

			expect(position?.currentQuantity).toBe(30) // 100 - 30 - 40
			expect(position?.remainingLots).toHaveLength(1)
			expect(position?.remainingLots[0]?.remainingQuantity).toBe(30)
			expect(position?.realizedGains).toHaveLength(2) // Two separate sell transactions
		})

		it('warns about short positions', () => {
			const consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

			const trades = [
				createTradeExecution({
					id: 'buy-1',
					direction: 'BUY',
					quantity: 50,
					price: 150,
					totalValue: 7500,
					totalCost: 7502,
					tradeDate: new Date('2024-01-01')
				}),
				createTradeExecution({
					id: 'sell-1',
					direction: 'SELL',
					quantity: 75, // Selling more than owned
					price: 170,
					totalValue: 12750,
					totalCost: 12748,
					tradeDate: new Date('2024-01-02')
				})
			]

			const position = calculator.calculateAssetPosition(trades)

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Warning: Asset AAPL has short position of 25 shares')
			)
			expect(position?.currentQuantity).toBe(0) // Clamped to 0 for MVP
			
			consoleSpy.mockRestore()
		})

		it('sorts trades by date for FIFO calculation', () => {
			const trades = [
				// Later trade but should be processed second due to date
				createTradeExecution({
					id: 'buy-2',
					direction: 'BUY',
					quantity: 50,
					price: 160,
					totalValue: 8000,
					totalCost: 8002,
					tradeDate: new Date('2024-01-02')
				}),
				// Earlier trade should be processed first
				createTradeExecution({
					id: 'buy-1',
					direction: 'BUY',
					quantity: 100,
					price: 150,
					totalValue: 15000,
					totalCost: 15002,
					tradeDate: new Date('2024-01-01')
				}),
				// Sell should use FIFO (buy-1 first)
				createTradeExecution({
					id: 'sell-1',
					direction: 'SELL',
					quantity: 75,
					price: 170,
					totalValue: 12750,
					totalCost: 12748,
					tradeDate: new Date('2024-01-03')
				})
			]

			const position = calculator.calculateAssetPosition(trades)

			// Should have remaining lots in chronological order
			expect(position?.remainingLots).toHaveLength(2)
			expect(position?.remainingLots[0]).toMatchObject({
				tradeId: 'buy-1',
				remainingQuantity: 25 // 100 - 75 sold
			})
			expect(position?.remainingLots[1]).toMatchObject({
				tradeId: 'buy-2',
				remainingQuantity: 50 // Untouched
			})
		})
	})

	describe('calculatePortfolioPositions', () => {
		it('returns empty array for no trades', () => {
			const positions = calculator.calculatePortfolioPositions([])
			expect(positions).toEqual([])
		})

		it('groups trades by ISIN and calculates separate positions', () => {
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
				}),
				createTradeExecution({
					id: 'trade-3',
					isin: 'US0378331005', // Same ISIN as trade-1
					symbol: 'AAPL',
					quantity: 25
				})
			]

			const positions = calculator.calculatePortfolioPositions(trades)

			expect(positions).toHaveLength(2)
			
			const applePosition = positions.find(p => p.isin === 'US0378331005')
			const msftPosition = positions.find(p => p.isin === 'US5949181045')

			expect(applePosition?.currentQuantity).toBe(125) // 100 + 25
			expect(msftPosition?.currentQuantity).toBe(50)
		})

		it('excludes positions with zero quantity', () => {
			const trades = [
				createTradeExecution({
					id: 'buy-1',
					direction: 'BUY',
					quantity: 100
				}),
				createTradeExecution({
					id: 'sell-1',
					direction: 'SELL',
					quantity: 100 // Complete closure
				})
			]

			const positions = calculator.calculatePortfolioPositions(trades)
			expect(positions).toHaveLength(0) // Position with 0 quantity excluded
		})

		it('sorts positions by quantity descending', () => {
			const trades = [
				createTradeExecution({
					id: 'trade-1',
					isin: 'US0378331005',
					quantity: 50
				}),
				createTradeExecution({
					id: 'trade-2',
					isin: 'US5949181045',
					quantity: 200
				}),
				createTradeExecution({
					id: 'trade-3',
					isin: 'GOOGL123456789',
					quantity: 75
				})
			]

			const positions = calculator.calculatePortfolioPositions(trades)

			expect(positions[0].currentQuantity).toBe(200) // MSFT
			expect(positions[1].currentQuantity).toBe(75)  // GOOGL
			expect(positions[2].currentQuantity).toBe(50)  // AAPL
		})
	})

	describe('getRealizedGainsForPeriod', () => {
		it('filters realized gains by date range', () => {
			const trades = [
				createTradeExecution({
					id: 'buy-1',
					direction: 'BUY',
					quantity: 300,
					price: 150,
					totalValue: 45000,
					totalCost: 45006,
					tradeDate: new Date('2024-01-01')
				}),
				createTradeExecution({
					id: 'sell-1',
					direction: 'SELL',
					quantity: 100,
					price: 170,
					totalValue: 17000,
					totalCost: 16998,
					tradeDate: new Date('2024-02-15') // Within range
				}),
				createTradeExecution({
					id: 'sell-2',
					direction: 'SELL',
					quantity: 100,
					price: 175,
					totalValue: 17500,
					totalCost: 17498,
					tradeDate: new Date('2024-03-15') // Within range
				}),
				createTradeExecution({
					id: 'sell-3',
					direction: 'SELL',
					quantity: 100,
					price: 180,
					totalValue: 18000,
					totalCost: 17998,
					tradeDate: new Date('2024-04-15') // Outside range
				})
			]

			const position = calculator.calculateAssetPosition(trades)
			expect(position).not.toBeNull()
			
			const gains = calculator.getRealizedGainsForPeriod(
				[position!],
				new Date('2024-02-01'),
				new Date('2024-03-31')
			)

			expect(gains).toHaveLength(2) // Only sells within the date range
			expect(gains[0].sellDate.getTime()).toBeGreaterThanOrEqual(new Date('2024-02-01').getTime())
			expect(gains[0].sellDate.getTime()).toBeLessThanOrEqual(new Date('2024-03-31').getTime())
		})

		it('sorts gains by sell date descending', () => {
			const trades = [
				createTradeExecution({
					id: 'buy-1',
					direction: 'BUY',
					quantity: 200,
					price: 150,
					totalValue: 30000,
					totalCost: 30004,
					tradeDate: new Date('2024-01-01')
				}),
				createTradeExecution({
					id: 'sell-1',
					direction: 'SELL',
					quantity: 100,
					price: 170,
					totalValue: 17000,
					totalCost: 16998,
					tradeDate: new Date('2024-02-15')
				}),
				createTradeExecution({
					id: 'sell-2',
					direction: 'SELL',
					quantity: 100,
					price: 175,
					totalValue: 17500,
					totalCost: 17498,
					tradeDate: new Date('2024-03-15')
				})
			]

			const position = calculator.calculateAssetPosition(trades)
			expect(position).not.toBeNull()
			
			const gains = calculator.getRealizedGainsForPeriod(
				[position!],
				new Date('2024-01-01'),
				new Date('2024-12-31')
			)

			expect(gains).toHaveLength(2)
			expect(gains[0].sellDate.getTime()).toBeGreaterThan(gains[1].sellDate.getTime())
		})
	})

	describe('calculatePortfolioTotals', () => {
		it('calculates portfolio totals correctly', () => {
			const positions: AssetPosition[] = [
				{
					isin: 'US0378331005',
					symbol: 'AAPL',
					assetType: 'STOCK',
					currency: 'USD',
					totalBought: 100,
					totalSold: 0,
					currentQuantity: 100,
					totalCostBasis: 15000,
					averageCostPerShare: 150,
					totalBuyValue: 15000,
					totalSellValue: 0,
					totalFeesAndCommissions: 50,
					totalRealizedGain: 0,
					realizedGains: [],
					remainingLots: [],
					firstTradeDate: new Date('2024-01-01'),
					lastTradeDate: new Date('2024-01-01'),
					tradeCount: 1
				},
				{
					isin: 'US5949181045',
					symbol: 'MSFT',
					assetType: 'STOCK',
					currency: 'USD',
					totalBought: 200,
					totalSold: 50,
					currentQuantity: 150,
					totalCostBasis: 20000,
					averageCostPerShare: 133.33,
					totalBuyValue: 25000,
					totalSellValue: 5000,
					totalFeesAndCommissions: 100,
					totalRealizedGain: 1000,
					realizedGains: [],
					remainingLots: [],
					firstTradeDate: new Date('2024-01-01'),
					lastTradeDate: new Date('2024-02-01'),
					tradeCount: 3
				}
			]

			const totals = calculator.calculatePortfolioTotals(positions)

			expect(totals.totalInvested).toBe(35000) // 15000 + 20000
			expect(totals.totalRealizedGains).toBe(1000) // 0 + 1000
			expect(totals.totalFeesAndCommissions).toBe(150) // 50 + 100
			expect(totals.positionCount).toBe(2)
			expect(totals.totalShares).toBe(250) // 100 + 150
		})

		it('handles empty positions array', () => {
			const totals = calculator.calculatePortfolioTotals([])

			expect(totals).toEqual({
				totalInvested: 0,
				totalRealizedGains: 0,
				totalFeesAndCommissions: 0,
				positionCount: 0,
				totalShares: 0
			})
		})
	})
})