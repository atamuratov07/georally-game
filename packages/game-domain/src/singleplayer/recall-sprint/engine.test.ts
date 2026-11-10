import { describe, expect, it } from 'vitest'

import type { MatchResult } from '../../answers'
import { sprintDurationMs } from './duration'
import { createIdleState, reduceSprintState } from './engine'
import type { SprintAction, SprintState } from './types'

const T0 = 1_000_000
const DURATION_MS = 60_000
const match = (countryId: string): MatchResult => ({
	kind: 'match',
	countryId,
	via: 'exact',
	heard: countryId,
})
const ambiguous = (...countryIds: string[]): MatchResult => ({
	kind: 'ambiguous',
	countryIds,
	heard: 'x',
})

function started(countryIds = ['178', '180', '250']): SprintState {
	const idle = createIdleState()
	return reduceSprintState(idle, {
		type: 'START',
		session: { config: idle.config, countryIds, durationMs: DURATION_MS },
		now: T0,
	})
}

function attempt(
	results: MatchResult[],
	now = T0 + 1_000,
): Extract<SprintAction, { type: 'ATTEMPT' }> {
	return { type: 'ATTEMPT', method: 'voice', heard: 'x', results, now }
}

describe('recall sprint duration', () => {
	it('scales with the region and the chosen length', () => {
		expect(sprintDurationMs(195, 'short')).toBe(300_000)
		expect(sprintDurationMs(195, 'long')).toBe(900_000)
		expect(sprintDurationMs(44, 'short')).toBe(120_000)
		expect(sprintDurationMs(44, 'medium')).toBe(240_000)
		expect(sprintDurationMs(12, 'short')).toBe(90_000)
		expect(sprintDurationMs(12, 'long')).toBe(270_000)
	})
})

describe('recall sprint engine', () => {
	it('sorts a phrase into new, repeated and outside countries', () => {
		let state = reduceSprintState(started(), attempt([match('250')]))
		state = reduceSprintState(
			state,
			attempt([match('178'), match('250'), match('036'), match('178')]),
		)

		expect(state).toMatchObject({
			phase: 'running',
			found: ['250', '178'],
			lastAttempt: {
				foundIds: ['178'],
				repeatedIds: ['250', '178'],
				outsideIds: ['036'],
				unresolved: [],
			},
		})
	})

	it('narrows ambiguous names to the region', () => {
		const narrowed = reduceSprintState(
			started(['180', '250']),
			attempt([ambiguous('178', '180')]),
		)
		expect(narrowed).toMatchObject({ found: ['180'] })

		const unclear = reduceSprintState(
			started(),
			attempt([ambiguous('178', '180')]),
		)
		expect(unclear).toMatchObject({
			found: [],
			lastAttempt: { unresolved: [{ kind: 'ambiguous' }] },
		})
	})

	it('ends at the deadline without counting late answers', () => {
		const state = started()
		expect(
			reduceSprintState(state, {
				type: 'TIME_UP',
				now: T0 + DURATION_MS - 1,
			}),
		).toBe(state)
		expect(
			reduceSprintState(state, attempt([match('250')], T0 + DURATION_MS)),
		).toMatchObject({
			phase: 'finished',
			endedBy: 'timeUp',
			finishedAt: T0 + DURATION_MS,
			found: [],
		})
	})

	it('finishes early on request, or as time up after the deadline', () => {
		const state = started()
		expect(
			reduceSprintState(state, { type: 'FINISH', now: T0 + 5_000 }),
		).toMatchObject({
			phase: 'finished',
			endedBy: 'finished',
			finishedAt: T0 + 5_000,
		})
		expect(
			reduceSprintState(state, { type: 'FINISH', now: T0 + DURATION_MS }),
		).toMatchObject({ endedBy: 'timeUp', finishedAt: T0 + DURATION_MS })
	})

	it('ends early once every country is named', () => {
		const state = reduceSprintState(
			started(['178', '180']),
			attempt([match('180'), match('178')], T0 + 5_000),
		)
		expect(state).toMatchObject({
			phase: 'finished',
			endedBy: 'complete',
			finishedAt: T0 + 5_000,
		})
	})
})
