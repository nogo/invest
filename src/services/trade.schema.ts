import { z } from 'zod'

// Simple form data schema - only user inputs, no derived fields
export const TradeFormSchema = z.object({
  isin: z.string().min(12, 'ISIN must be 12 characters').max(12, 'ISIN must be 12 characters'),
  symbol: z.string().min(1, 'Symbol is required'),
  assetType: z.enum(['STOCK', 'ETF']),
  direction: z.enum(['BUY', 'SELL']),
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().positive('Price must be positive'),
  tradeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  commission: z.number().min(0, 'Commission cannot be negative').default(0),
  fees: z.number().min(0, 'Fees cannot be negative').default(0),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'CHF', 'JPY']).default('USD'),
  accountId: z.string().min(1, 'Account ID is required'),
  brokerName: z.string().min(1, 'Broker name is required'),
  exchange: z.string().optional(),
  notes: z.string().optional(),
})

export type TradeFormData = z.infer<typeof TradeFormSchema>