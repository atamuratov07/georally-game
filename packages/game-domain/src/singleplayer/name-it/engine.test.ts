import { describe, expect, it } from 'vitest'

import type { MatchResult } from '../../answers'
import { createIdleState, reduceGameState } from './engine'
import type { GameState } from './types'

const T0 = 1_000_000
const match = (countryId: string): MatchResult => ({
	kind: 'match',
	countryId,
	via: 'exact',
	heard: countryId,
})

function started(questionIds = ['036', '040']): GameState {
	const idle = createIdleState({ timeLimitMs: 20_000 })
	return reduceGameState(idle, {
		type: 'START',
		session: { config: idle.config, questionIds },
		now: T0,
	})
}

describe('name-it engine', () => {
	it('records wrong attempts and scores a correct answer by time left', () => {
		let state = started()
		state = reduceGameState(state, {
			type: 'ATTEMPT',
			method: 'typing',
			result: match('040'),
			now: T0 + 2_000,
		})
		state = reduceGameState(state, {
			type: 'ATTEMPT',
			method: 'voice',
			result: { kind: 'ambiguous', countryIds: ['036', '554'], heard: 'x' },
			now: T0 + 3_000,
		})
		expect(state).toMatchObject({ phase: 'answering', attempts: [{}, {}] })

		state = reduceGameState(state, {
			type: 'ATTEMPT',
			method: 'typing',
			result: match('036'),
			now: T0 + 5_000,
		})
		expect(state).toMatchObject({
			phase: 'revealed',
			outcome: 'correct',
			points: 88,
			score: 88,
			correctCount: 1,
		})
	})

	it('ends a round at the deadline, whichever arrives first', () => {
		const state = started()
		expect(reduceGameState(state, { type: 'TIME_UP', now: T0 + 19_999 })).toBe(
			state,
		)
		expect(
			reduceGameState(state, {
				type: 'ATTEMPT',
				method: 'typing',
				result: match('036'),
				now: T0 + 20_000,
			}),
		).toMatchObject({ phase: 'revealed', outcome: 'timeUp', points: 0 })
	})

	it('finishes after the last round', () => {
		let state = started(['036'])
		state = reduceGameState(state, { type: 'GIVE_UP', now: T0 + 1_000 })
		state = reduceGameState(state, { type: 'NEXT', now: T0 + 2_000 })
		expect(state).toMatchObject({ phase: 'finished', score: 0 })
	})
})
