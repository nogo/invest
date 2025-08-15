import { describe, it, expect } from 'bun:test'
import { FilterSchema } from './validators'

describe('Validators', () => {
	describe('FilterSchema', () => {
		it('validates empty object', () => {
			const result = FilterSchema.safeParse({})
			expect(result.success).toBe(true)
			
			if (result.success) {
				expect(result.data.q).toBeUndefined()
			}
		})

		it('validates with query string', () => {
			const result = FilterSchema.safeParse({ q: 'AAPL' })
			expect(result.success).toBe(true)
			
			if (result.success) {
				expect(result.data.q).toBe('AAPL')
			}
		})

		it('validates with empty query string', () => {
			const result = FilterSchema.safeParse({ q: '' })
			expect(result.success).toBe(true)
			
			if (result.success) {
				expect(result.data.q).toBe('')
			}
		})

		it('ignores additional properties', () => {
			const result = FilterSchema.safeParse({ 
				q: 'AAPL', 
				extraField: 'ignored' 
			})
			expect(result.success).toBe(true)
			
			if (result.success) {
				expect(result.data.q).toBe('AAPL')
				expect('extraField' in result.data).toBe(false)
			}
		})

		it('rejects non-string query', () => {
			const result = FilterSchema.safeParse({ q: 123 })
			expect(result.success).toBe(false)
		})
	})
})