import { createServerFn } from '@tanstack/react-start'
import prisma from '~/lib/prisma'
import { EventType } from '~/generated/prisma/client'

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

// Server function to get investment timeline data from events
export const getInvestmentTimeline = createServerFn({
  method: 'GET',
}).handler(async (): Promise<InvestmentTimelinePoint[]> => {
  try {
    // Get all trade events ordered by timestamp
    const events = await prisma.event.findMany({
      where: {
        eventType: EventType.TRADE_EXECUTED,
      },
      orderBy: {
        timestamp: 'asc',
      },
    })

    if (events.length === 0) {
      return []
    }

    // Process events to build timeline
    const timelineMap = new Map<string, { invested: number, value: number }>()
    let totalInvested = 0

    events.forEach(event => {
      const payload = JSON.parse(event.payload)
      const eventDate = new Date(event.timestamp)
      const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`
      
      // Calculate investment change (positive for purchases, negative for sales)
      const investmentChange = payload.direction === 'BUY' 
        ? payload.totalAmount || (payload.quantity * payload.price)
        : -(payload.totalAmount || (payload.quantity * payload.price))
      
      totalInvested += investmentChange
      
      // For now, assume portfolio value equals invested amount (no gains/losses calculated yet)
      // TODO: Implement proper portfolio valuation with current market prices
      const currentValue = totalInvested * 1.1 // Mock 10% gain for visualization
      
      timelineMap.set(monthKey, {
        invested: Math.max(0, totalInvested),
        value: Math.max(0, currentValue),
      })
    })

    // Convert map to array and format for chart
    const timeline = Array.from(timelineMap.entries()).map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-')
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      
      return {
        date: monthKey,
        invested: Math.round(data.invested),
        value: Math.round(data.value),
        month: `${monthNames[parseInt(month, 10) - 1]} ${year}`,
      }
    })

    return timeline.slice(-12) // Return last 12 months
  } catch (error) {
    console.error('Error fetching investment timeline:', error)
    return []
  }
})

// Server function to get portfolio summary from events
export const getPortfolioSummary = createServerFn({
  method: 'GET',
}).handler(async (): Promise<PortfolioSummary> => {
  try {
    // Get all trade events
    const events = await prisma.event.findMany({
      where: {
        eventType: EventType.TRADE_EXECUTED,
      },
      orderBy: {
        timestamp: 'asc',
      },
    })

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

    // Calculate invested capital from trade events
    let investedCapital = 0
    events.forEach(event => {
      const payload = JSON.parse(event.payload)
      
      // Calculate investment change (positive for purchases, negative for sales)
      const investmentChange = payload.direction === 'BUY' 
        ? payload.totalAmount || (payload.quantity * payload.price)
        : -(payload.totalAmount || (payload.quantity * payload.price))
      
      investedCapital += investmentChange
    })

    // For now, mock the current portfolio value with some gains
    // TODO: Implement proper portfolio valuation with current market prices
    const totalValue = investedCapital * 1.14 // Mock 14% gain
    const totalReturn = totalValue - investedCapital
    const totalReturnPercent = investedCapital > 0 ? (totalReturn / investedCapital) * 100 : 0

    // Mock day change (1% of portfolio value)
    const dayChange = totalValue * 0.01
    const dayChangePercent = 1.0

    return {
      totalValue: Math.round(totalValue),
      investedCapital: Math.round(Math.max(0, investedCapital)),
      totalReturn: Math.round(totalReturn),
      totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
      dayChange: Math.round(dayChange),
      dayChangePercent: Math.round(dayChangePercent * 100) / 100,
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