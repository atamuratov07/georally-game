import { describe, expect, it } from 'vitest'
import { fsrsScheduler } from './fsrs/fsrsScheduler'
import { rebuildCards } from './rebuildCards'
import { LOCATE_SLOW_MS } from './skills/locate'
import type {
	CardId,
	Rating,
	ReviewKind,
	ReviewLogEntry,
	SchedulingState,
} from './types'

const MINUTE = 60_000
const DAY = 86_400_000
const T0 = Date.UTC(2026, 10, 23, 9)

let nextId = 0

function entry(
	cardId: CardId,
	reviewedAt: number,
	kind: ReviewKind,
	answer: 'right' | 'wrong' | 'slow',
	rating: Rating,
): ReviewLogEntry {
	nextId += 1
	return {
		id: `entry-${nextId}`,
		cardId,
		reviewedAt,
		kind,
		outcome: {
			shape: 'single',
			result: answer === 'wrong' ? 'wrong' : 'correct',
			responseMs: answer === 'slow' ? LOCATE_SLOW_MS + 1 : 3_000,
			wrongAttempts: 0,
			input: 'mouse',
		},
		rating,
	}
}

function schedule(steps: [Rating, number][]): SchedulingState {
	let state: SchedulingState | null = null
	for (const [rating, at] of steps) {
		state = fsrsScheduler.next(state, rating, at)
	}
	if (!state) {
		throw new Error('no steps')
	}
	return state
}

describe('rebuildCards', () => {
	it('replays each card in review order, whatever the log order', () => {
		const log = [
			entry('417:locate', T0, 'new', 'wrong', 'again'),
			entry('398:locate', T0 + MINUTE / 2, 'new', 'right', 'easy'),
			entry('417:locate', T0 + MINUTE, 'due', 'right', 'good'),
			entry('417:locate', T0 + 11 * MINUTE, 'due', 'right', 'good'),
			entry('398:locate', T0 + 8 * DAY, 'due', 'wrong', 'again'),
		]

		expect(rebuildCards([...log].reverse(), fsrsScheduler)).toEqual([
			{
				id: '417:locate',
				countryId: '417',
				skillId: 'locate',
				introducedAt: T0,
				scheduling: schedule([
					['again', T0],
					['good', T0 + MINUTE],
					['good', T0 + 11 * MINUTE],
				]),
			},
			{
				id: '398:locate',
				countryId: '398',
				skillId: 'locate',
				introducedAt: T0 + MINUTE / 2,
				scheduling: schedule([
					['easy', T0 + MINUTE / 2],
					['again', T0 + 8 * DAY],
				]),
			},
		])
	})

	it('grades each outcome with the current grader, not the stored rating', () => {
		const log = [
			entry('417:locate', T0, 'new', 'right', 'good'),
			entry('417:locate', T0 + 3 * DAY, 'due', 'slow', 'good'),
		]

		expect(rebuildCards(log, fsrsScheduler)[0].scheduling).toEqual(
			schedule([
				['easy', T0],
				['hard', T0 + 3 * DAY],
			]),
		)
	})
})
