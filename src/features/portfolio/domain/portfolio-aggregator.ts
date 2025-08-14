/**
 * Portfolio Aggregation Service
 * Combines position calculation with price data for complete portfolio view
 */

import { FIFOPositionCalculator, type AssetPosition, type TradeExecution } from './position-calculator'
import { priceService } from '~/features/prices/domain/price-service'
import type { PriceData, PortfolioPosition, Currency } from '~/features/prices/domain/types'

/**
 * Position enriched with current market data
 */
export interface EnrichedPosition extends AssetPosition {
	// Current market data
	currentPrice?: number
	priceData?: PriceData
	currentMarketValue: number
	
	// Performance metrics
	unrealizedGain: number
	unrealizedGainPercent: number
	totalGain: number // realized + unrealized
	totalGainPercent: number
	
	// Daily performance (if available)
	dailyChange?: number
	dailyChangePercent?: number
	
	// Metadata
	priceLastUpdated?: Date
	priceError?: string
}

/**
 * Complete portfolio summary
 */
export interface PortfolioSummary {
	// Investment totals
	totalInvested: number
	totalMarketValue: number
	
	// Performance
	totalUnrealizedGain: number
	totalUnrealizedGainPercent: number
	totalRealizedGain: number
	totalGain: number
	totalGainPercent: number
	
	// Daily performance
	totalDailyChange: number
	totalDailyChangePercent: number
	
	// Portfolio composition
	positionCount: number
	totalShares: number
	averagePositionSize: number
	
	// Fees and costs
	totalFeesAndCommissions: number
	
	// Currency breakdown
	currencyBreakdown: Array<{
		currency: Currency
		positions: number
		invested: number
		marketValue: number
		percentage: number
	}>
	
	// Metadata
	lastUpdated: Date
	pricesLastUpdated?: Date
	positionsWithoutPrices: number
}

/**
 * Portfolio aggregation service
 */
export class PortfolioAggregator {
	private calculator = new FIFOPositionCalculator()

	/**
	 * Get enriched positions with current market data
	 */
	async getEnrichedPositions(trades: TradeExecution[]): Promise<EnrichedPosition[]> {
		// Calculate positions using FIFO
		const positions = this.calculator.calculatePortfolioPositions(trades)
		
		if (positions.length === 0) return []

		// Prepare requests for current prices
		const portfolioPositions: PortfolioPosition[] = positions.map(position => ({
			isin: position.isin,
			symbol: position.symbol,
			quantity: position.currentQuantity,
			currency: position.currency
		}))

		// Get current price data
		const enrichedPositions = await priceService.enrichPortfolioPositions(portfolioPositions)
		const priceMap = new Map<string, PriceData>()
		
		for (const enriched of enrichedPositions) {
			if (enriched.priceData) {
				const key = `${enriched.isin || enriched.symbol}:${enriched.currency}`
				priceMap.set(key, enriched.priceData)
			}
		}

		// Combine position data with price data
		return positions.map(position => {
			const priceKey = `${position.isin}:${position.currency}`
			const priceData = priceMap.get(priceKey)
			
			const currentPrice = priceData?.price || 0
			const currentMarketValue = position.currentQuantity * currentPrice
			
			const unrealizedGain = currentMarketValue - position.totalCostBasis
			const unrealizedGainPercent = position.totalCostBasis > 0 
				? (unrealizedGain / position.totalCostBasis) * 100 
				: 0
			
			const totalGain = position.totalRealizedGain + unrealizedGain
			const totalInvestmentBase = position.totalBuyValue // Total amount originally invested
			const totalGainPercent = totalInvestmentBase > 0 
				? (totalGain / totalInvestmentBase) * 100 
				: 0

			// Calculate daily change if price data includes it
			const dailyChange = priceData?.change && position.currentQuantity 
				? priceData.change * position.currentQuantity 
				: undefined
			const dailyChangePercent = priceData?.changePercent

			const enriched: EnrichedPosition = {
				...position,
				currentPrice,
				priceData,
				currentMarketValue,
				unrealizedGain,
				unrealizedGainPercent,
				totalGain,
				totalGainPercent,
				dailyChange,
				dailyChangePercent,
				priceLastUpdated: priceData?.timestamp,
				priceError: priceData ? undefined : 'Price data not available'
			}

			return enriched
		})
	}

	/**
	 * Calculate complete portfolio summary
	 */
	async getPortfolioSummary(trades: TradeExecution[]): Promise<PortfolioSummary> {
		const enrichedPositions = await this.getEnrichedPositions(trades)
		
		// Calculate totals
		const totalInvested = enrichedPositions.reduce((sum, p) => sum + p.totalCostBasis, 0)
		const totalMarketValue = enrichedPositions.reduce((sum, p) => sum + p.currentMarketValue, 0)
		const totalRealizedGain = enrichedPositions.reduce((sum, p) => sum + p.totalRealizedGain, 0)
		const totalUnrealizedGain = enrichedPositions.reduce((sum, p) => sum + p.unrealizedGain, 0)
		const totalGain = totalRealizedGain + totalUnrealizedGain
		
		const totalUnrealizedGainPercent = totalInvested > 0 
			? (totalUnrealizedGain / totalInvested) * 100 
			: 0
		const totalGainPercent = totalInvested > 0 
			? (totalGain / totalInvested) * 100 
			: 0

		// Daily changes
		const totalDailyChange = enrichedPositions.reduce((sum, p) => sum + (p.dailyChange || 0), 0)
		const previousValue = totalMarketValue - totalDailyChange
		const totalDailyChangePercent = previousValue > 0 
			? (totalDailyChange / previousValue) * 100 
			: 0

		// Portfolio composition
		const positionCount = enrichedPositions.length
		const totalShares = enrichedPositions.reduce((sum, p) => sum + p.currentQuantity, 0)
		const averagePositionSize = positionCount > 0 ? totalMarketValue / positionCount : 0
		const totalFeesAndCommissions = enrichedPositions.reduce((sum, p) => sum + p.totalFeesAndCommissions, 0)
		const positionsWithoutPrices = enrichedPositions.filter(p => !p.priceData).length

		// Currency breakdown
		const currencyMap = new Map<Currency, { positions: number; invested: number; marketValue: number }>()
		
		for (const position of enrichedPositions) {
			const currency = position.currency
			if (!currencyMap.has(currency)) {
				currencyMap.set(currency, { positions: 0, invested: 0, marketValue: 0 })
			}
			
			const breakdown = currencyMap.get(currency)!
			breakdown.positions += 1
			breakdown.invested += position.totalCostBasis
			breakdown.marketValue += position.currentMarketValue
		}
		
		const currencyBreakdown = Array.from(currencyMap.entries()).map(([currency, data]) => ({
			currency,
			positions: data.positions,
			invested: data.invested,
			marketValue: data.marketValue,
			percentage: totalMarketValue > 0 ? (data.marketValue / totalMarketValue) * 100 : 0
		}))

		// Find latest price update
		const pricesLastUpdated = enrichedPositions
			.map(p => p.priceLastUpdated)
			.filter((date): date is Date => date !== undefined)
			.sort((a, b) => b.getTime() - a.getTime())[0]

		return {
			totalInvested,
			totalMarketValue,
			totalUnrealizedGain,
			totalUnrealizedGainPercent,
			totalRealizedGain,
			totalGain,
			totalGainPercent,
			totalDailyChange,
			totalDailyChangePercent,
			positionCount,
			totalShares,
			averagePositionSize,
			totalFeesAndCommissions,
			currencyBreakdown,
			lastUpdated: new Date(),
			pricesLastUpdated,
			positionsWithoutPrices
		}
	}

	/**
	 * Get positions for a specific asset
	 */
	async getAssetPosition(trades: TradeExecution[], isin: string): Promise<EnrichedPosition | null> {
		const assetTrades = trades.filter(t => t.isin === isin)
		if (assetTrades.length === 0) return null

		const position = this.calculator.calculateAssetPosition(assetTrades)
		if (!position) return null

		// Get price data for this asset
		const priceResponse = await priceService.getCurrentPrice({
			identifier: position.isin,
			identifierType: 'ISIN',
			currency: position.currency
		})

		const priceData = priceResponse.success ? priceResponse.data : undefined
		const currentPrice = priceData?.price || 0
		const currentMarketValue = position.currentQuantity * currentPrice
		
		const unrealizedGain = currentMarketValue - position.totalCostBasis
		const unrealizedGainPercent = position.totalCostBasis > 0 
			? (unrealizedGain / position.totalCostBasis) * 100 
			: 0
		
		const totalGain = position.totalRealizedGain + unrealizedGain
		const totalGainPercent = position.totalBuyValue > 0 
			? (totalGain / position.totalBuyValue) * 100 
			: 0

		return {
			...position,
			currentPrice,
			priceData,
			currentMarketValue,
			unrealizedGain,
			unrealizedGainPercent,
			totalGain,
			totalGainPercent,
			dailyChange: priceData?.change ? priceData.change * position.currentQuantity : undefined,
			dailyChangePercent: priceData?.changePercent,
			priceLastUpdated: priceData?.timestamp,
			priceError: priceData ? undefined : 'Price data not available'
		}
	}

	/**
	 * Get portfolio timeline data (for charts)
	 */
	calculatePortfolioTimeline(trades: TradeExecution[]): Array<{
		date: string
		invested: number
		positions: AssetPosition[]
	}> {
		if (trades.length === 0) return []

		// Sort trades by date
		const sortedTrades = [...trades].sort((a, b) => a.tradeDate.getTime() - b.tradeDate.getTime())
		
		// Group trades by month for timeline
		const monthlyData = new Map<string, TradeExecution[]>()
		
		for (const trade of sortedTrades) {
			const monthKey = trade.tradeDate.toISOString().slice(0, 7) // YYYY-MM
			if (!monthlyData.has(monthKey)) {
				monthlyData.set(monthKey, [])
			}
			monthlyData.get(monthKey)!.push(trade)
		}

		// Calculate cumulative positions at each month
		const timeline: Array<{ date: string; invested: number; positions: AssetPosition[] }> = []
		let cumulativeTrades: TradeExecution[] = []
		
		for (const [monthKey, monthTrades] of Array.from(monthlyData.entries()).sort()) {
			cumulativeTrades.push(...monthTrades)
			
			const positions = this.calculator.calculatePortfolioPositions(cumulativeTrades)
			const totalInvested = positions.reduce((sum, p) => sum + p.totalCostBasis, 0)
			
			timeline.push({
				date: monthKey,
				invested: totalInvested,
				positions: [...positions] // Clone for safety
			})
		}

		return timeline
	}
}

// Export singleton instance
export const portfolioAggregator = new PortfolioAggregator()