import { useEffect, useRef } from 'react'
import type {
	GameState,
	RoundOutcome,
} from '@georally/game-domain/singleplayer/locate'
import {
	trackSingleplayerGameEnd,
	trackSingleplayerGameStart,
	trackSingleplayerQuestionAnswered,
} from './track'

const TRACKED_OUTCOME = {
	correct: 'correct',
	outOfAttempts: 'exhausted_attempts',
	giveUp: 'gave_up',
} as const satisfies Record<RoundOutcome, string>

export function useLocateGameAnalytics(
	state: GameState | null,
	restored: boolean,
): void {
	const restoredState = restored ? state : null
	const previousPhaseRef = useRef<GameState['phase'] | null>(
		restoredState?.phase ?? null,
	)
	const hasStartedOnceRef = useRef(restored)
	const gameStartedAtRef = useRef<number | null>(null)
	const lastQuestionTrackedRef = useRef<number | null>(
		restoredState?.phase === 'revealed' ? restoredState.index : null,
	)
	const finishedTrackedRef = useRef(restoredState?.phase === 'finished')

	useEffect(() => {
		if (!state) {
			return
		}

		const previousPhase = previousPhaseRef.current
		previousPhaseRef.current = state.phase

		if (
			state.phase === 'answering' &&
			previousPhase !== 'answering' &&
			previousPhase !== 'revealed'
		) {
			const isRetry = hasStartedOnceRef.current
			hasStartedOnceRef.current = true
			gameStartedAtRef.current = Date.now()
			lastQuestionTrackedRef.current = null
			finishedTrackedRef.current = false

			trackSingleplayerGameStart({
				difficulty: state.config.difficulty,
				scope: state.config.scope,
				questionCount: state.config.questionCount,
				attemptsPerQuestion: state.config.attemptsPerQuestion,
				isRetry,
			})
		}

		if (
			state.phase === 'revealed' &&
			lastQuestionTrackedRef.current !== state.index
		) {
			lastQuestionTrackedRef.current = state.index
			trackSingleplayerQuestionAnswered({
				questionNumber: state.index + 1,
				isCorrect: state.outcome === 'correct',
				outcome: TRACKED_OUTCOME[state.outcome],
				attemptsUsed: state.wrongPicks.length,
				responseTimeMs: state.resolvedAt - state.startedAt,
			})
		}

		if (state.phase === 'finished' && !finishedTrackedRef.current) {
			finishedTrackedRef.current = true
			const durationMs = gameStartedAtRef.current
				? Date.now() - gameStartedAtRef.current
				: undefined

			trackSingleplayerGameEnd({
				difficulty: state.config.difficulty,
				scope: state.config.scope,
				questionCount: state.questionIds.length,
				score: state.score,
				correctCount: state.correctCount,
				durationMs,
			})
		}
	}, [state])
}
