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
		wrongPicks: [],
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

		case 'PICK': {
			if (state.phase !== 'answering') {
				return state
			}

			const { countryId, now } = action
			if (countryId === state.questionIds[state.index]) {
				const points = scoreAnswer(
					state.startedAt,
					now,
					state.wrongPicks.length,
				)
				return revealRound(state, 'correct', points, now)
			}
			if (state.wrongPicks.includes(countryId)) {
				return state
			}

			const answering = {
				...state,
				wrongPicks: [...state.wrongPicks, countryId],
			}
			return answering.wrongPicks.length >= state.config.attemptsPerQuestion
				? revealRound(answering, 'outOfAttempts', 0, now)
				: answering
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
