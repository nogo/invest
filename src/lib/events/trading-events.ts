import { z } from 'zod'

// Base types for trading
export const TradeDirection = z.enum(['BUY', 'SELL'])
export const AssetType = z.enum(['STOCK', 'ETF'])
export const Currency = z.enum(['USD', 'EUR', 'GBP', 'CAD', 'CHF', 'JPY'])

// ISIN validation - 12 characters: 2 country code + 9 alphanumeric + 1 check digit
export const ISINSchema = z.string().regex(/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/, 'Invalid ISIN format')

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

// Core trading event payload
export const TradeExecutedPayload = z.object({
  // Trade identification
  tradeId: z.string(), // Broker's trade ID
  orderId: z.string().optional(), // Original order ID if available
  
  // Asset identification (ISIN is primary, symbol can change)
  isin: ISINSchema, // Primary stable identifier (required)
  symbol: z.string(), // Current symbol at time of trade (can change)
  assetType: AssetType,
  cusip: z.string().optional(), // US identifier
  
  // Trade details
  direction: TradeDirection,
  quantity: z.number().positive(),
  price: z.number().positive(),
  totalAmount: z.number(), // Can be negative for sells
  
  // Dates
  tradeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // When trade was executed (YYYY-MM-DD)
  settlementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // When settlement occurs
  
  // Costs and fees
  commission: z.number().min(0).default(0),
  fees: z.number().min(0).default(0), // Exchange fees, regulatory fees, etc.
  sec_fee: z.number().min(0).default(0).optional(), // SEC fee for US trades
  taf_fee: z.number().min(0).default(0).optional(), // TAF fee for US trades
  
  // Currency and FX
  currency: Currency.default('USD'),
  exchangeRate: z.number().positive().default(1), // Rate to base currency
  
  // Broker context
  accountId: z.string(), // Broker account identifier
  brokerName: z.string(),
  
  // Optional metadata
  exchange: z.string().optional(), // NYSE, NASDAQ, etc.
  marketType: z.enum(['REGULAR', 'EXTENDED', 'PRE_MARKET']).default('REGULAR'),
  notes: z.string().optional(),
})


// Type exports
export type TradeExecutedPayload = z.infer<typeof TradeExecutedPayload>
export type TradeDirection = z.infer<typeof TradeDirection>
export type AssetType = z.infer<typeof AssetType>
export type Currency = z.infer<typeof Currency>

// Symbol Change Event - handles when a stock symbol changes but ISIN stays the same
export const SymbolChangedPayload = z.object({
  // Asset identification
  isin: ISINSchema, // The stable ISIN that doesn't change
  oldSymbol: z.string(), // Previous symbol
  newSymbol: z.string(), // New symbol
  
  // Change details
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // When change takes effect
  reason: SymbolChangeReason,
  
  // Optional details
  announcementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  exchange: z.string().optional(), // Which exchange announced the change
  notes: z.string().optional(),
  
  // Reference information
  corporateActionId: z.string().optional(), // Link to related corporate action
})

export type SymbolChangedPayload = z.infer<typeof SymbolChangedPayload>

export function validateSymbolChangedPayload(data: unknown): SymbolChangedPayload {
  return SymbolChangedPayload.parse(data)
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


// Dividend Received Event Payload
export const DividendReceivedPayload = z.object({
  // Asset identification
  isin: ISINSchema, // Primary stable identifier
  symbol: z.string(), // Symbol at time of dividend
  
  // Dividend details
  dividendAmount: z.number().positive(), // Amount per share
  totalAmount: z.number().positive(), // Total dividend received
  sharesHeld: z.number().positive(), // Number of shares held
  
  // Dates
  exDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Ex-dividend date
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Payment date
  recordDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // Record date
  
  // Currency and tax
  currency: Currency.default('USD'),
  taxWithheld: z.number().min(0).default(0), // Tax withheld at source
  
  // Broker context
  accountId: z.string(),
  brokerName: z.string(),
  
  // Optional metadata
  dividendType: z.enum(['ORDINARY', 'QUALIFIED', 'SPECIAL', 'RETURN_OF_CAPITAL']).default('ORDINARY'),
  notes: z.string().optional(),
})

// Stock Split Event Payload
export const StockSplitExecutedPayload = z.object({
  // Asset identification
  isin: ISINSchema,
  symbol: z.string(),
  
  // Split details
  splitRatio: z.string(), // e.g., "2:1", "3:2"
  splitMultiplier: z.number().positive(), // e.g., 2.0 for 2:1 split
  
  // Position impact
  sharesBeforeSplit: z.number().positive(),
  sharesAfterSplit: z.number().positive(),
  
  // Dates
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  announcementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  
  // Broker context
  accountId: z.string(),
  brokerName: z.string(),
  
  // Optional metadata
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
  correctionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  correctionId: z.string(), // Broker's correction ID
  
  // Optional metadata
  notes: z.string().optional(),
})

// Type exports for new payloads
export type DividendReceivedPayload = z.infer<typeof DividendReceivedPayload>
export type StockSplitExecutedPayload = z.infer<typeof StockSplitExecutedPayload>
export type TradeCorrectedPayload = z.infer<typeof TradeCorrectedPayload>

// Validation functions
export function validateDividendPayload(data: unknown): DividendReceivedPayload {
  return DividendReceivedPayload.parse(data)
}

export function validateStockSplitPayload(data: unknown): StockSplitExecutedPayload {
  return StockSplitExecutedPayload.parse(data)
}

export function validateTradeCorrectedPayload(data: unknown): TradeCorrectedPayload {
  return TradeCorrectedPayload.parse(data)
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

// Example dividend event
export const exampleDividend: DividendReceivedPayload = {
  isin: "US0378331005", // Apple Inc.
  symbol: "AAPL",
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

// Example stock split event
export const exampleStockSplit: StockSplitExecutedPayload = {
  isin: "US0378331005", // Apple Inc.
  symbol: "AAPL",
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