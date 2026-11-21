import type { CountryId } from '../../shared/types'
import type { RouteBoard } from './board'
import type {
	FinishedRouteState,
	RouteMove,
	RouteState,
	StartedRouteState,
	TimelineEvent,
} from './types'

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

export function getMoves(state: RouteState): RouteMove[] {
	const moves: {
		kind: RouteMove['kind']
		at: number
		countryIds: CountryId[]
	}[] = []
	for (const { kind, at, countryId } of getTimeline(state)) {
		const last = moves.at(-1)
		if (last && last.kind === kind && last.at === at) {
			last.countryIds.push(countryId)
		} else {
			moves.push({ kind, at, countryIds: [countryId] })
		}
	}
	return moves
}

export function getLastMove(state: StartedRouteState): RouteMove | null {
	const attempt = state.lastAttempt
	const hint = state.hints.at(-1)
	if (hint && (!attempt || hint.at > attempt.at)) {
		return { kind: 'hint', at: hint.at, countryIds: [hint.countryId] }
	}
	return attempt
		? { kind: 'guess', at: attempt.at, countryIds: attempt.addedIds }
		: null
}

export function getFinalChain(
	board: RouteBoard,
	state: FinishedRouteState,
): CountryId[] | null {
	const known = getKnownIds(state)
	return state.outcome === 'solved'
		? board.chainWithin(known)
		: board.completion(known)
}

export function getMissingIds(
	board: RouteBoard,
	state: FinishedRouteState,
): CountryId[] {
	if (state.outcome !== 'gaveUp') return []
	const known = getKnownIds(state)
	const isEnd = (id: CountryId) =>
		id === board.startId || id === board.targetId
	return (getFinalChain(board, state) ?? []).filter(
		id => !isEnd(id) && !known.has(id),
	)
}

export function isPerfect(board: RouteBoard, state: RouteState): boolean {
	return (
		state.phase === 'finished' &&
		state.outcome === 'solved' &&
		state.hints.length === 0 &&
		getScore(state) === board.par
	)
}
