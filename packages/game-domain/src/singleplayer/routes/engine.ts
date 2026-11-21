import { assertNever } from '../../shared/errors'
import type { RouteBoard } from './board'
import { getKnownIds, getTimeline } from './selectors'
import type {
	Attempt,
	FinishedRouteState,
	PlayingRouteState,
	RouteAction,
	RouteConfig,
	RouteEnds,
	RouteOutcome,
	RouteState,
} from './types'

export function createIdleState(config: RouteConfig): RouteState {
	return { phase: 'idle', config }
}

function finish(
	state: PlayingRouteState,
	outcome: RouteOutcome,
	finishedAt: number,
): FinishedRouteState {
	return { ...state, phase: 'finished', outcome, finishedAt }
}

function assertBoardFits(board: RouteBoard, ends: RouteEnds): void {
	if (board.startId !== ends.startId || board.targetId !== ends.targetId) {
		throw new Error('The board belongs to another route.')
	}
}

export function reduceRouteState(
	board: RouteBoard,
	state: RouteState,
	action: RouteAction,
): RouteState {
	if (action.type === 'START') {
		assertBoardFits(board, action.session)
	} else if (state.phase !== 'idle') {
		assertBoardFits(board, state)
	}

	switch (action.type) {
		case 'START': {
			const { session, now } = action
			return {
				phase: 'playing',
				config: session.config,
				startId: session.startId,
				targetId: session.targetId,
				guesses: [],
				hints: [],
				startedAt: now,
				lastAttempt: null,
			}
		}

		case 'ATTEMPT': {
			if (state.phase !== 'playing' || action.results.length === 0) {
				return state
			}

			const { method, heard, results, now } = action
			const known = new Set(getKnownIds(state))
			const guesses = [...state.guesses]
			const attempt: Attempt = {
				method,
				at: now,
				heard,
				addedIds: [],
				repeatedIds: [],
				endpointIds: [],
				unresolved: [],
			}
			let solved = false

			for (const result of results) {
				if (solved) break
				if (result.kind !== 'match') {
					attempt.unresolved.push(result)
					continue
				}

				const { countryId } = result
				if (countryId === state.startId || countryId === state.targetId) {
					attempt.endpointIds.push(countryId)
				} else if (known.has(countryId)) {
					attempt.repeatedIds.push(countryId)
				} else {
					known.add(countryId)
					attempt.addedIds.push(countryId)
					guesses.push({ countryId, method, at: now })
					solved = board.isSolved(known)
				}
			}

			const next: PlayingRouteState = {
				...state,
				guesses,
				lastAttempt: attempt,
			}
			return solved ? finish(next, 'solved', now) : next
		}

		case 'HINT': {
			if (state.phase !== 'playing') {
				return state
			}

			const known = new Set(getKnownIds(state))
			const countryId = board.nextHint(
				known,
				getTimeline(state).map(event => event.countryId),
			)
			if (countryId === null) {
				return state
			}

			known.add(countryId)
			const next: PlayingRouteState = {
				...state,
				hints: [...state.hints, { countryId, at: action.now }],
			}
			return board.isSolved(known)
				? finish(next, 'solved', action.now)
				: next
		}

		case 'GIVE_UP': {
			if (state.phase !== 'playing') {
				return state
			}

			return finish(state, 'gaveUp', action.now)
		}

		default:
			return assertNever(action)
	}
}
