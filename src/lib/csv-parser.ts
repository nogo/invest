import { z } from 'zod'

// German CSV format schema matching the provided data
export const GermanCSVSchema = z.object({
  Datum: z.string(), // 2023-11-15 00:00:00
  Typ: z.string(), // Kauf, Dividende
  Wertpapier: z.string(), // Security name
  'Stück': z.string(), // Quantity (decimal with comma)
  Kurs: z.string(), // Price (decimal with comma)
  Betrag: z.string(), // Amount (decimal with comma)
  'Gebühren': z.string(), // Fees (optional, can be empty)
  Steuern: z.string(), // Taxes (optional, can be empty)
  Gesamtpreis: z.string(), // Total price (decimal with comma)
  Konto: z.string(), // Account ID
  Gegenkonto: z.string(), // Counter account
  Notiz: z.string(), // Notes (optional)
  Quelle: z.string(), // Source (optional)
})

export type GermanCSVRow = z.infer<typeof GermanCSVSchema>

export interface ParsedCSVRow {
  datum: Date
  typ: 'KAUF' | 'VERKAUF' | 'DIVIDENDE' | 'EINLAGE'
  wertpapier: string
  stueck: number | null // null for dividends and deposits
  kurs: number | null // null for dividends and deposits without price
  betrag: number | null
  gebuehren: number
  steuern: number
  gesamtpreis: number
  konto: string
  gegenkonto: string
  notiz: string
  quelle: string
}

/**
 * Parse German CSV format with semicolon delimiter and German number format
 */
export function parseCSVLine(line: string): GermanCSVRow {
  const columns = line.split(';')
  
  if (columns.length !== 13) {
    throw new Error(`Invalid CSV format: expected 13 columns, got ${columns.length}`)
  }

  return GermanCSVSchema.parse({
    Datum: columns[0],
    Typ: columns[1],
    Wertpapier: columns[2],
    'Stück': columns[3],
    Kurs: columns[4],
    Betrag: columns[5],
    'Gebühren': columns[6],
    Steuern: columns[7],
    Gesamtpreis: columns[8],
    Konto: columns[9],
    Gegenkonto: columns[10],
    Notiz: columns[11],
    Quelle: columns[12],
  })
}

/**
 * Parse German number format (comma as decimal separator)
 */
export function parseGermanNumber(value: string): number | null {
  if (!value || value.trim() === '') return null
  
  // Replace comma with dot for decimal parsing
  const normalized = value.replace(',', '.')
  const parsed = parseFloat(normalized)
  
  if (isNaN(parsed)) return null
  return parsed
}

/**
 * Parse German date format
 */
export function parseGermanDate(dateStr: string): Date {
  // Expected format: "2023-11-15 00:00:00"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`)
  }
  return date
}

/**
 * Transform raw CSV row to parsed format
 */
export function transformCSVRow(raw: GermanCSVRow): ParsedCSVRow {
  const typ = raw.Typ.toUpperCase()
  
  if (typ !== 'KAUF' && typ !== 'VERKAUF' && typ !== 'DIVIDENDE' && typ !== 'EINLAGE') {
    throw new Error(`Unknown transaction type: ${raw.Typ}`)
  }

  return {
    datum: parseGermanDate(raw.Datum),
    typ: typ as 'KAUF' | 'VERKAUF' | 'DIVIDENDE' | 'EINLAGE',
    wertpapier: raw.Wertpapier,
    stueck: parseGermanNumber(raw['Stück']),
    kurs: parseGermanNumber(raw.Kurs),
    betrag: parseGermanNumber(raw.Betrag),
    gebuehren: parseGermanNumber(raw['Gebühren']) || 0,
    steuern: parseGermanNumber(raw.Steuern) || 0,
    gesamtpreis: parseGermanNumber(raw.Gesamtpreis) || 0,
    konto: raw.Konto,
    gegenkonto: raw.Gegenkonto,
    notiz: raw.Notiz || '',
    quelle: raw.Quelle || '',
  }
}

/**
 * Parse entire CSV file content
 */
export function parseCSVFile(content: string): ParsedCSVRow[] {
  const lines = content.trim().split('\n')
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least header and one data row')
  }

  // Skip header row
  const dataLines = lines.slice(1)
  const results: ParsedCSVRow[] = []

  for (let i = 0; i < dataLines.length; i++) {
    try {
      const raw = parseCSVLine(dataLines[i])
      const parsed = transformCSVRow(raw)
      results.push(parsed)
    } catch (error) {
      throw new Error(`Error parsing line ${i + 2}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return results
}