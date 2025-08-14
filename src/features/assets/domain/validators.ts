import { symbol, z } from 'zod'

export const SymbolSchema = z.object({
  symbol: z.string()
})