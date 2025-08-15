import { z } from 'zod'
import { 
  TradeDirection, 
  Currency, 
  BaseAssetIdentification, 
  BrokerContext, 
  DateString 
} from '~/lib/events/base-types'

// Core trading event payload
export const TradeExecutedPayload = z.object({
  // Trade identification
  tradeId: z.string(), // Broker's trade ID
  orderId: z.string().optional(), // Original order ID if available
  
  // Asset identification (ISIN is primary, symbol can change)
  ...BaseAssetIdentification.shape,
  
  // Trade details
  direction: TradeDirection,
  quantity: z.number().positive(),
  price: z.number().positive(),
  totalAmount: z.number(), // Can be negative for sells
  
  // Dates
  tradeDate: DateString, // When trade was executed (YYYY-MM-DD)
  settlementDate: DateString, // When settlement occurs
  
  // Costs and fees
  commission: z.number().min(0).default(0),
  fees: z.number().min(0).default(0), // Exchange fees, regulatory fees, etc.
  sec_fee: z.number().min(0).default(0).optional(), // SEC fee for US trades
  taf_fee: z.number().min(0).default(0).optional(), // TAF fee for US trades
  
  // Currency and FX
  currency: Currency.default('USD'),
  exchangeRate: z.number().positive().default(1), // Rate to base currency
  
  // Broker context
  ...BrokerContext.shape,
  
  // Optional metadata
  exchange: z.string().optional(), // NYSE, NASDAQ, etc.
  marketType: z.enum(['REGULAR', 'EXTENDED', 'PRE_MARKET']).default('REGULAR'),
  notes: z.string().optional(),
})

// Trade Corrected Event Payload
export const TradeCorrectedPayload = z.object({
  // Reference to original trade
  originalTradeId: z.string(),
  correctionReason: z.string(),
  
  // Corrected trade details (full trade payload)
  correctedTrade: TradeExecutedPayload,
  
  // Correction metadata
  correctionDate: DateString,
  correctionId: z.string(), // Broker's correction ID
  
  // Optional metadata
  notes: z.string().optional(),
})

// Type exports
export type TradeExecutedPayload = z.infer<typeof TradeExecutedPayload>
export type TradeCorrectedPayload = z.infer<typeof TradeCorrectedPayload>

// Validation functions
export function validateTradeExecutedPayload(data: unknown): TradeExecutedPayload {
  return TradeExecutedPayload.parse(data)
}

export function validateTradeCorrectedPayload(data: unknown): TradeCorrectedPayload {
  return TradeCorrectedPayload.parse(data)
}

// Example usage and validation
export const exampleStockTrade: TradeExecutedPayload = {
  tradeId: "T123456789",
  orderId: "O987654321",
  // ISIN is now primary identifier
  isin: "US0378331005", // Apple Inc. - stable identifier
  symbol: "AAPL", // Current symbol (can change)
  assetType: "STOCK",
  cusip: "037833100",
  direction: "BUY",
  quantity: 100,
  price: 150.25,
  totalAmount: 15025.00,
  tradeDate: "2024-01-15",
  settlementDate: "2024-01-17",
  commission: 1.00,
  fees: 0.50,
  currency: "USD",
  exchangeRate: 1,
  accountId: "ACC123",
  brokerName: "Interactive Brokers",
  exchange: "NASDAQ",
  marketType: "REGULAR"
}