import { playableCountryPool as pool } from '@georally/country-catalog'
import { describe, expect, it } from 'vitest'
import { fsrsScheduler } from '../fsrs/fsrsScheduler'
import { rebuildCards } from '../rebuildCards'
import { PACES } from '../settings'
import { SKILL_IDS, type Pace } from '../types'
import { simulate } from './simulate'

const DAYS = 150
const SETTLED_FROM = 110

describe.each(Object.keys(PACES) as Pace[])('a %s player', pace => {
	const runs = [
		simulate({ pace, days: DAYS, pool, scheduler: fsrsScheduler, seed: 1 }),
		simulate({
			pace,
			days: DAYS,
			breakDays: { from: 50, length: 10 },
			pool,
			scheduler: fsrsScheduler,
			seed: 1,
		}),
	]

	it('ends every session and meets every country', () => {
		for (const run of runs) {
			expect(run.days.every(day => day.ended)).toBe(true)
			expect(run.cards).toHaveLength(
				Object.keys(pool.countriesById).length * SKILL_IDS.length,
			)
		}
	})

	it('settles under the review cap, even after a break', () => {
		for (const run of runs) {
			const settled = run.days.filter(day => day.day >= SETTLED_FROM)
			expect(settled.every(day => day.dueLeftOver === 0)).toBe(true)
			expect(Math.max(...settled.map(day => day.reviews))).toBeLessThan(
				PACES[pace].reviewCap,
			)
		}
	})

	it('replays its log to the cards it stored', () => {
		const [, withBreak] = runs
		expect(rebuildCards(withBreak.log, fsrsScheduler)).toEqual(
			withBreak.cards,
		)
	})
})
