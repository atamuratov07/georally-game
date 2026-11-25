import { describe, expect, it } from 'vitest'
import { answerCard } from './answerCard'
import { fsrsScheduler } from './fsrs/fsrsScheduler'
import type { AnswerOutcome } from './types'

const T0 = Date.UTC(2026, 10, 23, 9)
const DAY = 86_400_000
const QUICK: AnswerOutcome = {
	shape: 'single',
	result: 'correct',
	responseMs: 3_000,
	wrongAttempts: 0,
	input: 'touch',
}

function answer(now: number, entryId: string) {
	return { cardId: '417:locate' as const, outcome: QUICK, entryId, now }
}

describe('answerCard', () => {
	it('derives the kind from what storage holds, not from the plan', () => {
		const first = answerCard(undefined, true, answer(T0, 'a'), fsrsScheduler)
		const due = answerCard(
			first.card,
			false,
			answer(T0 + 8 * DAY, 'b'),
			fsrsScheduler,
		)
		const rechecked = answerCard(
			due.card,
			true,
			answer(T0 + 9 * DAY, 'c'),
			fsrsScheduler,
		)

		expect([first, due, rechecked].map(result => result.entry.kind)).toEqual([
			'new',
			'due',
			'recheck',
		])
		expect(first.card).toMatchObject({
			id: '417:locate',
			countryId: '417',
			skillId: 'locate',
			introducedAt: T0,
		})
		expect(rechecked.card.introducedAt).toBe(T0)
	})

	it('logs the outcome with the rating it was given', () => {
		const { card, entry } = answerCard(
			undefined,
			false,
			answer(T0, 'a'),
			fsrsScheduler,
		)

		expect(entry).toEqual({
			id: 'a',
			cardId: '417:locate',
			reviewedAt: T0,
			kind: 'new',
			outcome: QUICK,
			rating: 'easy',
		})
		expect(card.scheduling).toEqual(fsrsScheduler.next(null, 'easy', T0))
	})
})
