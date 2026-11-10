import type { SprintState } from '@georally/game-domain/singleplayer/recall-sprint'
import { useEffect, useRef } from 'react'
import {
	trackSingleplayerGameEnd,
	trackSingleplayerGameStart,
} from '@/shared/analytics/track'

export function useSprintAnalytics(
	state: SprintState | null,
	restored: boolean,
) {
	const previousPhaseRef = useRef(restored ? (state?.phase ?? null) : null)

	useEffect(() => {
		if (!state) {
			return
		}

		const previous = previousPhaseRef.current
		previousPhaseRef.current = state.phase

		if (previous === 'idle' && state.phase === 'running') {
			trackSingleplayerGameStart({
				mode: 'recall_sprint',
				difficulty: 'all',
				scope: state.config.scope,
				questionCount: state.countryIds.length,
				timeLimitSeconds: state.durationMs / 1000,
				isRetry: false,
			})
		}
		if (previous === 'running' && state.phase === 'finished') {
			trackSingleplayerGameEnd({
				mode: 'recall_sprint',
				difficulty: 'all',
				scope: state.config.scope,
				questionCount: state.countryIds.length,
				score: state.found.length,
				correctCount: state.found.length,
				durationMs: state.finishedAt - state.startedAt,
			})
		}
	}, [state])
}
