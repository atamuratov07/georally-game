import type { CountryId } from '../../shared/types'
import type { Attempt, SprintState } from './types'

export function getFoundIds(state: SprintState): readonly CountryId[] {
	return state.phase === 'idle' ? [] : state.found
}

export function getFoundCount(state: SprintState): number {
	return state.phase === 'idle' ? 0 : state.found.length
}

export function getTotalCount(state: SprintState): number {
	return state.phase === 'idle' ? 0 : state.countryIds.length
}

export function getMissedIds(state: SprintState): CountryId[] {
	if (state.phase !== 'finished') {
		return []
	}

	const found = new Set(state.found)
	return state.countryIds.filter(countryId => !found.has(countryId))
}

export function getDeadlineAt(state: SprintState): number | null {
	return state.phase === 'running' ? state.deadlineAt : null
}

export function getRemainingMs(state: SprintState, now: number): number {
	return state.phase === 'running' ? Math.max(state.deadlineAt - now, 0) : 0
}

export function getLastAttempt(state: SprintState): Attempt | null {
	return state.phase === 'idle' ? null : state.lastAttempt
}
