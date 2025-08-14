/**
 * FIFO Position Calculator
 * Implements First-In-First-Out logic for calculating cost basis and realized gains
 */

import type { Currency } from '~/features/prices/domain/types'

/**
 * Trade execution data extracted from events
 */
export interface TradeExecution {
	id: string
	isin: string
	symbol: string
	assetType: 'STOCK' | 'ETF'
	direction: 'BUY' | 'SELL'
	quantity: number
	price: number
	totalValue: number // quantity * price
	fees: number
	commission: number
	totalCost: number // totalValue + fees + commission (for buys) or totalValue - fees - commission (for sells)
	currency: Currency
	tradeDate: Date
	brokerName: string
	accountId: string
}

/**
 * Individual buy lot for FIFO tracking
 */
export interface BuyLot {
	tradeId: string
	originalQuantity: number
	remainingQuantity: number
	pricePerShare: number
	totalCost: number
	costPerShare: number // includes fees allocated proportionally
	tradeDate: Date
	currency: Currency
}

/**
 * Realized gain/loss from a sell transaction
 */
export interface RealizedGain {
	sellTradeId: string
	buyTradeId: string
	quantity: number
	sellPrice: number
	buyPrice: number // cost basis including fees
	grossProceeds: number // quantity * sellPrice
	costBasis: number // quantity * buyPrice
	realizedGain: number // grossProceeds - costBasis
	sellDate: Date
	buyDate: Date
	currency: Currency
}

/**
 * Current position for an asset
 */
export interface AssetPosition {
	isin: string
	symbol: string
	assetType: 'STOCK' | 'ETF'
	currency: Currency
	
	// Quantities
	totalBought: number
	totalSold: number
	currentQuantity: number
	
	// Cost basis (FIFO)
	totalCostBasis: number
	averageCostPerShare: number
	
	// Transaction totals
	totalBuyValue: number // sum of buy quantities * prices
	totalSellValue: number // sum of sell quantities * prices
	totalFeesAndCommissions: number
	
	// Realized gains
	totalRealizedGain: number
	realizedGains: RealizedGain[]
	
	// Current lots (remaining buy positions)
	remainingLots: BuyLot[]
	
	// Metadata
	firstTradeDate: Date
	lastTradeDate: Date
	tradeCount: number
}

/**
 * FIFO Position Calculator
 */
export class FIFOPositionCalculator {
	
	/**
	 * Calculate position for a single asset from its trade history
	 */
	calculateAssetPosition(trades: TradeExecution[]): AssetPosition | null {
		if (trades.length === 0) return null

		// Sort trades by date (earliest first) for FIFO
		const sortedTrades = [...trades].sort((a, b) => a.tradeDate.getTime() - b.tradeDate.getTime())
		
		const firstTrade = sortedTrades[0]
		if (!firstTrade) return null

		const buys = sortedTrades.filter(t => t.direction === 'BUY')
		const sells = sortedTrades.filter(t => t.direction === 'SELL')

		// Initialize lots from buy trades
		let lots: BuyLot[] = buys.map(buy => ({
			tradeId: buy.id,
			originalQuantity: buy.quantity,
			remainingQuantity: buy.quantity,
			pricePerShare: buy.price,
			totalCost: buy.totalCost,
			costPerShare: buy.totalCost / buy.quantity, // includes allocated fees
			tradeDate: buy.tradeDate,
			currency: buy.currency
		}))

		const realizedGains: RealizedGain[] = []

		// Process sells in chronological order using FIFO
		for (const sell of sells) {
			let remainingSellQuantity = sell.quantity
			
			while (remainingSellQuantity > 0 && lots.length > 0) {
				const oldestLot = lots[0]
				if (!oldestLot || oldestLot.remainingQuantity <= 0) {
					lots.shift()
					continue
				}

				const quantityToSell = Math.min(remainingSellQuantity, oldestLot.remainingQuantity)
				const grossProceeds = quantityToSell * sell.price
				const costBasis = quantityToSell * oldestLot.costPerShare
				const sellFees = (sell.fees + sell.commission) * (quantityToSell / sell.quantity)
				
				// Create realized gain record
				const realizedGain: RealizedGain = {
					sellTradeId: sell.id,
					buyTradeId: oldestLot.tradeId,
					quantity: quantityToSell,
					sellPrice: sell.price,
					buyPrice: oldestLot.costPerShare,
					grossProceeds: grossProceeds,
					costBasis: costBasis,
					realizedGain: grossProceeds - costBasis - sellFees,
					sellDate: sell.tradeDate,
					buyDate: oldestLot.tradeDate,
					currency: sell.currency
				}
				
				realizedGains.push(realizedGain)

				// Update lot
				oldestLot.remainingQuantity -= quantityToSell
				remainingSellQuantity -= quantityToSell

				// Remove depleted lot
				if (oldestLot.remainingQuantity <= 0) {
					lots.shift()
				}
			}

			// If we still have sell quantity remaining, it means we're short
			// For MVP, we'll ignore short positions
			if (remainingSellQuantity > 0) {
				console.warn(`Warning: Asset ${firstTrade.symbol} has short position of ${remainingSellQuantity} shares`)
			}
		}

		// Calculate position metrics
		const totalBought = buys.reduce((sum, t) => sum + t.quantity, 0)
		const totalSold = sells.reduce((sum, t) => sum + t.quantity, 0)
		const currentQuantity = Math.max(0, totalBought - totalSold)
		
		const totalBuyValue = buys.reduce((sum, t) => sum + t.totalValue, 0)
		const totalSellValue = sells.reduce((sum, t) => sum + t.totalValue, 0)
		const totalFeesAndCommissions = sortedTrades.reduce((sum, t) => sum + t.fees + t.commission, 0)
		
		const totalCostBasis = lots.reduce((sum, lot) => sum + (lot.remainingQuantity * lot.costPerShare), 0)
		const averageCostPerShare = currentQuantity > 0 ? totalCostBasis / currentQuantity : 0
		
		const totalRealizedGain = realizedGains.reduce((sum, gain) => sum + gain.realizedGain, 0)

		return {
			isin: firstTrade.isin,
			symbol: firstTrade.symbol,
			assetType: firstTrade.assetType,
			currency: firstTrade.currency,
			
			totalBought,
			totalSold,
			currentQuantity,
			
			totalCostBasis,
			averageCostPerShare,
			
			totalBuyValue,
			totalSellValue,
			totalFeesAndCommissions,
			
			totalRealizedGain,
			realizedGains,
			
			remainingLots: lots.filter(lot => lot.remainingQuantity > 0),
			
			firstTradeDate: sortedTrades[0]?.tradeDate || new Date(),
			lastTradeDate: sortedTrades[sortedTrades.length - 1]?.tradeDate || new Date(),
			tradeCount: sortedTrades.length
		}
	}

	/**
	 * Calculate positions for multiple assets
	 */
	calculatePortfolioPositions(allTrades: TradeExecution[]): AssetPosition[] {
		// Group trades by ISIN (more stable than symbol)
		const tradesByAsset = new Map<string, TradeExecution[]>()
		
		for (const trade of allTrades) {
			const key = trade.isin
			if (!tradesByAsset.has(key)) {
				tradesByAsset.set(key, [])
			}
			tradesByAsset.get(key)!.push(trade)
		}

		const positions: AssetPosition[] = []
		
		for (const [, trades] of tradesByAsset) {
			const position = this.calculateAssetPosition(trades)
			if (position && position.currentQuantity > 0) {
				positions.push(position)
			}
		}

		// Sort by current value (requires price data, so we'll sort by quantity for now)
		return positions.sort((a, b) => b.currentQuantity - a.currentQuantity)
	}

	/**
	 * Get realized gains for a specific time period
	 */
	getRealizedGainsForPeriod(
		positions: AssetPosition[],
		startDate: Date,
		endDate: Date
	): RealizedGain[] {
		const gains: RealizedGain[] = []
		
		for (const position of positions) {
			const periodGains = position.realizedGains.filter(gain =>
				gain.sellDate >= startDate && gain.sellDate <= endDate
			)
			gains.push(...periodGains)
		}
		
		return gains.sort((a, b) => b.sellDate.getTime() - a.sellDate.getTime())
	}

	/**
	 * Calculate portfolio totals
	 */
	calculatePortfolioTotals(positions: AssetPosition[]) {
		return {
			totalInvested: positions.reduce((sum, p) => sum + p.totalCostBasis, 0),
			totalRealizedGains: positions.reduce((sum, p) => sum + p.totalRealizedGain, 0),
			totalFeesAndCommissions: positions.reduce((sum, p) => sum + p.totalFeesAndCommissions, 0),
			positionCount: positions.length,
			totalShares: positions.reduce((sum, p) => sum + p.currentQuantity, 0)
		}
	}
}