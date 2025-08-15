import { describe, it, expect } from 'bun:test'
import { 
	TradeExecutedPayload,
	SymbolChangedPayload, 
	DividendReceivedPayload,
	StockSplitExecutedPayload,
	TradeCorrectedPayload,
	validateSymbolChangedPayload,
	validateDividendPayload,
	validateStockSplitPayload,
	validateTradeCorrectedPayload,
	exampleStockTrade,
	exampleSymbolChange,
	exampleDividend,
	exampleStockSplit
} from './trading-events'

describe('Trading Events Validation', () => {
	describe('TradeExecutedPayload', () => {
		it('validates a complete valid trade', () => {
			const validTrade = {
				tradeId: 'T123456789',
				orderId: 'O987654321',
				isin: 'US0378331005',
				symbol: 'AAPL',
				assetType: 'STOCK',
				cusip: '037833100',
				direction: 'BUY',
				quantity: 100,
				price: 150.25,
				totalAmount: 15025.00,
				tradeDate: '2024-01-15',
				settlementDate: '2024-01-17',
				commission: 1.00,
				fees: 0.50,
				currency: 'USD',
				exchangeRate: 1,
				accountId: 'ACC123',
				brokerName: 'Interactive Brokers',
				exchange: 'NASDAQ',
				marketType: 'REGULAR'
			}

			const result = TradeExecutedPayload.safeParse(validTrade)
			expect(result.success).toBe(true)
		})

		it('validates minimal required fields with defaults', () => {
			const minimalTrade = {
				tradeId: 'T123456789',
				isin: 'US0378331005',
				symbol: 'AAPL',
				assetType: 'STOCK',
				direction: 'BUY',
				quantity: 100,
				price: 150.25,
				totalAmount: 15025.00,
				tradeDate: '2024-01-15',
				settlementDate: '2024-01-17',
				accountId: 'ACC123',
				brokerName: 'Interactive Brokers'
			}

			const result = TradeExecutedPayload.safeParse(minimalTrade)
			expect(result.success).toBe(true)
			
			if (result.success) {
				expect(result.data.commission).toBe(0)
				expect(result.data.fees).toBe(0)
				expect(result.data.currency).toBe('USD')
				expect(result.data.exchangeRate).toBe(1)
				expect(result.data.marketType).toBe('REGULAR')
			}
		})

		it('rejects invalid ISIN format', () => {
			const invalidTrade = {
				...exampleStockTrade,
				isin: 'INVALID_ISIN'
			}

			const result = TradeExecutedPayload.safeParse(invalidTrade)
			expect(result.success).toBe(false)
		})

		it('rejects negative quantity', () => {
			const invalidTrade = {
				...exampleStockTrade,
				quantity: -10
			}

			const result = TradeExecutedPayload.safeParse(invalidTrade)
			expect(result.success).toBe(false)
		})

		it('rejects invalid date format', () => {
			const invalidTrade = {
				...exampleStockTrade,
				tradeDate: '01/15/2024' // Wrong format
			}

			const result = TradeExecutedPayload.safeParse(invalidTrade)
			expect(result.success).toBe(false)
		})

		it('validates all supported asset types', () => {
			const stockTrade = { ...exampleStockTrade, assetType: 'STOCK' }
			const etfTrade = { ...exampleStockTrade, assetType: 'ETF' }

			expect(TradeExecutedPayload.safeParse(stockTrade).success).toBe(true)
			expect(TradeExecutedPayload.safeParse(etfTrade).success).toBe(true)
		})

		it('validates all supported directions', () => {
			const buyTrade = { ...exampleStockTrade, direction: 'BUY' }
			const sellTrade = { ...exampleStockTrade, direction: 'SELL' }

			expect(TradeExecutedPayload.safeParse(buyTrade).success).toBe(true)
			expect(TradeExecutedPayload.safeParse(sellTrade).success).toBe(true)
		})

		it('validates all supported currencies', () => {
			const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'CHF', 'JPY']
			
			for (const currency of currencies) {
				const trade = { ...exampleStockTrade, currency }
				const result = TradeExecutedPayload.safeParse(trade)
				expect(result.success).toBe(true)
			}
		})

		it('rejects negative fees and commission', () => {
			const tradeWithNegativeFees = { ...exampleStockTrade, fees: -1 }
			const tradeWithNegativeCommission = { ...exampleStockTrade, commission: -1 }

			expect(TradeExecutedPayload.safeParse(tradeWithNegativeFees).success).toBe(false)
			expect(TradeExecutedPayload.safeParse(tradeWithNegativeCommission).success).toBe(false)
		})
	})

	describe('SymbolChangedPayload', () => {
		it('validates example symbol change', () => {
			const result = validateSymbolChangedPayload(exampleSymbolChange)
			expect(result).toEqual(exampleSymbolChange)
		})

		it('validates minimal symbol change', () => {
			const minimalChange = {
				isin: 'US30303M1027',
				oldSymbol: 'FB',
				newSymbol: 'META',
				effectiveDate: '2022-06-09',
				reason: 'CORPORATE_REBRANDING'
			}

			const result = validateSymbolChangedPayload(minimalChange)
			expect(result.isin).toBe('US30303M1027')
			expect(result.oldSymbol).toBe('FB')
			expect(result.newSymbol).toBe('META')
			expect(result.reason).toBe('CORPORATE_REBRANDING')
		})

		it('rejects invalid ISIN in symbol change', () => {
			const invalidChange = {
				...exampleSymbolChange,
				isin: 'INVALID'
			}

			expect(() => validateSymbolChangedPayload(invalidChange)).toThrow()
		})

		it('validates all symbol change reasons', () => {
			const reasons = [
				'CORPORATE_REBRANDING',
				'MERGER_ACQUISITION',
				'SPINOFF',
				'EXCHANGE_MOVE',
				'COMPLIANCE_REQUIRED',
				'BUSINESS_RESTRUCTURE',
				'OTHER'
			]

			for (const reason of reasons) {
				const change = { ...exampleSymbolChange, reason }
				const result = validateSymbolChangedPayload(change)
				expect(result.reason).toBe(reason)
			}
		})
	})

	describe('DividendReceivedPayload', () => {
		it('validates example dividend', () => {
			const result = validateDividendPayload(exampleDividend)
			expect(result).toEqual(exampleDividend)
		})

		it('validates minimal dividend', () => {
			const minimalDividend = {
				isin: 'US0378331005',
				symbol: 'AAPL',
				dividendAmount: 0.24,
				totalAmount: 24.00,
				sharesHeld: 100,
				exDate: '2024-02-09',
				paymentDate: '2024-02-15',
				accountId: 'ACC123',
				brokerName: 'Interactive Brokers'
			}

			const result = validateDividendPayload(minimalDividend)
			expect(result.dividendAmount).toBe(0.24)
			expect(result.totalAmount).toBe(24.00)
			expect(result.sharesHeld).toBe(100)
			expect(result.currency).toBe('USD') // Default
			expect(result.taxWithheld).toBe(0) // Default
		})

		it('rejects negative dividend amounts', () => {
			const invalidDividend = {
				...exampleDividend,
				dividendAmount: -0.24
			}

			expect(() => validateDividendPayload(invalidDividend)).toThrow()
		})

		it('validates all dividend types', () => {
			const types = ['ORDINARY', 'QUALIFIED', 'SPECIAL', 'RETURN_OF_CAPITAL']

			for (const dividendType of types) {
				const dividend = { ...exampleDividend, dividendType }
				const result = validateDividendPayload(dividend)
				expect(result.dividendType).toBe(dividendType)
			}
		})

		it('calculates total amount correctly', () => {
			const dividend = {
				...exampleDividend,
				dividendAmount: 0.25,
				sharesHeld: 200,
				totalAmount: 50.00 // 0.25 * 200
			}

			const result = validateDividendPayload(dividend)
			expect(result.totalAmount).toBe(50.00)
		})
	})

	describe('StockSplitExecutedPayload', () => {
		it('validates example stock split', () => {
			const result = validateStockSplitPayload(exampleStockSplit)
			expect(result).toEqual(exampleStockSplit)
		})

		it('validates 2:1 split', () => {
			const split = {
				isin: 'US0378331005',
				symbol: 'AAPL',
				splitRatio: '2:1',
				splitMultiplier: 2.0,
				sharesBeforeSplit: 100,
				sharesAfterSplit: 200,
				effectiveDate: '2024-08-31',
				accountId: 'ACC123',
				brokerName: 'Interactive Brokers'
			}

			const result = validateStockSplitPayload(split)
			expect(result.splitMultiplier).toBe(2.0)
			expect(result.sharesBeforeSplit).toBe(100)
			expect(result.sharesAfterSplit).toBe(200)
		})

		it('validates fractional split ratios', () => {
			const split = {
				...exampleStockSplit,
				splitRatio: '3:2',
				splitMultiplier: 1.5,
				sharesBeforeSplit: 100,
				sharesAfterSplit: 150
			}

			const result = validateStockSplitPayload(split)
			expect(result.splitMultiplier).toBe(1.5)
		})

		it('rejects negative share amounts', () => {
			const invalidSplit = {
				...exampleStockSplit,
				sharesBeforeSplit: -100
			}

			expect(() => validateStockSplitPayload(invalidSplit)).toThrow()
		})
	})

	describe('TradeCorrectedPayload', () => {
		it('validates trade correction', () => {
			const correction = {
				originalTradeId: 'T123456789',
				correctionReason: 'Price adjustment',
				correctedTrade: {
					...exampleStockTrade,
					price: 151.00, // Corrected price
					totalAmount: 15100.00
				},
				correctionDate: '2024-01-16',
				correctionId: 'C123456789'
			}

			const result = validateTradeCorrectedPayload(correction)
			expect(result.originalTradeId).toBe('T123456789')
			expect(result.correctedTrade.price).toBe(151.00)
		})

		it('validates nested trade payload in correction', () => {
			const correctionWithInvalidTrade = {
				originalTradeId: 'T123456789',
				correctionReason: 'Price adjustment',
				correctedTrade: {
					...exampleStockTrade,
					quantity: -100 // Invalid quantity
				},
				correctionDate: '2024-01-16',
				correctionId: 'C123456789'
			}

			expect(() => validateTradeCorrectedPayload(correctionWithInvalidTrade)).toThrow()
		})
	})

	describe('Example Data Validation', () => {
		it('validates all provided examples', () => {
			// These should not throw errors
			expect(() => TradeExecutedPayload.parse(exampleStockTrade)).not.toThrow()
			expect(() => validateSymbolChangedPayload(exampleSymbolChange)).not.toThrow()
			expect(() => validateDividendPayload(exampleDividend)).not.toThrow()
			expect(() => validateStockSplitPayload(exampleStockSplit)).not.toThrow()
		})

		it('example trade has correct calculated fields', () => {
			const trade = TradeExecutedPayload.parse(exampleStockTrade)
			
			// totalAmount should equal quantity * price
			expect(trade.totalAmount).toBe(trade.quantity * trade.price)
			
			// Check ISIN format
			expect(trade.isin).toMatch(/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/)
		})

		it('example dividend has consistent amounts', () => {
			const dividend = validateDividendPayload(exampleDividend)
			
			// totalAmount should equal dividendAmount * sharesHeld
			expect(dividend.totalAmount).toBe(dividend.dividendAmount * dividend.sharesHeld)
		})

		it('example stock split has consistent share counts', () => {
			const split = validateStockSplitPayload(exampleStockSplit)
			
			// sharesAfterSplit should equal sharesBeforeSplit * splitMultiplier
			expect(split.sharesAfterSplit).toBe(split.sharesBeforeSplit * split.splitMultiplier)
		})
	})

	describe('Error Handling', () => {
		it('provides descriptive error messages', () => {
			const invalidTrade = {
				tradeId: 'T123',
				// Missing required fields
			}

			const result = TradeExecutedPayload.safeParse(invalidTrade)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThan(0)
			}
		})

		it('validates required vs optional fields', () => {
			const tradeWithoutOptionalFields = {
				tradeId: 'T123456789',
				isin: 'US0378331005',
				symbol: 'AAPL',
				assetType: 'STOCK',
				direction: 'BUY',
				quantity: 100,
				price: 150.25,
				totalAmount: 15025.00,
				tradeDate: '2024-01-15',
				settlementDate: '2024-01-17',
				accountId: 'ACC123',
				brokerName: 'Interactive Brokers'
				// No optional fields like orderId, cusip, exchange, etc.
			}

			const result = TradeExecutedPayload.safeParse(tradeWithoutOptionalFields)
			expect(result.success).toBe(true)
		})
	})
})