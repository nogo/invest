import { createServerFn } from '@tanstack/react-start'
import prisma from '~/lib/prisma'
import { TradeExecutedPayload } from '~/lib/events/trading-events'
import { EventType } from '~/generated/prisma/client'
import { FilterSchema } from './schema'

export const listHistory = createServerFn({ method: 'POST' })
  //.validator(FilterSchema)
  .handler(async () => {

    const whereClause: any = {
      eventType: EventType.TRADE_EXECUTED,
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'desc',
      },
    })

    return events.map(event => ({
      id: event.id,
      type: event.eventType,
      timestamp: event.timestamp,
      payload: JSON.parse(event.payload) as TradeExecutedPayload,
    }))
  })