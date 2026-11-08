import {
	DEFAULT_GAME_CONFIG,
	type GameConfig,
} from '@georally/game-domain/singleplayer/name-it'
import {
	isDifficulty,
	isOption,
	isScope,
	readDifficulty,
	readNumberOption,
	readScope,
} from '../shared/setupParams'

export const QUESTION_COUNT_OPTIONS = [10, 20, 30] as const
export const TIME_LIMIT_SECONDS_OPTIONS = [10, 20, 30] as const

const DEFAULT_TIME_LIMIT_SECONDS = DEFAULT_GAME_CONFIG.timeLimitMs / 1000

function hasDefaultInputs(inputs: unknown): boolean {
	return (
		Array.isArray(inputs) &&
		inputs.length === DEFAULT_GAME_CONFIG.inputs.length &&
		DEFAULT_GAME_CONFIG.inputs.every(input => inputs.includes(input))
	)
}

export function isGameConfig(value: unknown): value is GameConfig {
	if (typeof value !== 'object' || value === null) {
		return false
	}

	const config = value as Record<keyof GameConfig, unknown>
	return (
		isOption(config.questionCount, QUESTION_COUNT_OPTIONS) &&
		typeof config.timeLimitMs === 'number' &&
		isOption(config.timeLimitMs / 1000, TIME_LIMIT_SECONDS_OPTIONS) &&
		isDifficulty(config.difficulty) &&
		isScope(config.scope) &&
		hasDefaultInputs(config.inputs)
	)
}

export function toSearchParams(config: GameConfig): URLSearchParams {
	return new URLSearchParams({
		questionCount: String(config.questionCount),
		time: String(config.timeLimitMs / 1000),
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
		timeLimitMs:
			readNumberOption(
				searchParams,
				'time',
				TIME_LIMIT_SECONDS_OPTIONS,
				DEFAULT_TIME_LIMIT_SECONDS,
			) * 1000,
		difficulty: readDifficulty(searchParams, DEFAULT_GAME_CONFIG.difficulty),
		scope: readScope(searchParams, DEFAULT_GAME_CONFIG.scope),
		inputs: DEFAULT_GAME_CONFIG.inputs,
	}
}
