import type { MatchResult } from '../../answers'
import { assertNever } from '../../shared/errors'
import type { CountryId } from '../../shared/types'
import {
	DEFAULT_SPRINT_CONFIG,
	type Attempt,
	type FinishedSprintState,
	type RunningSprintState,
	type SprintAction,
	type SprintConfig,
	type SprintEndedBy,
	type SprintState,
} from './types'

type Classified = Pick<
	Attempt,
	'foundIds' | 'repeatedIds' | 'outsideIds' | 'unresolved'
>

function classify(
	state: RunningSprintState,
	results: readonly MatchResult[],
): Classified {
	const inRegion = new Set<CountryId>(state.countryIds)
	const named = new Set<CountryId>(state.found)
	const classified: Classified = {
		foundIds: [],
		repeatedIds: [],
		outsideIds: [],
		unresolved: [],
	}

	for (const result of results) {
		if (result.kind === 'none') {
			classified.unresolved.push(result)
			continue
		}

		const matched =
			result.kind === 'match' ? [result.countryId] : result.countryIds
		const regional = matched.filter(countryId => inRegion.has(countryId))
		if (regional.length > 1) {
			classified.unresolved.push(result)
			continue
		}
		if (regional.length === 0) {
			classified.outsideIds.push(...matched)
			continue
		}

		const [countryId] = regional
		if (named.has(countryId)) {
			classified.repeatedIds.push(countryId)
		} else {
			named.add(countryId)
			classified.foundIds.push(countryId)
		}
	}

	return classified
}

function endSprint(
	state: RunningSprintState,
	endedBy: SprintEndedBy,
	finishedAt: number,
): FinishedSprintState {
	return { ...state, phase: 'finished', endedBy, finishedAt }
}

export function createIdleState(
	config: Partial<SprintConfig> = {},
): SprintState {
	return { phase: 'idle', config: { ...DEFAULT_SPRINT_CONFIG, ...config } }
}

export function reduceSprintState(
	state: SprintState,
	action: SprintAction,
): SprintState {
	switch (action.type) {
		case 'START': {
			const { session, now } = action
			if (session.countryIds.length === 0) {
				throw new Error('START action requires at least one country.')
			}

			return {
				phase: 'running',
				config: session.config,
				countryIds: session.countryIds,
				durationMs: session.durationMs,
				startedAt: now,
				deadlineAt: now + session.durationMs,
				found: [],
				lastAttempt: null,
			}
		}

		case 'ATTEMPT': {
			if (state.phase !== 'running') {
				return state
			}

			const { method, heard, results, now } = action
			if (now >= state.deadlineAt) {
				return endSprint(state, 'timeUp', state.deadlineAt)
			}
			if (results.length === 0) {
				return state
			}

			const classified = classify(state, results)
			const running: RunningSprintState = {
				...state,
				found: [...state.found, ...classified.foundIds],
				lastAttempt: { method, at: now, heard, ...classified },
			}

			return running.found.length === running.countryIds.length
				? endSprint(running, 'complete', now)
				: running
		}

		case 'TIME_UP': {
			if (state.phase !== 'running' || action.now < state.deadlineAt) {
				return state
			}

			return endSprint(state, 'timeUp', state.deadlineAt)
		}

		case 'FINISH': {
			if (state.phase !== 'running') {
				return state
			}

			return action.now >= state.deadlineAt
				? endSprint(state, 'timeUp', state.deadlineAt)
				: endSprint(state, 'finished', action.now)
		}

		default:
			return assertNever(action)
	}
}
