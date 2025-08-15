import { createServerFn } from '@tanstack/react-start'
import prisma from '~/lib/prisma'
import { TradeExecutedPayload } from '~/features/trades/domain/events'
import { EventType } from '~/generated/prisma/client'

export const listHistory = createServerFn({ method: 'GET' })
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