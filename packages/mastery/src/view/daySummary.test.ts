import { describe, expect, it } from 'vitest'
import type { CardId, Rating, ReviewKind, ReviewLogEntry } from '../types'
import { summarizeDay } from './daySummary'

function entry(
	cardId: CardId,
	kind: ReviewKind,
	rating: Rating,
): ReviewLogEntry {
	return {
		id: `${cardId}-${kind}-${rating}`,
		cardId,
		reviewedAt: 0,
		kind,
		rating,
		outcome: {
			shape: 'single',
			result: rating === 'again' ? 'wrong' : 'correct',
			responseMs: 3_000,
			wrongAttempts: 0,
			input: 'mouse',
		},
	}
}

describe('summarizeDay', () => {
	it('counts a card introduced today as new, even after its repeats', () => {
		const summary = summarizeDay([
			entry('056:locate', 'new', 'again'),
			entry('380:locate', 'new', 'easy'),
			entry('056:locate', 'due', 'good'),
			entry('250:locate', 'due', 'good'),
		])

		expect(summary.newIds).toEqual(['056:locate', '380:locate'])
		expect(summary.reviewedIds).toEqual(['250:locate'])
		expect(summary.flawless).toBe(false)
	})
})
