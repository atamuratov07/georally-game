import type { CountryId } from '../../shared/types'
import type { RouteState, TimelineEvent } from './types'

export function getKnownIds(state: RouteState): ReadonlySet<CountryId> {
	if (state.phase === 'idle') return new Set()
	return new Set([
		...state.guesses.map(guess => guess.countryId),
		...state.hints.map(hint => hint.countryId),
	])
}

export function getScore(state: RouteState): number {
	return state.phase === 'idle' ? 0 : state.guesses.length + state.hints.length
}

export function getTimeline(state: RouteState): TimelineEvent[] {
	if (state.phase === 'idle') return []

	const { guesses, hints } = state
	const events: TimelineEvent[] = []
	let h = 0
	for (const { countryId, at } of guesses) {
		for (; h < hints.length && hints[h].at < at; h++) {
			events.push({ kind: 'hint', ...hints[h] })
		}
		events.push({ kind: 'guess', countryId, at })
	}
	for (; h < hints.length; h++) events.push({ kind: 'hint', ...hints[h] })
	return events
}
