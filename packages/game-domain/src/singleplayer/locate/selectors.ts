import type { CountryId } from '../../shared/types'
import type { GameState, RoundOutcome } from './types'

export function getOutcome(state: GameState): RoundOutcome | null {
	return state.phase === 'revealed' ? state.outcome : null
}

export function getWrongPicks(state: GameState): CountryId[] {
	return state.phase === 'answering' || state.phase === 'revealed'
		? state.wrongPicks
		: []
}

export function getAttemptsLeft(state: GameState): number {
	return state.phase === 'answering' || state.phase === 'revealed'
		? Math.max(0, state.config.attemptsPerQuestion - state.wrongPicks.length)
		: 0
}
