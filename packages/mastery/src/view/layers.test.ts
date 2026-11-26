import { describe, expect, it } from 'vitest'
import type { CardId } from '../types'
import type { MasteryView } from './deriveMastery'
import { overallLayer } from './layers'

const view = (
	level: MasteryView['level'],
	due: number,
	fading = false,
): MasteryView => ({ level, fading, due })

describe('overallLayer', () => {
	const views = new Map<CardId, MasteryView>([
		['250:locate', view('mastered', 30, true)],
		['250:name', view('familiar', 20)],
		['276:locate', view('mastered', 10)],
	])

	it('shows the weakest active skill that has met the country', () => {
		const layer = overallLayer(views, ['locate', 'name'])

		expect(layer.get('250')).toEqual(view('familiar', 20, true))
		expect(layer.get('276')).toEqual(view('mastered', 10))
		expect(layer.has('380')).toBe(false)
	})

	it('leaves a paused skill out', () => {
		expect(overallLayer(views, ['locate']).get('250')).toEqual(
			view('mastered', 30, true),
		)
	})
})
