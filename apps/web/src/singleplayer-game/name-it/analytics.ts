import type {
	GameState,
	RoundOutcome,
} from '@georally/game-domain/singleplayer/name-it'
import {
	trackSingleplayerGameEnd,
	trackSingleplayerGameStart,
	trackSingleplayerQuestionAnswered,
} from '@/shared/analytics/track'
import {
	useRoundEvents,
	type RoundEventHandlers,
} from '../shared/useRoundEvents'

const TRACKED_OUTCOME = {
	correct: 'correct',
	timeUp: 'time_up',
	giveUp: 'gave_up',
} as const satisfies Record<RoundOutcome, string>

const HANDLERS: RoundEventHandlers<GameState> = {
	onStart: (state, isRetry) => {
		trackSingleplayerGameStart({
			mode: 'name_it',
			difficulty: state.config.difficulty,
			scope: state.config.scope,
			questionCount: state.config.questionCount,
			timeLimitSeconds: state.config.timeLimitMs / 1000,
			isRetry,
		})
	},
	onReveal: state => {
		if (state.phase !== 'revealed') {
			return
		}

		trackSingleplayerQuestionAnswered({
			mode: 'name_it',
			questionNumber: state.index + 1,
			isCorrect: state.outcome === 'correct',
			outcome: TRACKED_OUTCOME[state.outcome],
			attemptsUsed: state.attempts.length,
			responseTimeMs: state.resolvedAt - state.startedAt,
		})
	},
	onFinish: (state, durationMs) => {
		if (state.phase !== 'finished') {
			return
		}

		trackSingleplayerGameEnd({
			mode: 'name_it',
			difficulty: state.config.difficulty,
			scope: state.config.scope,
			questionCount: state.questionIds.length,
			score: state.score,
			correctCount: state.correctCount,
			durationMs,
		})
	},
}

export function useNameItAnalytics(state: GameState | null, restored: boolean) {
	useRoundEvents(state, restored, HANDLERS)
}
