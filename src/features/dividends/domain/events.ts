import { z } from 'zod'
import { 
  Currency, 
  BaseAssetIdentification, 
  BrokerContext, 
  DateString 
} from '~/lib/events/base-types'

// Dividend Received Event Payload
export const DividendReceivedPayload = z.object({
  // Asset identification
  ...BaseAssetIdentification.shape,
  
  // Dividend details
  dividendAmount: z.number().positive(), // Amount per share
  totalAmount: z.number().positive(), // Total dividend received
  sharesHeld: z.number().positive(), // Number of shares held
  
  // Dates
  exDate: DateString, // Ex-dividend date
  paymentDate: DateString, // Payment date
  recordDate: DateString.optional(), // Record date
  
  // Currency and tax
  currency: Currency.default('USD'),
  taxWithheld: z.number().min(0).default(0), // Tax withheld at source
  
  // Broker context
  ...BrokerContext.shape,
  
  // Optional metadata
  dividendType: z.enum(['ORDINARY', 'QUALIFIED', 'SPECIAL', 'RETURN_OF_CAPITAL']).default('ORDINARY'),
  notes: z.string().optional(),
})

// Type exports
export type DividendReceivedPayload = z.infer<typeof DividendReceivedPayload>

// Validation functions
export function validateDividendPayload(data: unknown): DividendReceivedPayload {
  return DividendReceivedPayload.parse(data)
}

// Example dividend event
export const exampleDividend: DividendReceivedPayload = {
  isin: "US0378331005", // Apple Inc.
  symbol: "AAPL",
  assetType: "STOCK",
  dividendAmount: 0.24, // $0.24 per share
  totalAmount: 24.00, // 100 shares * $0.24
  sharesHeld: 100,
  exDate: "2024-02-09",
  paymentDate: "2024-02-15",
  recordDate: "2024-02-12",
  currency: "USD",
  taxWithheld: 0,
  accountId: "ACC123",
  brokerName: "Interactive Brokers",
  dividendType: "QUALIFIED"
}