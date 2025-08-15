import { z } from 'zod'

// Base types for trading domains
export const TradeDirection = z.enum(['BUY', 'SELL'])
export const AssetType = z.enum(['STOCK', 'ETF'])
export const Currency = z.enum(['USD', 'EUR', 'GBP', 'CAD', 'CHF', 'JPY'])

// ISIN validation - 12 characters: 2 country code + 9 alphanumeric + 1 check digit
export const ISINSchema = z.string().regex(/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/, 'Invalid ISIN format')

// Asset identification - used across all trading events
export const BaseAssetIdentification = z.object({
  isin: ISINSchema,
  symbol: z.string(),
  assetType: AssetType,
  cusip: z.string().optional(),
})

// Broker context - used across multiple domains
export const BrokerContext = z.object({
  accountId: z.string(),
  brokerName: z.string(),
})

// Date validation pattern
export const DateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

// Type exports
export type TradeDirection = z.infer<typeof TradeDirection>
export type AssetType = z.infer<typeof AssetType>
export type Currency = z.infer<typeof Currency>
export type BaseAssetIdentification = z.infer<typeof BaseAssetIdentification>
export type BrokerContext = z.infer<typeof BrokerContext>