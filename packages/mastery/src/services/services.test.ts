import { playableCountryPool as pool } from '@georally/country-catalog'
import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { fsrsScheduler } from '../fsrs/fsrsScheduler'
import { createIdbRepository } from '../idb/idbRepository'
import { rebuildCards } from '../rebuildCards'
import { SCHEDULER_VERSION } from '../schedulerVersion'
import { PACES } from '../settings'
import type { AnswerOutcome, CardId, CardRecord } from '../types'
import { addScope } from './addScope'
import { loadToday } from './loadToday'
import { recordAnswer } from './recordAnswer'

const DAY = 86_400_000
const T0 = Date.UTC(2026, 10, 24, 9)
const TODAY = {
	key: '2026-11-24',
	start: T0 - 9 * 3_600_000,
	end: T0 + 15 * 3_600_000,
}
const QUICK: AnswerOutcome = {
	shape: 'single',
	result: 'correct',
	responseMs: 3_000,
	wrongAttempts: 0,
	input: 'touch',
}

let databases = 0
function freshDeps() {
	databases += 1
	return {
		repository: createIdbRepository(`services-test-${databases}`),
		scheduler: fsrsScheduler,
	}
}

function answer(cardId: CardId, entryId: string, now: number) {
	return { cardId, outcome: QUICK, entryId, now }
}

describe('mastery services', () => {
	it('schedules a second overlapping answer from the first one’s card', async () => {
		const deps = freshDeps()

		const [first, second] = await Promise.all([
			recordAnswer(deps, answer('417:locate', 'a', T0)),
			recordAnswer(deps, answer('417:locate', 'b', T0 + 1_000)),
		])

		expect([first.entry.kind, second.entry.kind]).toEqual(['new', 'due'])
		expect(second.card.scheduling).toEqual(
			fsrsScheduler.next(
				first.card.scheduling,
				second.entry.rating,
				T0 + 1_000,
			),
		)
	})

	it('rebuilds stored cards when the scheduler version changed', async () => {
		const deps = freshDeps()
		await recordAnswer(deps, answer('417:locate', 'a', T0 - 3 * DAY))
		await recordAnswer(deps, answer('250:locate', 'b', T0 - 2 * DAY))
		await deps.repository.replaceCards(() => [], SCHEDULER_VERSION - 1)

		const today = await loadToday(deps, { pool, day: TODAY })

		const byId = (cards: CardRecord[]) =>
			[...cards].sort((x, y) => x.id.localeCompare(y.id))
		expect(byId(today.cards)).toEqual(
			byId(rebuildCards(await deps.repository.loadLog(), fsrsScheduler)),
		)
		expect(today.cards).toHaveLength(2)
		expect(today.meta.schedulerVersion).toBe(SCHEDULER_VERSION)
	})

	it('plans nothing before a scope, then the pace’s new cards and today’s extra', async () => {
		const deps = freshDeps()
		expect((await loadToday(deps, { pool, day: TODAY })).sessionPlan).toEqual(
			[],
		)

		await addScope(deps, { regions: ['europe'], now: T0, seed: 7 })
		const firstDay = await loadToday(deps, { pool, day: TODAY })
		expect(firstDay.sessionPlan).toHaveLength(PACES.steady.newPerDay)

		await deps.repository.saveExtraNew({ day: '2026-11-23', count: 5 })
		expect((await loadToday(deps, { pool, day: TODAY })).sessionPlan).toEqual(
			firstDay.sessionPlan,
		)
		await deps.repository.saveExtraNew({ day: TODAY.key, count: 5 })
		expect(
			(await loadToday(deps, { pool, day: TODAY })).sessionPlan,
		).toHaveLength(PACES.steady.newPerDay + 5)
	})
})
