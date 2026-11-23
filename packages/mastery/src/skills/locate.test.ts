import {
	createIdleState,
	reduceGameState,
	type RevealedGameState,
} from '@georally/game-domain/singleplayer/locate'
import { describe, expect, it } from 'vitest'
import type { ReviewKind } from '../types'
import { gradeLocate, LOCATE_SLOW_MS, locateOutcome } from './locate'

const TARGET = '417'
const T0 = 1_000_000

function reveal(
	answer: { pick: string } | 'giveUp',
	afterMs: number,
): RevealedGameState {
	const idle = createIdleState({ attemptsPerQuestion: 1 })
	const started = reduceGameState(idle, {
		type: 'START',
		session: { config: idle.config, questionIds: [TARGET] },
		now: T0,
	})
	const now = T0 + afterMs
	const revealed = reduceGameState(
		started,
		answer === 'giveUp'
			? { type: 'GIVE_UP', now }
			: { type: 'PICK', countryId: answer.pick, now },
	)
	if (revealed.phase !== 'revealed') {
		throw new Error(`expected a revealed round, got ${revealed.phase}`)
	}
	return revealed
}

describe('gradeLocate', () => {
	it.each([
		['a wrong pick', { pick: '398' }, 2_000, 'due', 'again'],
		['a give-up', 'giveUp', 2_000, 'new', 'again'],
		['correct on a new card', { pick: TARGET }, 3_000, 'new', 'easy'],
		['correct on a due card', { pick: TARGET }, 3_000, 'due', 'good'],
		['correct on a recheck', { pick: TARGET }, 3_000, 'recheck', 'good'],
		['correct at the cap', { pick: TARGET }, LOCATE_SLOW_MS, 'due', 'good'],
		[
			'correct past the cap',
			{ pick: TARGET },
			LOCATE_SLOW_MS + 1,
			'due',
			'hard',
		],
		[
			'slow on a new card',
			{ pick: TARGET },
			LOCATE_SLOW_MS + 1,
			'new',
			'hard',
		],
	] as const)('rates %s', (_, answer, afterMs, kind: ReviewKind, rating) => {
		const outcome = locateOutcome(reveal(answer, afterMs), 'mouse')
		expect(gradeLocate(outcome, kind)).toBe(rating)
	})

	it('records a wrong pick as the end, not as a wrong attempt', () => {
		expect(locateOutcome(reveal({ pick: '398' }, 2_000), 'touch')).toEqual({
			shape: 'single',
			result: 'wrong',
			responseMs: 2_000,
			wrongAttempts: 0,
			input: 'touch',
		})
	})
})
