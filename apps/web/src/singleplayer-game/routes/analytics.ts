import {
	type RouteBoard,
	type RouteConfig,
	type RouteState,
} from '@georally/game-domain/singleplayer/routes'
import { useEffect, useRef } from 'react'
import { trackRoutesEnd, trackRoutesStart } from '@/shared/analytics/track'

function gameParams(config: RouteConfig, board: RouteBoard) {
	return config.kind === 'practice'
		? {
				kind: config.kind,
				difficulty: config.difficulty,
				regions: config.regions,
				par: board.par,
			}
		: { kind: config.kind, difficulty: 'daily', regions: [], par: board.par }
}

export function useRoutesAnalytics(
	state: RouteState | null,
	board: RouteBoard | null,
	restored: boolean,
) {
	const previousPhaseRef = useRef(restored ? (state?.phase ?? null) : null)

	useEffect(() => {
		if (!state || !board) {
			return
		}

		const previous = previousPhaseRef.current
		previousPhaseRef.current = state.phase

		if (previous === 'idle' && state.phase === 'playing') {
			trackRoutesStart(gameParams(state.config, board))
		}
		if (previous === 'playing' && state.phase === 'finished') {
			trackRoutesEnd({
				...gameParams(state.config, board),
				guesses: state.guesses.length,
				hints: state.hints.length,
				outcome: state.outcome === 'solved' ? 'solved' : 'gave_up',
				durationMs: state.finishedAt - state.startedAt,
			})
		}
	}, [board, state])
}
