import { describe, it, expect } from 'bun:test'
import { 
	parseCSVLine, 
	parseGermanNumber, 
	parseGermanDate, 
	transformCSVRow, 
	parseCSVFile, 
	type GermanCSVRow, 
	type ParsedCSVRow 
} from './csv-parser'

describe('CSV Parser', () => {
	describe('parseCSVLine', () => {
		it('parses valid CSV line correctly', () => {
			const line = '2023-11-15 00:00:00;Kauf;Apple Inc.;100,0;150,25;15025,00;1,50;0,00;15026,50;ACC123;BANK001;Test note;Manual'
			
			const result = parseCSVLine(line)
			
			expect(result).toEqual({
				'Datum': '2023-11-15 00:00:00',
				'Typ': 'Kauf',
				'Wertpapier': 'Apple Inc.',
				'Stück': '100,0',
				'Kurs': '150,25',
				'Betrag': '15025,00',
				'Gebühren': '1,50',
				'Steuern': '0,00',
				'Gesamtpreis': '15026,50',
				'Konto': 'ACC123',
				'Gegenkonto': 'BANK001',
				'Notiz': 'Test note',
				'Quelle': 'Manual'
			})
		})

		it('throws error for invalid column count', () => {
			const invalidLine = '2023-11-15 00:00:00;Kauf;Apple Inc.;100,0' // Only 4 columns

			expect(() => parseCSVLine(invalidLine)).toThrow('Invalid CSV format: expected 13 columns, got 4')
		})

		it('handles empty fields', () => {
			const line = '2023-11-15 00:00:00;Kauf;Apple Inc.;100,0;150,25;15025,00;;;15025,00;ACC123;BANK001;;'
			
			const result = parseCSVLine(line)
			
			expect(result['Gebühren']).toBe('')
			expect(result['Steuern']).toBe('')
			expect(result['Notiz']).toBe('')
			expect(result['Quelle']).toBe('')
		})
	})

	describe('parseGermanNumber', () => {
		it('parses German decimal format correctly', () => {
			expect(parseGermanNumber('150,25')).toBe(150.25)
			expect(parseGermanNumber('1000,00')).toBe(1000.00)
			expect(parseGermanNumber('0,5')).toBe(0.5)
		})

		it('handles integer values', () => {
			expect(parseGermanNumber('150')).toBe(150)
			expect(parseGermanNumber('0')).toBe(0)
		})

		it('returns null for empty or invalid strings', () => {
			expect(parseGermanNumber('')).toBeNull()
			expect(parseGermanNumber('   ')).toBeNull()
			expect(parseGermanNumber('invalid')).toBeNull()
			expect(parseGermanNumber('abc,def')).toBeNull()
		})

		it('handles negative numbers', () => {
			expect(parseGermanNumber('-150,25')).toBe(-150.25)
			expect(parseGermanNumber('-1000')).toBe(-1000)
		})
	})

	describe('parseGermanDate', () => {
		it('parses valid date format', () => {
			const result = parseGermanDate('2023-11-15 00:00:00')
			expect(result).toBeInstanceOf(Date)
			expect(result.getFullYear()).toBe(2023)
			expect(result.getMonth()).toBe(10) // November is month 10 (0-indexed)
			expect(result.getDate()).toBe(15)
		})

		it('throws error for invalid date format', () => {
			expect(() => parseGermanDate('invalid-date')).toThrow('Invalid date format: invalid-date')
			expect(() => parseGermanDate('15.11.2023')).toThrow('Invalid date format: 15.11.2023')
		})

		it('handles different valid ISO date formats', () => {
			expect(() => parseGermanDate('2023-11-15')).not.toThrow()
			expect(() => parseGermanDate('2023-11-15T10:30:00Z')).not.toThrow()
		})
	})

	describe('transformCSVRow', () => {
		const createValidRow = (overrides: Partial<GermanCSVRow> = {}): GermanCSVRow => ({
			'Datum': '2023-11-15 00:00:00',
			'Typ': 'Kauf',
			'Wertpapier': 'Apple Inc.',
			'Stück': '100,0',
			'Kurs': '150,25',
			'Betrag': '15025,00',
			'Gebühren': '1,50',
			'Steuern': '0,00',
			'Gesamtpreis': '15026,50',
			'Konto': 'ACC123',
			'Gegenkonto': 'BANK001',
			'Notiz': 'Test note',
			'Quelle': 'Manual',
			...overrides
		})

		it('transforms buy transaction correctly', () => {
			const raw = createValidRow()
			const result = transformCSVRow(raw)

			expect(result).toMatchObject({
				typ: 'KAUF',
				wertpapier: 'Apple Inc.',
				stueck: 100.0,
				kurs: 150.25,
				betrag: 15025.00,
				gebuehren: 1.50,
				steuern: 0.00,
				gesamtpreis: 15026.50,
				konto: 'ACC123',
				gegenkonto: 'BANK001',
				notiz: 'Test note',
				quelle: 'Manual'
			})
			expect(result.datum).toBeInstanceOf(Date)
		})

		it('transforms sell transaction correctly', () => {
			const raw = createValidRow({ 'Typ': 'Verkauf' })
			const result = transformCSVRow(raw)

			expect(result.typ).toBe('VERKAUF')
		})

		it('transforms dividend transaction correctly', () => {
			const raw = createValidRow({ 
				'Typ': 'Dividende',
				'Stück': '', // Dividends don't have quantity
				'Kurs': '', // Dividends don't have price
				'Betrag': '24,50'
			})
			const result = transformCSVRow(raw)

			expect(result).toMatchObject({
				typ: 'DIVIDENDE',
				stueck: null,
				kurs: null,
				betrag: 24.50
			})
		})

		it('transforms deposit transaction correctly', () => {
			const raw = createValidRow({ 
				'Typ': 'Einlage',
				'Stück': '',
				'Kurs': '',
				'Betrag': '1000,00'
			})
			const result = transformCSVRow(raw)

			expect(result).toMatchObject({
				typ: 'EINLAGE',
				stueck: null,
				kurs: null,
				betrag: 1000.00
			})
		})

		it('handles missing optional fields', () => {
			const raw = createValidRow({
				'Gebühren': '',
				'Steuern': '',
				'Notiz': '',
				'Quelle': ''
			})
			const result = transformCSVRow(raw)

			expect(result).toMatchObject({
				gebuehren: 0,
				steuern: 0,
				notiz: '',
				quelle: ''
			})
		})

		it('throws error for unknown transaction type', () => {
			const raw = createValidRow({ 'Typ': 'UnknownType' })

			expect(() => transformCSVRow(raw)).toThrow('Unknown transaction type: UnknownType')
		})

		it('handles case insensitive transaction types', () => {
			const raw1 = createValidRow({ 'Typ': 'kauf' })
			const raw2 = createValidRow({ 'Typ': 'VERKAUF' })
			const raw3 = createValidRow({ 'Typ': 'dividende' })

			expect(transformCSVRow(raw1).typ).toBe('KAUF')
			expect(transformCSVRow(raw2).typ).toBe('VERKAUF')
			expect(transformCSVRow(raw3).typ).toBe('DIVIDENDE')
		})
	})

	describe('parseCSVFile', () => {
		it('parses complete CSV file correctly', () => {
			const csvContent = `Datum;Typ;Wertpapier;Stück;Kurs;Betrag;Gebühren;Steuern;Gesamtpreis;Konto;Gegenkonto;Notiz;Quelle
2023-11-15 00:00:00;Kauf;Apple Inc.;100,0;150,25;15025,00;1,50;0,00;15026,50;ACC123;BANK001;Buy order;Manual
2023-11-16 00:00:00;Dividende;Apple Inc.;;;24,50;0,00;0,00;24,50;ACC123;BANK001;Quarterly dividend;Auto`

			const result = parseCSVFile(csvContent)

			expect(result).toHaveLength(2)
			
			expect(result[0]).toMatchObject({
				typ: 'KAUF',
				wertpapier: 'Apple Inc.',
				stueck: 100.0,
				kurs: 150.25,
				betrag: 15025.00
			})

			expect(result[1]).toMatchObject({
				typ: 'DIVIDENDE',
				wertpapier: 'Apple Inc.',
				stueck: null,
				kurs: null,
				betrag: 24.50
			})
		})

		it('throws error for empty CSV', () => {
			expect(() => parseCSVFile('')).toThrow('CSV file must contain at least header and one data row')
		})

		it('throws error for header only', () => {
			const csvContent = 'Datum;Typ;Wertpapier;Stück;Kurs;Betrag;Gebühren;Steuern;Gesamtpreis;Konto;Gegenkonto;Notiz;Quelle'
			
			expect(() => parseCSVFile(csvContent)).toThrow('CSV file must contain at least header and one data row')
		})

		it('provides helpful error messages for invalid rows', () => {
			const csvContent = `Datum;Typ;Wertpapier;Stück;Kurs;Betrag;Gebühren;Steuern;Gesamtpreis;Konto;Gegenkonto;Notiz;Quelle
2023-11-15 00:00:00;Kauf;Apple Inc.;100,0;150,25;15025,00;1,50;0,00;15026,50;ACC123;BANK001;Buy order;Manual
invalid;row;with;too;few;columns`

			expect(() => parseCSVFile(csvContent)).toThrow('Error parsing line 3: Invalid CSV format: expected 13 columns, got 6')
		})

		it('handles multiple valid transactions', () => {
			const csvContent = `Datum;Typ;Wertpapier;Stück;Kurs;Betrag;Gebühren;Steuern;Gesamtpreis;Konto;Gegenkonto;Notiz;Quelle
2023-11-15 00:00:00;Kauf;Apple Inc.;100,0;150,25;15025,00;1,50;0,00;15026,50;ACC123;BANK001;Buy order;Manual
2023-11-16 00:00:00;Verkauf;Apple Inc.;50,0;155,00;7750,00;1,50;15,00;7733,50;ACC123;BANK001;Sell order;Manual
2023-11-17 00:00:00;Dividende;Apple Inc.;;;24,50;0,00;0,00;24,50;ACC123;BANK001;Dividend;Auto
2023-11-18 00:00:00;Einlage;;;;1000,00;0,00;0,00;1000,00;ACC123;BANK001;Deposit;Manual`

			const result = parseCSVFile(csvContent)

			expect(result).toHaveLength(4)
			expect(result[0].typ).toBe('KAUF')
			expect(result[1].typ).toBe('VERKAUF')
			expect(result[2].typ).toBe('DIVIDENDE')
			expect(result[3].typ).toBe('EINLAGE')
		})

		it('handles whitespace in CSV content', () => {
			const csvContent = `
Datum;Typ;Wertpapier;Stück;Kurs;Betrag;Gebühren;Steuern;Gesamtpreis;Konto;Gegenkonto;Notiz;Quelle
2023-11-15 00:00:00;Kauf;Apple Inc.;100,0;150,25;15025,00;1,50;0,00;15026,50;ACC123;BANK001;Buy order;Manual

			`

			const result = parseCSVFile(csvContent)

			expect(result).toHaveLength(1)
			expect(result[0].typ).toBe('KAUF')
		})
	})
})