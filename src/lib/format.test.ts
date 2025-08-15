import { describe, it, expect } from 'bun:test'
import { numberColor } from './format'

describe('Format Utilities', () => {
	describe('numberColor', () => {
		it('returns green class for positive numbers', () => {
			expect(numberColor(100)).toBe('text-green-600')
			expect(numberColor(0.01)).toBe('text-green-600')
			expect(numberColor(1000000)).toBe('text-green-600')
		})

		it('returns empty string for zero (falsy)', () => {
			expect(numberColor(0)).toBe('')
		})

		it('returns red class for negative numbers', () => {
			expect(numberColor(-100)).toBe('text-red-600')
			expect(numberColor(-0.01)).toBe('text-red-600')
			expect(numberColor(-1000000)).toBe('text-red-600')
		})

		it('returns empty string for NaN', () => {
			expect(numberColor(NaN)).toBe('')
		})

		it('returns empty string for null/undefined', () => {
			expect(numberColor(null as any)).toBe('')
			expect(numberColor(undefined as any)).toBe('')
		})

		it('handles edge cases', () => {
			expect(numberColor(Infinity)).toBe('text-green-600')
			expect(numberColor(-Infinity)).toBe('text-red-600')
		})
	})
})