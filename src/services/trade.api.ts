import { createServerFn } from '@tanstack/react-start'
import { addBusinessDays, format } from 'date-fns'
import { TradeExecutedPayload } from '~/lib/events/trading-events'
import { EventType } from '~/generated/prisma/client'
import { TradeFormSchema } from '~/services/trade.schema'
import prisma from '~/lib/prisma'

export const createTradeEvent = createServerFn({ method: 'POST' })
  .validator(TradeFormSchema)
  .handler(async ({ data: formData }) => {
    // Transform form data into full event payload
    const tradePayload: TradeExecutedPayload = {
      tradeId: `T${Date.now()}`, // Generate unique trade ID
      isin: formData.isin,
      symbol: formData.symbol.toUpperCase(),
      assetType: formData.assetType,
      direction: formData.direction,
      quantity: formData.quantity,
      price: formData.price,
      totalAmount: formData.direction === 'BUY'
        ? (formData.quantity * formData.price) + formData.commission + formData.fees
        : (formData.quantity * formData.price) - formData.commission - formData.fees,
      tradeDate: formData.tradeDate,
      settlementDate: format(addBusinessDays(new Date(formData.tradeDate), 2), 'yyyy-MM-dd'), // T+2 business days
      commission: formData.commission,
      fees: formData.fees,
      currency: formData.currency,
      exchangeRate: 1, // Default to 1, will be enhanced later
      accountId: formData.accountId,
      brokerName: formData.brokerName,
      exchange: formData.exchange || undefined,
      marketType: 'REGULAR' as const,
      notes: formData.notes || undefined,
    };

    // Create the event in the database
    return await prisma.event.create({
      data: {
        eventType: EventType.TRADE_EXECUTED,
        payload: JSON.stringify(tradePayload),
        timestamp: new Date(),
      },
    });
  })

