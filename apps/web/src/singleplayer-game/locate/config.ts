import {
	DEFAULT_GAME_CONFIG,
	type GameConfig,
} from '@georally/game-domain/singleplayer/locate'
import {
	isDifficulty,
	isOption,
	isScope,
	readDifficulty,
	readNumberOption,
	readScope,
} from '../shared/setupParams'

export const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20] as const
export const ATTEMPTS_PER_QUESTION_OPTIONS = [1, 2, 3, 4, 5] as const

export function isGameConfig(value: unknown): value is GameConfig {
	if (typeof value !== 'object' || value === null) {
		return false
	}

	const config = value as Record<keyof GameConfig, unknown>
	return (
		isOption(config.questionCount, QUESTION_COUNT_OPTIONS) &&
		isOption(config.attemptsPerQuestion, ATTEMPTS_PER_QUESTION_OPTIONS) &&
		isDifficulty(config.difficulty) &&
		isScope(config.scope)
	)
}

export function toSearchParams(config: GameConfig): URLSearchParams {
	return new URLSearchParams({
		questionCount: String(config.questionCount),
		attempts: String(config.attemptsPerQuestion),
		difficulty: config.difficulty,
		scope: config.scope,
	})
}

export function readSetupConfig(searchParams: URLSearchParams): GameConfig {
	return {
		questionCount: readNumberOption(
			searchParams,
			'questionCount',
			QUESTION_COUNT_OPTIONS,
			DEFAULT_GAME_CONFIG.questionCount,
		),
		attemptsPerQuestion: readNumberOption(
			searchParams,
			'attempts',
			ATTEMPTS_PER_QUESTION_OPTIONS,
			DEFAULT_GAME_CONFIG.attemptsPerQuestion,
		),
		difficulty: readDifficulty(searchParams, DEFAULT_GAME_CONFIG.difficulty),
		scope: readScope(searchParams, DEFAULT_GAME_CONFIG.scope),
	}
}
