import { describe, it, expect } from 'bun:test'
import { TradeFormSchema, type TradeFormData } from './validators'

describe('Transaction Validators', () => {
	describe('TradeFormSchema', () => {
		const validTradeData: TradeFormData = {
			isin: 'US0378331005',
			symbol: 'AAPL',
			assetType: 'STOCK',
			direction: 'BUY',
			quantity: 100,
			price: 150.25,
			tradeDate: '2024-01-15',
			commission: 1.0,
			fees: 0.5,
			currency: 'USD',
			accountId: 'ACC123',
			brokerName: 'Interactive Brokers',
			exchange: 'NASDAQ',
			notes: 'Test trade'
		}

		it('validates complete valid trade form data', () => {
			const result = TradeFormSchema.safeParse(validTradeData)
			expect(result.success).toBe(true)
			
			if (result.success) {
				expect(result.data).toEqual(validTradeData)
			}
		})

		it('validates minimal required fields with defaults', () => {
			const minimalData = {
				isin: 'US0378331005',
				symbol: 'AAPL',
				assetType: 'STOCK',
				direction: 'BUY',
				quantity: 100,
				price: 150.25,
				tradeDate: '2024-01-15',
				accountId: 'ACC123',
				brokerName: 'Interactive Brokers'
			}

			const result = TradeFormSchema.safeParse(minimalData)
			expect(result.success).toBe(true)
			
			if (result.success) {
				expect(result.data.commission).toBe(0)
				expect(result.data.fees).toBe(0)
				expect(result.data.currency).toBe('USD')
			}
		})

		it('validates ISIN length requirement', () => {
			// Too short
			const shortIsin = { ...validTradeData, isin: 'US037833100' } // 11 chars
			expect(TradeFormSchema.safeParse(shortIsin).success).toBe(false)

			// Too long  
			const longIsin = { ...validTradeData, isin: 'US0378331005X' } // 13 chars
			expect(TradeFormSchema.safeParse(longIsin).success).toBe(false)

			// Correct length
			const correctIsin = { ...validTradeData, isin: 'US0378331005' } // 12 chars
			expect(TradeFormSchema.safeParse(correctIsin).success).toBe(true)
		})

		it('validates required symbol', () => {
			const noSymbol = { ...validTradeData, symbol: '' }
			expect(TradeFormSchema.safeParse(noSymbol).success).toBe(false)

			const validSymbol = { ...validTradeData, symbol: 'AAPL' }
			expect(TradeFormSchema.safeParse(validSymbol).success).toBe(true)
		})

		it('validates asset types', () => {
			const stockTrade = { ...validTradeData, assetType: 'STOCK' }
			const etfTrade = { ...validTradeData, assetType: 'ETF' }
			const invalidTrade = { ...validTradeData, assetType: 'BOND' }

			expect(TradeFormSchema.safeParse(stockTrade).success).toBe(true)
			expect(TradeFormSchema.safeParse(etfTrade).success).toBe(true)
			expect(TradeFormSchema.safeParse(invalidTrade).success).toBe(false)
		})

		it('validates trade directions', () => {
			const buyTrade = { ...validTradeData, direction: 'BUY' }
			const sellTrade = { ...validTradeData, direction: 'SELL' }
			const invalidTrade = { ...validTradeData, direction: 'SHORT' }

			expect(TradeFormSchema.safeParse(buyTrade).success).toBe(true)
			expect(TradeFormSchema.safeParse(sellTrade).success).toBe(true)
			expect(TradeFormSchema.safeParse(invalidTrade).success).toBe(false)
		})

		it('validates positive quantity', () => {
			const zeroQuantity = { ...validTradeData, quantity: 0 }
			const negativeQuantity = { ...validTradeData, quantity: -10 }
			const positiveQuantity = { ...validTradeData, quantity: 100 }

			expect(TradeFormSchema.safeParse(zeroQuantity).success).toBe(false)
			expect(TradeFormSchema.safeParse(negativeQuantity).success).toBe(false)
			expect(TradeFormSchema.safeParse(positiveQuantity).success).toBe(true)
		})

		it('validates positive price', () => {
			const zeroPrice = { ...validTradeData, price: 0 }
			const negativePrice = { ...validTradeData, price: -10.50 }
			const positivePrice = { ...validTradeData, price: 150.25 }

			expect(TradeFormSchema.safeParse(zeroPrice).success).toBe(false)
			expect(TradeFormSchema.safeParse(negativePrice).success).toBe(false)
			expect(TradeFormSchema.safeParse(positivePrice).success).toBe(true)
		})

		it('validates date format', () => {
			const validDate = { ...validTradeData, tradeDate: '2024-01-15' }
			const invalidFormat1 = { ...validTradeData, tradeDate: '01/15/2024' }
			const invalidFormat2 = { ...validTradeData, tradeDate: '2024-1-15' }
			const invalidFormat3 = { ...validTradeData, tradeDate: '2024-01-15T10:30:00' }

			expect(TradeFormSchema.safeParse(validDate).success).toBe(true)
			expect(TradeFormSchema.safeParse(invalidFormat1).success).toBe(false)
			expect(TradeFormSchema.safeParse(invalidFormat2).success).toBe(false)
			expect(TradeFormSchema.safeParse(invalidFormat3).success).toBe(false)
		})

		it('validates commission cannot be negative', () => {
			const negativeCommission = { ...validTradeData, commission: -1 }
			const zeroCommission = { ...validTradeData, commission: 0 }
			const positiveCommission = { ...validTradeData, commission: 5.50 }

			expect(TradeFormSchema.safeParse(negativeCommission).success).toBe(false)
			expect(TradeFormSchema.safeParse(zeroCommission).success).toBe(true)
			expect(TradeFormSchema.safeParse(positiveCommission).success).toBe(true)
		})

		it('validates fees cannot be negative', () => {
			const negativeFees = { ...validTradeData, fees: -0.5 }
			const zeroFees = { ...validTradeData, fees: 0 }
			const positiveFees = { ...validTradeData, fees: 1.25 }

			expect(TradeFormSchema.safeParse(negativeFees).success).toBe(false)
			expect(TradeFormSchema.safeParse(zeroFees).success).toBe(true)
			expect(TradeFormSchema.safeParse(positiveFees).success).toBe(true)
		})

		it('validates supported currencies', () => {
			const supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'CHF', 'JPY']
			
			for (const currency of supportedCurrencies) {
				const trade = { ...validTradeData, currency }
				expect(TradeFormSchema.safeParse(trade).success).toBe(true)
			}

			const unsupportedCurrency = { ...validTradeData, currency: 'BTC' }
			expect(TradeFormSchema.safeParse(unsupportedCurrency).success).toBe(false)
		})

		it('validates required account ID', () => {
			const noAccountId = { ...validTradeData, accountId: '' }
			const validAccountId = { ...validTradeData, accountId: 'ACC123' }

			expect(TradeFormSchema.safeParse(noAccountId).success).toBe(false)
			expect(TradeFormSchema.safeParse(validAccountId).success).toBe(true)
		})

		it('validates required broker name', () => {
			const noBrokerName = { ...validTradeData, brokerName: '' }
			const validBrokerName = { ...validTradeData, brokerName: 'Interactive Brokers' }

			expect(TradeFormSchema.safeParse(noBrokerName).success).toBe(false)
			expect(TradeFormSchema.safeParse(validBrokerName).success).toBe(true)
		})

		it('handles optional fields', () => {
			const withOptionals = {
				...validTradeData,
				exchange: 'NYSE',
				notes: 'Important trade'
			}

			const withoutOptionals = {
				isin: validTradeData.isin,
				symbol: validTradeData.symbol,
				assetType: validTradeData.assetType,
				direction: validTradeData.direction,
				quantity: validTradeData.quantity,
				price: validTradeData.price,
				tradeDate: validTradeData.tradeDate,
				accountId: validTradeData.accountId,
				brokerName: validTradeData.brokerName
			}

			expect(TradeFormSchema.safeParse(withOptionals).success).toBe(true)
			expect(TradeFormSchema.safeParse(withoutOptionals).success).toBe(true)
		})

		it('provides meaningful error messages', () => {
			const invalidData = {
				isin: 'INVALID', // Too short
				symbol: '', // Required but empty
				assetType: 'INVALID', // Not in enum
				direction: 'INVALID', // Not in enum  
				quantity: -10, // Must be positive
				price: 0, // Must be positive
				tradeDate: 'invalid-date', // Wrong format
				commission: -1, // Cannot be negative
				fees: -1, // Cannot be negative
				currency: 'INVALID', // Not supported
				accountId: '', // Required but empty
				brokerName: '' // Required but empty
			}

			const result = TradeFormSchema.safeParse(invalidData)
			expect(result.success).toBe(false)
			
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThan(0)
				
				// Check for specific error messages
				const errors = result.error.issues.map(issue => issue.message)
				expect(errors.some(msg => msg.includes('ISIN must be 12 characters'))).toBe(true)
				expect(errors.some(msg => msg.includes('Symbol is required'))).toBe(true)
				expect(errors.some(msg => msg.includes('Quantity must be positive'))).toBe(true)
				expect(errors.some(msg => msg.includes('Price must be positive'))).toBe(true)
				expect(errors.some(msg => msg.includes('Date must be in YYYY-MM-DD format'))).toBe(true)
			}
		})
	})
})