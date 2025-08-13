import { format } from 'date-fns'
import { ParsedCSVRow } from './csv-parser'
import { TradeExecutedPayload, DividendReceivedPayload } from './events/trading-events'
import { EventType } from '~/generated/prisma/client'

export interface ImportEvent {
  eventType: EventType
  payload: TradeExecutedPayload | DividendReceivedPayload
  timestamp: Date
}

/**
 * Map parsed CSV row to event sourcing events
 */
export function mapCSVRowToEvents(row: ParsedCSVRow, brokerName: string = 'Unknown'): ImportEvent[] {
  const events: ImportEvent[] = []

  if (row.typ === 'KAUF' || row.typ === 'VERKAUF') {
    // Handle buy/sell transactions
    if (!row.stueck || !row.kurs) {
      throw new Error(`${row.typ} transaction missing required fields: stueck=${row.stueck}, kurs=${row.kurs}`)
    }

    const tradePayload: TradeExecutedPayload = {
      tradeId: `CSV_${row.konto}_${row.datum.getTime()}`,
      isin: extractISINFromSymbol(row.wertpapier), // Will need enhancement
      symbol: extractSymbolFromName(row.wertpapier),
      assetType: inferAssetType(row.wertpapier),
      direction: row.typ === 'KAUF' ? 'BUY' : 'SELL',
      quantity: row.stueck,
      price: row.kurs,
      totalAmount: row.gesamtpreis,
      tradeDate: format(row.datum, 'yyyy-MM-dd'),
      settlementDate: format(row.datum, 'yyyy-MM-dd'), // Assume same day for CSV imports
      commission: row.gebuehren,
      fees: row.steuern,
      currency: 'EUR', // Assume EUR for German broker
      exchangeRate: 1,
      accountId: row.konto,
      brokerName: brokerName,
      marketType: 'REGULAR',
      notes: [row.notiz, row.quelle].filter(Boolean).join(' | '),
    }

    events.push({
      eventType: EventType.TRADE_EXECUTED,
      payload: tradePayload,
      timestamp: row.datum,
    })
  } else if (row.typ === 'DIVIDENDE') {
    // Handle dividend transactions
    const dividendPayload: DividendReceivedPayload = {
      isin: extractISINFromSymbol(row.wertpapier),
      symbol: extractSymbolFromName(row.wertpapier),
      dividendAmount: row.betrag && row.stueck ? row.betrag / row.stueck : 0,
      totalAmount: row.gesamtpreis,
      sharesHeld: row.stueck || 0,
      exDate: format(row.datum, 'yyyy-MM-dd'),
      paymentDate: format(row.datum, 'yyyy-MM-dd'),
      currency: inferCurrency(row.notiz) || 'EUR',
      taxWithheld: row.steuern,
      accountId: row.konto,
      brokerName: brokerName,
      dividendType: 'ORDINARY',
      notes: [row.notiz, row.quelle].filter(Boolean).join(' | '),
    }

    events.push({
      eventType: EventType.DIVIDEND_RECEIVED,
      payload: dividendPayload,
      timestamp: row.datum,
    })
  } else if (row.typ === 'EINLAGE') {
    // Handle deposit transactions
    // Note: Current event sourcing schema doesn't have DEPOSIT event type
    // This would need to be added to support cash flow tracking
    console.log(`⚠️  Skipping deposit transaction: ${row.gesamtpreis} EUR on ${format(row.datum, 'yyyy-MM-dd')} (not supported in current schema)`)
  }

  return events
}

/**
 * Extract ISIN from security name (placeholder implementation)
 * TODO: Enhance with actual ISIN lookup or user mapping
 */
function extractISINFromSymbol(wertpapier: string): string {
  // For now, generate a placeholder ISIN based on the security name
  // In production, this should lookup from a securities database
  const hash = wertpapier.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  return `DE${hash.padEnd(10, '0').substring(0, 10)}`
}

/**
 * Extract trading symbol from security name
 */
function extractSymbolFromName(wertpapier: string): string {
  // Extract common patterns for ETF and fund symbols
  if (wertpapier.includes('iShares')) {
    // Extract iShares ETF symbol
    const match = wertpapier.match(/iShares\s+([^U]+?)(?:\s+UCITS|$)/)
    if (match) {
      return match[1].trim().replace(/\s+/g, '_').toUpperCase()
    }
  }
  
  if (wertpapier.includes('Xtrackers')) {
    const match = wertpapier.match(/Xtrackers\s+([^U]+?)(?:\s+UCITS|$)/)
    if (match) {
      return match[1].trim().replace(/\s+/g, '_').toUpperCase()
    }
  }

  if (wertpapier.includes('UBS')) {
    const match = wertpapier.match(/UBS.*?-\s*([^U]+?)(?:\s+UCITS|$)/)
    if (match) {
      return match[1].trim().replace(/\s+/g, '_').toUpperCase()
    }
  }

  if (wertpapier.includes('Jupiter')) {
    return 'JUPITER_DYNAMIC_BOND'
  }

  // Fallback: create symbol from name
  return wertpapier
    .split(' ')
    .slice(0, 3)
    .join('_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase()
}

/**
 * Infer asset type from security name
 */
function inferAssetType(wertpapier: string): 'STOCK' | 'ETF' {
  const name = wertpapier.toLowerCase()
  
  if (name.includes('etf') || 
      name.includes('ishares') || 
      name.includes('xtrackers') ||
      name.includes('msci') ||
      name.includes('spdr')) {
    return 'ETF'
  }
  
  return 'STOCK' // Default fallback
}

/**
 * Infer currency from notes field
 */
function inferCurrency(notes: string): 'USD' | 'EUR' | null {
  if (!notes) return null
  
  const notesLower = notes.toLowerCase()
  if (notesLower.includes('usd') || notesLower.includes('dollar')) {
    return 'USD'
  }
  if (notesLower.includes('eur') || notesLower.includes('euro')) {
    return 'EUR'
  }
  
  return null
}

/**
 * Batch process multiple CSV rows
 */
export function mapCSVRowsToEvents(rows: ParsedCSVRow[], brokerName: string = 'CSV Import'): ImportEvent[] {
  const allEvents: ImportEvent[] = []
  
  for (const row of rows) {
    try {
      const events = mapCSVRowToEvents(row, brokerName)
      allEvents.push(...events)
    } catch (error) {
      console.error(`Error mapping row for ${row.wertpapier} on ${row.datum}:`, error)
      // Continue processing other rows
    }
  }
  
  return allEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}