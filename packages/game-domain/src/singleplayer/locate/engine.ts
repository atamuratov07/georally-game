import { assertNever } from '../../shared/errors'
import { calculateQuestionScore } from './score'
import { getAttemptsLeft, getTargetId } from './selectors'
import type {
	GameAction,
	GameConfig,
	GameSession,
	GameState,
	PlayingGameState,
	RevealedGameState,
} from './types'
import { DEFAULT_GAME_CONFIG } from './types'

function createPlayingGameState(
	session: GameSession,
	now: number,
): PlayingGameState {
	return {
		phase: 'playing',
		config: session.config,
		questionIds: session.questionIds,
		index: 0,
		wrongPicks: [],
		score: 0,
		correctCount: 0,
		questionStartedAt: now,
	}
}

function revealCurrentQuestion(
	state: PlayingGameState,
	now: number,
): RevealedGameState {
	const targetId = getTargetId(state)
	if (!targetId) {
		throw new Error('Cannot reveal a question without a valid target.')
	}

	return {
		phase: 'revealed',
		config: state.config,
		questionIds: state.questionIds,
		index: state.index,
		wrongPicks: state.wrongPicks,
		isCorrect: false,
		score: state.score,
		correctCount: state.correctCount,
		questionStartedAt: state.questionStartedAt,
		questionResolvedAt: now,
	}
}

export function createIdleGameState(
	configOverride: Partial<GameConfig> = {},
): GameState {
	return {
		phase: 'idle',
		config: {
			...DEFAULT_GAME_CONFIG,
			...configOverride,
			questionCount:
				configOverride.questionCount ?? DEFAULT_GAME_CONFIG.questionCount,

			attemptsPerQuestion:
				configOverride.attemptsPerQuestion ??
				DEFAULT_GAME_CONFIG.attemptsPerQuestion,
		},
	}
}

export function reduceGameState(
	state: GameState,
	action: GameAction,
): GameState {
	switch (action.type) {
		case 'START': {
			if (action.session.questionIds.length === 0) {
				throw new Error('START action requires at least one question.')
			}

			return createPlayingGameState(action.session, action.now)
		}

		case 'PICK': {
			if (state.phase !== 'playing') {
				return state
			}

			const targetId = getTargetId(state)
			if (!targetId) {
				throw new Error('Playing state requires a valid target question.')
			}

			if (action.countryId === targetId) {
				const questionScore = calculateQuestionScore(
					state.questionStartedAt,
					action.now,
					state.wrongPicks.length,
				)

				return {
					phase: 'revealed',
					config: state.config,
					questionIds: state.questionIds,
					index: state.index,
					wrongPicks: state.wrongPicks,
					isCorrect: true,
					score: state.score + questionScore,
					correctCount: state.correctCount + 1,
					questionStartedAt: state.questionStartedAt,
					questionResolvedAt: action.now,
				}
			}

			if (state.wrongPicks.includes(action.countryId)) {
				return state
			}

			const nextPlayingState: PlayingGameState = {
				...state,
				wrongPicks: [...state.wrongPicks, action.countryId],
			}

			if (getAttemptsLeft(nextPlayingState) === 0) {
				return revealCurrentQuestion(nextPlayingState, action.now)
			}

			return nextPlayingState
		}

		case 'GIVE_UP': {
			if (state.phase !== 'playing') {
				return state
			}

			return revealCurrentQuestion(state, action.now)
		}

		case 'NEXT': {
			if (state.phase !== 'revealed') {
				return state
			}

			const nextIndex = state.index + 1
			if (nextIndex >= state.questionIds.length) {
				return {
					phase: 'finished',
					config: state.config,
					questionIds: state.questionIds,
					index: nextIndex,
					score: state.score,
					correctCount: state.correctCount,
					questionResolvedAt: state.questionResolvedAt,
					finishedAt: action.now,
				}
			}

			return {
				phase: 'playing',
				config: state.config,
				questionIds: state.questionIds,
				index: nextIndex,
				wrongPicks: [],
				score: state.score,
				correctCount: state.correctCount,
				questionStartedAt: action.now,
			}
		}

		default:
			return assertNever(action)
	}
}
