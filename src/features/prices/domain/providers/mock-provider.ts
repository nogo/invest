/**
 * Mock price provider for development and testing
 * Provides realistic price data without external API dependencies
 */

import type {
	PriceProvider,
	PriceRequest,
	BatchPriceRequest,
	PriceData,
	PriceServiceResponse,
	ProviderConfig,
	Currency
} from '../types'

/**
 * Mock price data for common assets
 */
const MOCK_PRICES: Record<string, { price: number; name: string; change?: number }> = {
	// US Stocks
	'AAPL': { price: 178.25, name: 'Apple Inc.', change: 2.15 },
	'MSFT': { price: 384.52, name: 'Microsoft Corporation', change: -1.28 },
	'GOOGL': { price: 141.83, name: 'Alphabet Inc.', change: 0.95 },
	'AMZN': { price: 153.46, name: 'Amazon.com Inc.', change: -2.31 },
	'TSLA': { price: 248.87, name: 'Tesla Inc.', change: 8.42 },
	'NVDA': { price: 875.34, name: 'NVIDIA Corporation', change: 12.67 },
	'META': { price: 512.18, name: 'Meta Platforms Inc.', change: 3.87 },
	'NFLX': { price: 487.23, name: 'Netflix Inc.', change: -5.12 },
	
	// European Stocks (by symbol - would normally use ISIN)
	'SAP': { price: 142.75, name: 'SAP SE', change: 1.45 },
	'ASML': { price: 683.20, name: 'ASML Holding NV', change: -8.30 },
	'NESN': { price: 104.32, name: 'Nestlé S.A.', change: 0.78 },
	
	// Popular ETFs
	'VOO': { price: 445.67, name: 'Vanguard S&P 500 ETF', change: 1.23 },
	'QQQ': { price: 385.92, name: 'Invesco QQQ Trust', change: 2.87 },
	'VTI': { price: 242.18, name: 'Vanguard Total Stock Market ETF', change: 0.94 },
	'SPY': { price: 445.89, name: 'SPDR S&P 500 ETF Trust', change: 1.21 }
}

/**
 * ISIN to Symbol mapping for realistic data
 */
const ISIN_TO_SYMBOL: Record<string, string> = {
	// Apple
	'US0378331005': 'AAPL',
	// Microsoft
	'US5949181045': 'MSFT',
	// Google/Alphabet
	'US02079K3059': 'GOOGL',
	// Amazon
	'US0231351067': 'AMZN',
	// Tesla
	'US88160R1014': 'TSLA',
	// NVIDIA
	'US67066G1040': 'NVDA',
	// Meta
	'US30303M1027': 'META',
	// SAP
	'DE0007164600': 'SAP',
	// ASML
	'NL0010273215': 'ASML'
}

/**
 * Simple currency conversion rates (EUR/USD)
 * In real implementation, this would come from a forex API
 */
const EXCHANGE_RATES: Record<string, number> = {
	'EUR_TO_USD': 1.085,
	'USD_TO_EUR': 0.922
}

export class MockPriceProvider implements PriceProvider {
	name = 'mock'
	priority = 999 // Lowest priority (used as fallback)

	private convertCurrency(price: number, fromCurrency: Currency, toCurrency: Currency): number {
		if (fromCurrency === toCurrency) return price
		
		if (fromCurrency === 'USD' && toCurrency === 'EUR') {
			return price * (EXCHANGE_RATES.USD_TO_EUR || 0.922)
		}
		
		if (fromCurrency === 'EUR' && toCurrency === 'USD') {
			return price * (EXCHANGE_RATES.EUR_TO_USD || 1.085)
		}
		
		return price
	}

	private getSymbolFromIdentifier(identifier: string, identifierType: 'SYMBOL' | 'ISIN'): string {
		if (identifierType === 'SYMBOL') {
			return identifier.toUpperCase()
		}
		
		// For ISIN, try to map to known symbol
		return ISIN_TO_SYMBOL[identifier] || identifier
	}

	private generatePriceData(
		identifier: string,
		identifierType: 'SYMBOL' | 'ISIN',
		requestedCurrency: Currency = 'USD'
	): PriceData | null {
		const symbol = this.getSymbolFromIdentifier(identifier, identifierType)
		const mockData = MOCK_PRICES[symbol]
		
		if (!mockData) return null

		// Most US stocks are priced in USD, European in EUR by default
		const baseCurrency: Currency = ['SAP', 'ASML', 'NESN'].includes(symbol) ? 'EUR' : 'USD'
		const basePrice = mockData.price
		const convertedPrice = this.convertCurrency(basePrice, baseCurrency, requestedCurrency)

		const change = mockData.change || 0
		const convertedChange = this.convertCurrency(change, baseCurrency, requestedCurrency)
		const previousClose = convertedPrice - convertedChange
		const changePercent = previousClose !== 0 ? (convertedChange / previousClose) * 100 : 0

		return {
			identifier,
			identifierType,
			symbol,
			name: mockData.name,
			price: convertedPrice,
			currency: requestedCurrency,
			timestamp: new Date(),
			change: convertedChange,
			changePercent: changePercent,
			previousClose: previousClose
		}
	}

	async getCurrentPrice(request: PriceRequest): Promise<PriceServiceResponse<PriceData>> {
		// Simulate network delay
		await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))

		const priceData = this.generatePriceData(
			request.identifier,
			request.identifierType,
			request.currency
		)

		if (!priceData) {
			return {
				success: false,
				error: `Price data not available for ${request.identifier}`,
				code: 'NOT_FOUND'
			}
		}

		return {
			success: true,
			data: priceData
		}
	}

	async getBatchPrices(request: BatchPriceRequest): Promise<PriceServiceResponse<PriceData[]>> {
		// Simulate network delay for batch request
		await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100))

		const results: PriceData[] = []
		
		for (const priceRequest of request.requests) {
			const priceData = this.generatePriceData(
				priceRequest.identifier,
				priceRequest.identifierType,
				priceRequest.currency
			)
			
			if (priceData) {
				results.push(priceData)
			}
		}

		return {
			success: true,
			data: results
		}
	}

	async healthCheck(): Promise<boolean> {
		// Mock provider is always healthy
		return true
	}

	getConfig(): ProviderConfig {
		return {
			name: this.name,
			enabled: true,
			priority: this.priority,
			rateLimit: {
				requestsPerMinute: 1000, // No real rate limits for mock
			},
			config: {
				description: 'Mock provider for development and testing',
				supportedCurrencies: ['USD', 'EUR'],
				supportedIdentifiers: ['SYMBOL', 'ISIN']
			}
		}
	}
}