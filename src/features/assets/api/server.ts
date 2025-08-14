/**
 * Server-side functions for asset details
 */

import { createServerFn } from '@tanstack/react-start'
import prisma from '~/lib/prisma'
import { EventType } from '~/generated/prisma/client'
import { portfolioAggregator } from '~/features/portfolio/domain/portfolio-aggregator'
import type { TradeExecution } from '~/features/portfolio/domain/position-calculator'
import { SymbolSchema } from '../domain/validators'

/**
 * Convert event payload to TradeExecution
 */
function parseTradeExecution(event: any): TradeExecution {
  const payload = JSON.parse(event.payload)
  const totalValue = payload.quantity * payload.price
  const fees = payload.fees || 0
  const commission = payload.commission || 0

  const totalCost = payload.direction === 'BUY'
    ? totalValue + fees + commission
    : totalValue - fees - commission

  return {
    id: event.id,
    isin: payload.isin || '',
    symbol: payload.symbol || '',
    assetType: payload.assetType || 'STOCK',
    direction: payload.direction,
    quantity: payload.quantity,
    price: payload.price,
    totalValue,
    fees,
    commission,
    totalCost,
    currency: payload.currency || 'EUR',
    tradeDate: new Date(event.timestamp),
    brokerName: payload.brokerName || '',
    accountId: payload.accountId || ''
  }
}

/**
 * Get detailed asset information including position and trade history
 */
export const getAssetDetail = createServerFn({ method: 'GET' })
  .validator(SymbolSchema)
  .handler(async ({ data: { symbol } }) => {
    try {
      // Get all trade events for this symbol
      const events = await prisma.event.findMany({
        where: {
          eventType: EventType.TRADE_EXECUTED,
        },
        orderBy: {
          timestamp: 'asc',
        },
      })

      if (events.length === 0) {
        return null
      }

      // Convert events to TradeExecution objects and filter by symbol
      const allTrades = events.map(parseTradeExecution)
      const assetTrades = allTrades.filter(trade =>
        trade.symbol.toUpperCase() === symbol.toUpperCase()
      )

      if (assetTrades.length === 0) {
        return null
      }

      // Get enriched position for this asset
      const isin = assetTrades[0]?.isin
      if (!isin) {
        return null
      }

      const position = await portfolioAggregator.getAssetPosition(allTrades, isin)
      if (!position) {
        return null
      }

      return {
        position,
        trades: assetTrades.sort((a, b) => b.tradeDate.getTime() - a.tradeDate.getTime()), // Most recent first
        priceData: position.priceData
      }
    } catch (error) {
      console.error('Error fetching asset detail:', error)
      return null
    }
  })

/**
 * Get trade history for a specific asset
 */
export const getAssetTrades = createServerFn({ method: 'GET' })
  .validator(SymbolSchema)
  .handler(async ({ data: { symbol } }) => {
    try {
      // Get all trade events for this symbol
      const events = await prisma.event.findMany({
        where: {
          eventType: EventType.TRADE_EXECUTED,
        },
        orderBy: {
          timestamp: 'desc', // Most recent first
        },
      })

      // Convert events to TradeExecution objects and filter by symbol
      const allTrades = events.map(parseTradeExecution)
      const assetTrades = allTrades.filter(trade =>
        trade.symbol.toUpperCase() === symbol.toUpperCase()
      )

      return assetTrades
    } catch (error) {
      console.error('Error fetching asset trades:', error)
      return []
    }
  })