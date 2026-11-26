import type { CountryId } from '../../shared/types'
import type { Attempt, GameState, RoundOutcome } from './types'

export function getOutcome(state: GameState): RoundOutcome | null {
	return state.phase === 'revealed' ? state.outcome : null
}

export function getRemainingMs(state: GameState, now: number): number {
	return state.phase === 'answering' ? Math.max(state.deadlineAt - now, 0) : 0
}

export function getDeadlineAt(state: GameState): number | null {
	return state.phase === 'answering' ? state.deadlineAt : null
}

export function getWrongNames(state: GameState): CountryId[] {
	if (state.phase !== 'answering' && state.phase !== 'revealed') return []
	const target = state.questionIds[state.index]
	return state.attempts.flatMap(({ result }) =>
		result.kind === 'match' && result.countryId !== target
			? [result.countryId]
			: [],
	)
}

export function getLastAttempt(state: GameState): Attempt | null {
	return state.phase === 'answering' || state.phase === 'revealed'
		? (state.attempts.at(-1) ?? null)
		: null
}
