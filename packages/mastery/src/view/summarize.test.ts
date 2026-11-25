import { describe, expect, it } from 'vitest'
import type { MasteryView } from './deriveMastery'
import { summarizeLayer } from './summarize'

const view = (level: MasteryView['level']): MasteryView => ({
	level,
	fading: false,
	due: 0,
})

describe('summarizeLayer', () => {
	it('counts the pool’s known countries, for the world and each continent', () => {
		const pool = {
			countriesById: {
				'250': { continent: 'europe', difficulty: 'easy' },
				'276': { continent: 'europe', difficulty: 'easy' },
				'616': { continent: 'europe', difficulty: 'easy' },
				'392': { continent: 'asia', difficulty: 'easy' },
			},
		} as const
		const layer = new Map([
			['250', view('mastered')],
			['276', view('familiar')],
			['616', view('learning')],
			['999', view('mastered')], // no longer in the catalog
		])

		const summary = summarizeLayer(layer, pool)

		expect(summary.all).toEqual({ known: 2, total: 4 })
		expect(summary.europe).toEqual({ known: 2, total: 3 })
		expect(summary.asia).toEqual({ known: 0, total: 1 })
		expect(summary.africa).toEqual({ known: 0, total: 0 })
	})
})
