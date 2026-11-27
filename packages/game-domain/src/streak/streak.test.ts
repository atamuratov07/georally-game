import { describe, expect, it } from 'vitest'

import { addDays, daysBetween, deriveStreak, weekday } from '.'

describe('days', () => {
	it('counts across months, leap days and years', () => {
		expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
		expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
		expect(addDays('2028-03-01', -1)).toBe('2028-02-29')
		expect(daysBetween('2026-11-28', '2027-11-28')).toBe(365)
		expect(weekday('2026-11-28')).toBe(5)
	})
})

describe('streak', () => {
	const days = [
		'2026-12-27',
		'2026-12-28',
		'2026-12-29',
		'2026-12-31',
		'2027-01-01',
	]

	it('counts the run that reaches today or yesterday', () => {
		expect(deriveStreak([...days, '2027-01-02'], '2027-01-02')).toEqual({
			current: 3,
			best: 3,
			todayActive: true,
		})
		expect(deriveStreak(days, '2027-01-02')).toEqual({
			current: 2,
			best: 3,
			todayActive: false,
		})
		expect(deriveStreak(days, '2027-01-03').current).toBe(0)
	})

	it('ignores repeated days and days after today', () => {
		const repeated = ['2027-01-01', '2027-01-01', '2026-12-31', '2027-01-05']
		expect(deriveStreak(repeated, '2027-01-01')).toEqual({
			current: 2,
			best: 2,
			todayActive: true,
		})
	})
})
