/**
 * Price service types and interfaces
 * Provides abstraction for multiple price data providers
 */

export type Currency = 'EUR' | 'USD'
export type IdentifierType = 'SYMBOL' | 'ISIN'
export type AssetType = 'STOCK' | 'ETF'

/**
 * Request for current price data
 */
export interface PriceRequest {
	identifier: string
	identifierType: IdentifierType
	currency?: Currency
}

/**
 * Price data response
 */
export interface PriceData {
	identifier: string
	identifierType: IdentifierType
	symbol: string
	name: string
	price: number
	currency: Currency
	timestamp: Date
	change?: number
	changePercent?: number
	previousClose?: number
}

/**
 * Batch price request for portfolio
 */
export interface BatchPriceRequest {
	requests: PriceRequest[]
}

/**
 * Service response wrapper
 */
export interface PriceServiceResponse<T> {
	success: boolean
	data?: T
	error?: string
	code?: 'NOT_FOUND' | 'RATE_LIMITED' | 'INVALID_SYMBOL' | 'NETWORK_ERROR' | 'API_ERROR'
	retryAfter?: number
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
	name: string
	enabled: boolean
	priority: number
	rateLimit?: {
		requestsPerMinute: number
		requestsPerDay?: number
	}
	config?: Record<string, unknown>
}

/**
 * Price provider interface - implemented by all data sources
 */
export interface PriceProvider {
	name: string
	priority: number
	
	/**
	 * Get current price for single asset
	 */
	getCurrentPrice(request: PriceRequest): Promise<PriceServiceResponse<PriceData>>
	
	/**
	 * Get current prices for multiple assets (batch)
	 */
	getBatchPrices(request: BatchPriceRequest): Promise<PriceServiceResponse<PriceData[]>>
	
	/**
	 * Check if provider is available and healthy
	 */
	healthCheck(): Promise<boolean>
	
	/**
	 * Get provider configuration
	 */
	getConfig(): ProviderConfig
}

/**
 * Cache entry for price data
 */
export interface CacheEntry<T> {
	data: T
	timestamp: Date
	expiresAt: Date
}

/**
 * Portfolio position for batch price lookup
 */
export interface PortfolioPosition {
	isin: string
	symbol: string
	quantity: number
	currency: Currency
}

/**
 * Enriched position with current price data
 */
export interface EnrichedPosition extends PortfolioPosition {
	priceData?: PriceData
	currentValue?: number
	error?: string
}