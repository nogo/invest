#!/usr/bin/env bun

import { readFileSync } from 'fs'
import { parseCSVFile } from '~/lib/csv-parser'
import { mapCSVRowsToEvents } from '~/lib/csv-mapper'
import prisma from '~/lib/prisma'

interface ImportOptions {
  file: string
  brokerName?: string
  dryRun?: boolean
  verbose?: boolean
}

async function importCSV(options: ImportOptions) {
  const { file, brokerName = 'CSV Import', dryRun = false, verbose = false } = options

  try {
    // Read and parse CSV file
    console.log(`📄 Reading CSV file: ${file}`)
    const content = readFileSync(file, 'utf-8')
    
    console.log(`🔍 Parsing CSV content...`)
    const rows = parseCSVFile(content)
    console.log(`✅ Parsed ${rows.length} rows`)

    // Map to events
    console.log(`🔄 Mapping to events...`)
    const events = mapCSVRowsToEvents(rows, brokerName)
    console.log(`✅ Generated ${events.length} events`)

    if (verbose) {
      console.log('📋 Event Summary:')
      const eventCounts = events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      Object.entries(eventCounts).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`)
      })
    }

    if (dryRun) {
      console.log('🏃 Dry run mode - no data will be saved')
      
      if (verbose) {
        console.log('\n📝 Sample Events:')
        events.slice(0, 3).forEach((event, i) => {
          console.log(`\n[${i + 1}] ${event.eventType} at ${event.timestamp.toISOString()}`)
          console.log(JSON.stringify(event.payload, null, 2))
        })
      }
      
      return
    }

    // Import events to database
    console.log(`💾 Importing events to database...`)
    
    let imported = 0
    for (const event of events) {
      try {
        await prisma.event.create({
          data: {
            eventType: event.eventType,
            payload: JSON.stringify(event.payload),
            timestamp: event.timestamp,
          },
        })
        imported++
        
        if (verbose && imported % 10 === 0) {
          console.log(`  Imported ${imported}/${events.length} events...`)
        }
      } catch (error) {
        console.error(`❌ Failed to import event:`, error)
        if (verbose) {
          console.error('Event payload:', JSON.stringify(event.payload, null, 2))
        }
      }
    }

    console.log(`✅ Import completed: ${imported}/${events.length} events imported`)

    if (imported < events.length) {
      console.log(`⚠️  ${events.length - imported} events failed to import`)
    }

  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Parse command line arguments
function parseArgs(): ImportOptions {
  const args = process.argv.slice(2)
  const options: ImportOptions = { file: '' }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    switch (arg) {
      case '--file':
      case '-f':
        options.file = args[++i] || ''
        break
      case '--broker':
      case '-b':
        options.brokerName = args[++i] || ''
        break
      case '--dry-run':
      case '-d':
        options.dryRun = true
        break
      case '--verbose':
      case '-v':
        options.verbose = true
        break
      case '--help':
      case '-h':
        printHelp()
        process.exit(0)
      default:
        if (!options.file && !arg?.startsWith('-')) {
          options.file = arg
        } else {
          console.error(`Unknown option: ${arg}`)
          printHelp()
          process.exit(1)
        }
    }
  }

  if (!options.file) {
    console.error('❌ CSV file is required')
    printHelp()
    process.exit(1)
  }

  return options
}

function printHelp() {
  console.log(`
📈 Investment Portfolio CSV Importer

Usage: bun src/scripts/import-csv.ts [options] <csv-file>

Options:
  -f, --file <path>        CSV file to import (required)
  -b, --broker <name>      Broker name (default: "CSV Import")
  -d, --dry-run           Preview import without saving to database
  -v, --verbose           Show detailed output
  -h, --help              Show this help message

Examples:
  # Import with default settings
  bun src/scripts/import-csv.ts data/invest.csv

  # Dry run with verbose output
  bun src/scripts/import-csv.ts --dry-run --verbose --broker "My Broker" data/invest.csv

Expected CSV Format:
  Datum;Typ;Wertpapier;Stück;Kurs;Betrag;Gebühren;Steuern;Gesamtpreis;Konto;Gegenkonto;Notiz;Quelle

Supported Transaction Types:
  - Kauf (Buy transactions)
  - Dividende (Dividend payments)
`)
}

// Main execution
if (import.meta.main) {
  const options = parseArgs()
  importCSV(options)
}