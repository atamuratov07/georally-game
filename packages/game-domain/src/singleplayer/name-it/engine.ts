import { assertNever } from '../../shared/errors'
import { scoreAnswer } from './score'
import {
	DEFAULT_GAME_CONFIG,
	type AnsweringGameState,
	type GameAction,
	type GameConfig,
	type GameState,
	type RevealedGameState,
	type RoundOutcome,
} from './types'

type RoundStart = Pick<
	AnsweringGameState,
	'config' | 'questionIds' | 'score' | 'correctCount'
>

function startRound(
	game: RoundStart,
	index: number,
	now: number,
): AnsweringGameState {
	return {
		phase: 'answering',
		config: game.config,
		questionIds: game.questionIds,
		index,
		score: game.score,
		correctCount: game.correctCount,
		startedAt: now,
		deadlineAt: now + game.config.timeLimitMs,
		attempts: [],
	}
}

function revealRound(
	state: AnsweringGameState,
	outcome: RoundOutcome,
	points: number,
	resolvedAt: number,
): RevealedGameState {
	return {
		...state,
		phase: 'revealed',
		outcome,
		points,
		score: state.score + points,
		correctCount: state.correctCount + (outcome === 'correct' ? 1 : 0),
		resolvedAt,
	}
}

export function createIdleState(config: Partial<GameConfig> = {}): GameState {
	return { phase: 'idle', config: { ...DEFAULT_GAME_CONFIG, ...config } }
}

export function reduceGameState(
	state: GameState,
	action: GameAction,
): GameState {
	switch (action.type) {
		case 'START': {
			const { session, now } = action
			if (session.questionIds.length === 0) {
				throw new Error('START action requires at least one question.')
			}

			return startRound(
				{
					config: session.config,
					questionIds: session.questionIds,
					score: 0,
					correctCount: 0,
				},
				0,
				now,
			)
		}

		case 'ATTEMPT': {
			if (state.phase !== 'answering') {
				return state
			}

			const { method, result, now } = action
			if (now >= state.deadlineAt) {
				return revealRound(state, 'timeUp', 0, state.deadlineAt)
			}
			if (!state.config.inputs.includes(method) || result.heard === '') {
				return state
			}

			if (
				result.kind === 'match' &&
				result.countryId === state.questionIds[state.index]
			) {
				const points = scoreAnswer(
					state.startedAt,
					now,
					state.config.timeLimitMs,
				)
				return revealRound(state, 'correct', points, now)
			}

			return {
				...state,
				attempts: [...state.attempts, { method, result, at: now }],
			}
		}

		case 'TIME_UP': {
			if (state.phase !== 'answering' || action.now < state.deadlineAt) {
				return state
			}

			return revealRound(state, 'timeUp', 0, state.deadlineAt)
		}

		case 'GIVE_UP': {
			if (state.phase !== 'answering') {
				return state
			}

			return revealRound(state, 'giveUp', 0, action.now)
		}

		case 'NEXT': {
			if (state.phase !== 'revealed') {
				return state
			}

			const index = state.index + 1
			if (index >= state.questionIds.length) {
				return {
					phase: 'finished',
					config: state.config,
					questionIds: state.questionIds,
					index,
					score: state.score,
					correctCount: state.correctCount,
					finishedAt: action.now,
				}
			}

			return startRound(state, index, action.now)
		}

		default:
			return assertNever(action)
	}
}
