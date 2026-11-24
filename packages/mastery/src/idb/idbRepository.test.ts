import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { answerCard } from '../answerCard'
import { fsrsScheduler } from '../fsrs/fsrsScheduler'
import type { AnswerOutcome, CardId } from '../types'
import { createIdbRepository } from './idbRepository'
import { openMasteryDb } from './schema'

const T0 = Date.UTC(2026, 10, 23, 9)
const QUICK: AnswerOutcome = {
	shape: 'single',
	result: 'correct',
	responseMs: 3_000,
	wrongAttempts: 0,
	input: 'touch',
}

let databases = 0
function freshName() {
	databases += 1
	return `mastery-test-${databases}`
}

function answer(cardId: CardId, entryId: string, now: number) {
	return (current: Parameters<typeof answerCard>[0], recheck: boolean) =>
		answerCard(
			current,
			recheck,
			{ cardId, outcome: QUICK, entryId, now },
			fsrsScheduler,
		)
}

describe('idbRepository', () => {
	it('answers each review on the card the one before it stored', async () => {
		const repository = createIdbRepository(freshName())
		await repository.recordReview('417:locate', answer('417:locate', 'a', T0))
		await repository.requestRecheck(['417:locate'], T0 + 1_000)

		await Promise.all([
			repository.recordReview(
				'417:locate',
				answer('417:locate', 'b', T0 + 2_000),
			),
			repository.recordReview(
				'417:locate',
				answer('417:locate', 'c', T0 + 3_000),
			),
		])

		const log = await repository.loadLog()
		expect(log.map(entry => [entry.id, entry.kind])).toEqual([
			['a', 'new'],
			['b', 'recheck'],
			['c', 'due'],
		])
		const [card] = await repository.loadCards()
		expect(card.scheduling.reps).toBe(3)
		expect((await repository.loadMeta()).rechecks).toEqual({})
	})

	it('writes nothing when the answer cannot be computed', async () => {
		const repository = createIdbRepository(freshName())
		await repository.requestRecheck(['417:locate'], T0)

		await expect(
			repository.recordReview('417:locate', () => {
				throw new Error('no grader')
			}),
		).rejects.toThrow('no grader')

		expect(await repository.loadLog()).toEqual([])
		expect(await repository.loadCards()).toEqual([])
		expect((await repository.loadMeta()).rechecks).toEqual({
			'417:locate': T0,
		})
	})

	it('skips malformed records on read and keeps them stored', async () => {
		const name = freshName()
		const repository = createIdbRepository(name)
		await repository.recordReview('417:locate', answer('417:locate', 'a', T0))
		const db = await openMasteryDb(name)
		const [good] = await db.getAll('reviewLog')
		const unknownShape = {
			...good,
			id: 'b',
			outcome: { shape: 'set', found: 3, of: 5 },
		}
		await db.add('reviewLog', unknownShape as never)
		await db.put('meta', { pace: 'frantic', pausedSkills: [] }, 'settings')

		expect((await repository.loadLog()).map(entry => entry.id)).toEqual(['a'])
		expect((await repository.loadMeta()).settings.pace).toBe('steady')
		expect(await db.count('reviewLog')).toBe(2)
		db.close()
	})

	it('loads a half-open range of the log and every review time in order', async () => {
		const repository = createIdbRepository(freshName())
		for (const [cardId, entryId, at] of [
			['616:locate', 'c', T0 + 2],
			['417:locate', 'a', T0],
			['516:locate', 'b', T0 + 1],
		] as const) {
			await repository.recordReview(cardId, answer(cardId, entryId, at))
		}

		const range = await repository.loadLog({ from: T0, to: T0 + 2 })
		expect(range.map(entry => entry.id).sort()).toEqual(['a', 'b'])
		expect(await repository.loadReviewTimes()).toEqual([T0, T0 + 1, T0 + 2])
	})

	it('replaces every card and records the scheduler version', async () => {
		const repository = createIdbRepository(freshName())
		await repository.recordReview('417:locate', answer('417:locate', 'a', T0))
		const rebuilt = answer('516:locate', 'x', T0)(undefined, false).card

		await repository.replaceCards([rebuilt], 3)

		expect(await repository.loadCards()).toEqual([rebuilt])
		expect((await repository.loadMeta()).schedulerVersion).toBe(3)
	})
})
