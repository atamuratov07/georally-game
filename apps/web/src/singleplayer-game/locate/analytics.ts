import type {
	GameState,
	RoundOutcome,
} from '@georally/game-domain/singleplayer/locate'
import {
	useRoundEvents,
	type RoundEventHandlers,
} from '../shared/useRoundEvents'
import {
	trackSingleplayerGameEnd,
	trackSingleplayerGameStart,
	trackSingleplayerQuestionAnswered,
} from '@/shared/analytics/track'

const TRACKED_OUTCOME = {
	correct: 'correct',
	outOfAttempts: 'exhausted_attempts',
	giveUp: 'gave_up',
} as const satisfies Record<RoundOutcome, string>

const HANDLERS: RoundEventHandlers<GameState> = {
	onStart: (state, isRetry) => {
		trackSingleplayerGameStart({
			mode: 'locate',
			difficulty: state.config.difficulty,
			scope: state.config.scope,
			questionCount: state.config.questionCount,
			attemptsPerQuestion: state.config.attemptsPerQuestion,
			isRetry,
		})
	},
	onReveal: state => {
		if (state.phase !== 'revealed') {
			return
		}

		trackSingleplayerQuestionAnswered({
			mode: 'locate',
			questionNumber: state.index + 1,
			isCorrect: state.outcome === 'correct',
			outcome: TRACKED_OUTCOME[state.outcome],
			attemptsUsed: state.wrongPicks.length,
			responseTimeMs: state.resolvedAt - state.startedAt,
		})
	},
	onFinish: (state, durationMs) => {
		if (state.phase !== 'finished') {
			return
		}

		trackSingleplayerGameEnd({
			mode: 'locate',
			difficulty: state.config.difficulty,
			scope: state.config.scope,
			questionCount: state.questionIds.length,
			score: state.score,
			correctCount: state.correctCount,
			durationMs,
		})
	},
}

export function useLocateGameAnalytics(
	state: GameState | null,
	restored: boolean,
): void {
	useRoundEvents(state, restored, HANDLERS)
}
