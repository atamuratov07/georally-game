import { useEffect, useRef } from 'react'
import type {
	GameConfig,
	GameState,
} from '@georally/game-domain/singleplayer/locate'
import {
	trackSingleplayerGameEnd,
	trackSingleplayerGameStart,
	trackSingleplayerQuestionAnswered,
} from './track'

export function useSingleplayerGameAnalytics(
	state: GameState,
	config: GameConfig,
): void {
	const previousPhaseRef = useRef<GameState['phase'] | null>(null)
	const hasStartedOnceRef = useRef(false)
	const gameStartedAtRef = useRef<number | null>(null)
	const lastQuestionTrackedRef = useRef<number | null>(null)
	const finishedTrackedRef = useRef(false)

	useEffect(() => {
		const previousPhase = previousPhaseRef.current
		previousPhaseRef.current = state.phase

		if (
			state.phase === 'playing' &&
			previousPhase !== 'playing' &&
			previousPhase !== 'revealed'
		) {
			const isRetry = hasStartedOnceRef.current
			hasStartedOnceRef.current = true
			gameStartedAtRef.current = Date.now()
			lastQuestionTrackedRef.current = null
			finishedTrackedRef.current = false

			trackSingleplayerGameStart({
				difficulty: config.difficulty,
				scope: config.scope,
				questionCount: config.questionCount,
				attemptsPerQuestion: config.attemptsPerQuestion,
				isRetry,
			})
		}

		if (
			state.phase === 'revealed' &&
			lastQuestionTrackedRef.current !== state.index
		) {
			lastQuestionTrackedRef.current = state.index
			const attemptsUsed = state.wrongPicks.length
			const outcome = state.isCorrect
				? 'correct'
				: attemptsUsed >= state.config.attemptsPerQuestion
					? 'exhausted_attempts'
					: 'gave_up'

			trackSingleplayerQuestionAnswered({
				questionNumber: state.index + 1,
				isCorrect: state.isCorrect,
				outcome,
				attemptsUsed,
				responseTimeMs: state.questionResolvedAt - state.questionStartedAt,
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
	}, [state, config])
}
