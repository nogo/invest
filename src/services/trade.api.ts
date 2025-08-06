import { createServerFn } from '@tanstack/react-start'
import { TradeExecutedPayload } from '~/lib/events/trading-events'
import { EventType } from '~/generated/prisma/client'
import prisma from '~/lib/prisma'


export const createTradeEvent = createServerFn({ method: 'POST' })
  .validator(TradeExecutedPayload)
  .handler(async ({ data }) => {
    return await prisma.event.create({
      data: {
        eventType: EventType.TRADE_EXECUTED,
        payload: JSON.stringify(data),
        timestamp: new Date(),
      },
    });
  })


// Server function to create a dividend received event
export const createDividendEvent = createServerFn({
  method: 'POST',
}).handler(async (payload: unknown): Promise<{ success: boolean; eventId?: string; error?: string }> => {
  try {
    // TODO: Add dividend payload validation when implementing dividend forms

    const event = await prisma.event.create({
      data: {
        eventType: EventType.DIVIDEND_RECEIVED,
        payload: JSON.stringify(payload),
        timestamp: new Date(),
      },
    })

    return {
      success: true,
      eventId: event.id,
    }
  } catch (error) {
    console.error('Error creating dividend event:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create dividend event',
    }
  }
})