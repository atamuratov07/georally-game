import { describe, expect, it } from 'vitest'
import { isGameRegions, normalizeGameRegions } from './regions'

describe('region lists', () => {
	it('orders, dedupes, and treats every region as the whole world', () => {
		expect(normalizeGameRegions(['europe', 'asia', 'europe'])).toEqual([
			'asia',
			'europe',
		])
		expect(
			normalizeGameRegions([
				'africa',
				'asia',
				'europe',
				'north-america',
				'oceania',
				'south-america',
			]),
		).toEqual([])
	})

	it('accepts only the normal form', () => {
		expect(isGameRegions([])).toBe(true)
		expect(isGameRegions(['asia', 'europe'])).toBe(true)
		expect(isGameRegions(['europe', 'asia'])).toBe(false)
		expect(isGameRegions(['mars'])).toBe(false)
	})
})
