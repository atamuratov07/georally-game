import { describe, expect, it } from 'vitest'
import type { MasteryView } from './deriveMastery'
import { summarizeLayer } from './summarize'

const MASTERED: MasteryView = { level: 'mastered', fading: false }
const FAMILIAR: MasteryView = { level: 'familiar', fading: false }

describe('summarizeLayer', () => {
	it('counts mastered countries of the pool, for the world and each continent', () => {
		const pool = {
			countriesById: {
				'250': { continent: 'europe', difficulty: 'easy' },
				'276': { continent: 'europe', difficulty: 'easy' },
				'392': { continent: 'asia', difficulty: 'easy' },
			},
		} as const
		const layer = new Map([
			['250', MASTERED],
			['276', FAMILIAR],
			['999', MASTERED], // no longer in the catalog
		])

		const summary = summarizeLayer(layer, pool)

		expect(summary.world).toEqual({ mastered: 1, total: 3 })
		expect(summary.continents.europe).toEqual({ mastered: 1, total: 2 })
		expect(summary.continents.asia).toEqual({ mastered: 0, total: 1 })
		expect(summary.continents.africa).toEqual({ mastered: 0, total: 0 })
	})
})
