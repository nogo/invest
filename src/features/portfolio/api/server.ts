import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import prisma from '~/lib/prisma'
import { EventType } from '~/generated/prisma/client'
import { portfolioAggregator } from '../domain/portfolio-aggregator'
import type { TradeExecution } from '../domain/position-calculator'

export interface InvestmentTimelinePoint {
  date: string
  invested: number
  value: number
  month: string
}

export interface PortfolioSummary {
  totalValue: number
  investedCapital: number
  totalReturn: number
  totalReturnPercent: number
  dayChange: number
  dayChangePercent: number
}

// Filter schema for portfolio queries
const PortfolioFilterSchema = z.object({
  q: z.string().optional(),
  assetType: z.enum(['STOCK', 'ETF', 'ALL']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export type PortfolioFilter = z.infer<typeof PortfolioFilterSchema>

/**
 * Apply filters to trade events
 */
function applyFiltersToEvents(events: any[], filters: PortfolioFilter) {
  return events.filter(event => {
    const payload = JSON.parse(event.payload)
    
    // Apply search query filter (symbol, name, or ISIN)
    if (filters.q) {
      const query = filters.q.toLowerCase()
      const matchesSymbol = payload.symbol?.toLowerCase().includes(query)
      const matchesName = payload.name?.toLowerCase().includes(query)
      const matchesISIN = payload.isin?.toLowerCase().includes(query)
      
      if (!matchesSymbol && !matchesName && !matchesISIN) {
        return false
      }
    }
    
    // Apply asset type filter
    if (filters.assetType && filters.assetType !== 'ALL' && payload.assetType !== filters.assetType) {
      return false
    }
    
    // Apply date range filters
    if (filters.dateFrom || filters.dateTo) {
      const tradeDate = new Date(event.timestamp).toISOString().split('T')[0]
      
      if (filters.dateFrom && tradeDate && tradeDate < filters.dateFrom) {
        return false
      }
      
      if (filters.dateTo && tradeDate && tradeDate > filters.dateTo) {
        return false
      }
    }
    
    return true
  })
}

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

// Server function to get investment timeline data from events
export const getInvestmentTimeline = createServerFn({
  method: 'GET',
}).validator(PortfolioFilterSchema).handler(async ({ data: filters }): Promise<InvestmentTimelinePoint[]> => {
  try {
    // Get all trade events ordered by timestamp
    const allEvents = await prisma.event.findMany({
      where: {
        eventType: EventType.TRADE_EXECUTED,
      },
      orderBy: {
        timestamp: 'asc',
      },
    })

    // Apply filters
    const events = applyFiltersToEvents(allEvents, filters)

    if (events.length === 0) {
      return []
    }

    // Convert events to TradeExecution objects
    const trades = events.map(parseTradeExecution)

    // Use portfolio aggregator to calculate timeline
    const timelineData = portfolioAggregator.calculatePortfolioTimeline(trades)
    
    // Format for chart
    const timeline = timelineData.map(point => {
      const [year, month] = point.date.split('-')
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      
      // For now, use invested amount as value until we get real-time pricing
      // TODO: Calculate current market value using price service
      const currentValue = point.invested * 1.05 // Mock 5% average gain
      
      return {
        date: point.date,
        invested: Math.round(point.invested),
        value: Math.round(currentValue),
        month: `${monthNames[parseInt(month || '1', 10) - 1] || 'Jan'} ${year || ''}`,
      }
    })

    return timeline
  } catch (error) {
    console.error('Error fetching investment timeline:', error)
    return []
  }
})

// Server function to get portfolio summary from events
export const getPortfolioSummary = createServerFn({
  method: 'GET',
}).validator(PortfolioFilterSchema).handler(async ({ data: filters }): Promise<PortfolioSummary> => {
  try {
    // Get all trade events
    const allEvents = await prisma.event.findMany({
      where: {
        eventType: EventType.TRADE_EXECUTED,
      },
      orderBy: {
        timestamp: 'asc',
      },
    })

    // Apply filters
    const events = applyFiltersToEvents(allEvents, filters)

    if (events.length === 0) {
      return {
        totalValue: 0,
        investedCapital: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
      }
    }

    // Convert events to TradeExecution objects
    const trades = events.map(parseTradeExecution)

    // Use portfolio aggregator to get complete summary
    const summary = await portfolioAggregator.getPortfolioSummary(trades)

    return {
      totalValue: Math.round(summary.totalMarketValue),
      investedCapital: Math.round(summary.totalInvested),
      totalReturn: Math.round(summary.totalGain),
      totalReturnPercent: Math.round(summary.totalGainPercent * 100) / 100,
      dayChange: Math.round(summary.totalDailyChange),
      dayChangePercent: Math.round(summary.totalDailyChangePercent * 100) / 100,
    }
  } catch (error) {
    console.error('Error fetching portfolio summary:', error)
    return {
      totalValue: 0,
      investedCapital: 0,
      totalReturn: 0,
      totalReturnPercent: 0,
      dayChange: 0,
      dayChangePercent: 0,
    }
  }
})

// New server function to get enriched positions
export const getEnrichedPositions = createServerFn({
  method: 'GET',
}).validator(PortfolioFilterSchema).handler(async ({ data: filters }) => {
  try {
    // Get all trade events
    const allEvents = await prisma.event.findMany({
      where: {
        eventType: EventType.TRADE_EXECUTED,
      },
      orderBy: {
        timestamp: 'asc',
      },
    })

    // Apply filters
    const events = applyFiltersToEvents(allEvents, filters)

    if (events.length === 0) {
      return []
    }

    // Convert events to TradeExecution objects
    const trades = events.map(parseTradeExecution)

    // Use portfolio aggregator to get enriched positions
    const positions = await portfolioAggregator.getEnrichedPositions(trades)

    return positions
  } catch (error) {
    console.error('Error fetching enriched positions:', error)
    return []
  }
})