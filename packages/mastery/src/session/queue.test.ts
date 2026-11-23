import { describe, expect, it } from 'vitest'
import { applyAnswer, LEARN_AHEAD_MS, selectNext, startSession } from './queue'

const MINUTE = 60_000
const DAY = 86_400_000

describe('session queue', () => {
	it('brings a missed card back between the others, then early at the end', () => {
		let now = 0
		let state = startSession(['a:locate', 'b:locate', 'c:locate'])

		expect(selectNext(state, now)).toBe('a:locate')
		state = applyAnswer(state, 'a:locate', now + MINUTE, now)

		now += 30_000
		expect(selectNext(state, now)).toBe('b:locate')
		state = applyAnswer(state, 'b:locate', now + 2 * DAY, now)

		now += 40_000
		expect(selectNext(state, now)).toBe('a:locate')
		state = applyAnswer(state, 'a:locate', now + 10 * MINUTE, now)

		now += 5_000
		expect(selectNext(state, now)).toBe('c:locate')
		state = applyAnswer(state, 'c:locate', now + 3 * DAY, now)

		expect(selectNext(state, now)).toBe('a:locate')
		state = applyAnswer(state, 'a:locate', now + 2 * DAY, now)

		expect(selectNext(state, now)).toBe('complete')
		expect(state.reviewed).toBe(5)
	})

	it('lets a card leave once its next review is past the learn-ahead window', () => {
		const state = applyAnswer(
			startSession(['a:locate']),
			'a:locate',
			LEARN_AHEAD_MS + 1,
			0,
		)

		expect(selectNext(state, 0)).toBe('complete')
	})
})
