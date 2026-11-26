import {
	createIdleState,
	reduceGameState,
	type GameState,
	type RevealedGameState,
} from '@georally/game-domain/singleplayer/name-it'
import { describe, expect, it } from 'vitest'
import type { ReviewKind } from '../types'
import { gradeName, NAME_SLOW_MS, nameOutcome } from './name'

const TARGET = '417'
const T0 = 1_000_000

type Answer = 'exact' | 'fuzzy' | 'giveUp' | 'timeUp'

function attempt(
	state: GameState,
	countryId: string | null, // null: matches no country
	via: 'exact' | 'fuzzy',
	now: number,
) {
	return reduceGameState(state, {
		type: 'ATTEMPT',
		method: 'typing',
		result: countryId
			? { kind: 'match', countryId, via, heard: countryId }
			: { kind: 'none', heard: 'atlantis' },
		now,
	})
}

function reveal(
	answer: Answer,
	afterMs: number,
	wrong = 0,
	unmatched = 0,
): RevealedGameState {
	const idle = createIdleState({ questionCount: 1 })
	let state = reduceGameState(idle, {
		type: 'START',
		session: { config: idle.config, questionIds: [TARGET] },
		now: T0,
	})
	for (let index = 0; index < wrong; index += 1) {
		state = attempt(state, '398', 'exact', T0 + 1_000)
	}
	for (let index = 0; index < unmatched; index += 1) {
		state = attempt(state, null, 'exact', T0 + 1_000)
	}
	const now = T0 + afterMs
	state =
		answer === 'giveUp'
			? reduceGameState(state, { type: 'GIVE_UP', now })
			: answer === 'timeUp'
				? reduceGameState(state, { type: 'TIME_UP', now })
				: attempt(state, TARGET, answer, now)
	if (state.phase !== 'revealed') {
		throw new Error(`expected a revealed round, got ${state.phase}`)
	}
	return state
}

describe('gradeName', () => {
	it.each<[string, Answer, number, number, ReviewKind, string]>([
		['time up', 'timeUp', 20_000, 0, 'due', 'again'],
		['a give-up', 'giveUp', 2_000, 0, 'new', 'again'],
		['correct on a new card', 'exact', 3_000, 0, 'new', 'easy'],
		['correct on a due card', 'exact', 3_000, 0, 'due', 'good'],
		['a typo the matcher accepts', 'fuzzy', 3_000, 0, 'due', 'good'],
		['correct after a wrong name', 'exact', 3_000, 1, 'due', 'hard'],
		['correct at the cap', 'exact', NAME_SLOW_MS, 0, 'due', 'good'],
		['correct past the cap', 'exact', NAME_SLOW_MS + 1, 0, 'new', 'hard'],
	])('rates %s', (_, answer, afterMs, wrong, kind, rating) => {
		const outcome = nameOutcome(reveal(answer, afterMs, wrong), 'typing')
		expect(gradeName(outcome, kind)).toBe(rating)
	})

	it('records a time-up after wrong names with their count, not unmatched text', () => {
		expect(nameOutcome(reveal('timeUp', 25_000, 2, 1), 'voice')).toEqual({
			shape: 'single',
			result: 'timeUp',
			responseMs: 20_000,
			wrongAttempts: 2,
			input: 'voice',
		})
	})
})
