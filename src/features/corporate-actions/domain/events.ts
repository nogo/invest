import { z } from 'zod'
import { 
  BaseAssetIdentification, 
  BrokerContext, 
  DateString 
} from '~/lib/events/base-types'

// Symbol change reasons
export const SymbolChangeReason = z.enum([
  'CORPORATE_REBRANDING',
  'MERGER_ACQUISITION', 
  'SPINOFF',
  'EXCHANGE_MOVE',
  'COMPLIANCE_REQUIRED',
  'BUSINESS_RESTRUCTURE',
  'OTHER'
])

// Symbol Change Event - handles when a stock symbol changes but ISIN stays the same
export const SymbolChangedPayload = z.object({
  // Asset identification
  isin: BaseAssetIdentification.shape.isin, // The stable ISIN that doesn't change
  oldSymbol: z.string(), // Previous symbol
  newSymbol: z.string(), // New symbol
  
  // Change details
  effectiveDate: DateString, // When change takes effect
  reason: SymbolChangeReason,
  
  // Optional details
  announcementDate: DateString.optional(),
  exchange: z.string().optional(), // Which exchange announced the change
  notes: z.string().optional(),
  
  // Reference information
  corporateActionId: z.string().optional(), // Link to related corporate action
})

// Stock Split Event Payload
export const StockSplitExecutedPayload = z.object({
  // Asset identification
  ...BaseAssetIdentification.shape,
  
  // Split details
  splitRatio: z.string(), // e.g., "2:1", "3:2"
  splitMultiplier: z.number().positive(), // e.g., 2.0 for 2:1 split
  
  // Position impact
  sharesBeforeSplit: z.number().positive(),
  sharesAfterSplit: z.number().positive(),
  
  // Dates
  effectiveDate: DateString,
  announcementDate: DateString.optional(),
  
  // Broker context
  ...BrokerContext.shape,
  
  // Optional metadata
  notes: z.string().optional(),
})

// Type exports
export type SymbolChangedPayload = z.infer<typeof SymbolChangedPayload>
export type StockSplitExecutedPayload = z.infer<typeof StockSplitExecutedPayload>
export type SymbolChangeReason = z.infer<typeof SymbolChangeReason>

// Validation functions
export function validateSymbolChangedPayload(data: unknown): SymbolChangedPayload {
  return SymbolChangedPayload.parse(data)
}

export function validateStockSplitPayload(data: unknown): StockSplitExecutedPayload {
  return StockSplitExecutedPayload.parse(data)
}

// Example symbol change event
export const exampleSymbolChange: SymbolChangedPayload = {
  isin: "US30303M1027", // Meta Platforms Inc.
  oldSymbol: "FB",
  newSymbol: "META",
  effectiveDate: "2022-06-09",
  reason: "CORPORATE_REBRANDING",
  announcementDate: "2022-05-15",
  exchange: "NASDAQ",
  notes: "Facebook rebrands to Meta Platforms Inc.",
  corporateActionId: "CA-META-2022-001"
}

// Example stock split event
export const exampleStockSplit: StockSplitExecutedPayload = {
  isin: "US0378331005", // Apple Inc.
  symbol: "AAPL",
  assetType: "STOCK",
  splitRatio: "4:1",
  splitMultiplier: 4.0,
  sharesBeforeSplit: 100,
  sharesAfterSplit: 400,
  effectiveDate: "2020-08-31",
  announcementDate: "2020-07-30",
  accountId: "ACC123",
  brokerName: "Interactive Brokers",
  notes: "Apple 4-for-1 stock split"
}