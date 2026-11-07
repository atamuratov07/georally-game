import {
	GAME_DIFFICULTIES,
	GAME_SCOPES,
	type GameDifficulty,
	type GameScope,
} from '@georally/game-domain'
import {
	DEFAULT_GAME_CONFIG,
	type GameConfig,
} from '@georally/game-domain/singleplayer/locate'

export const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20] as const
export const ATTEMPTS_PER_QUESTION_OPTIONS = [1, 2, 3, 4, 5] as const

export const DIFFICULTY_OPTIONS: Array<{
	value: GameDifficulty
}> = [{ value: 'easy' }, { value: 'medium' }, { value: 'hard' }]

export const SCOPE_OPTIONS: Array<{
	value: GameScope
}> = [
	{ value: 'all' },
	{ value: 'africa' },
	{ value: 'asia' },
	{ value: 'europe' },
	{ value: 'north-america' },
	{ value: 'south-america' },
	{ value: 'oceania' },
]

function isDifficulty(value: unknown): value is GameDifficulty {
	return GAME_DIFFICULTIES.includes(value as GameDifficulty)
}

function isScope(value: unknown): value is GameScope {
	return GAME_SCOPES.includes(value as GameScope)
}

function isOption(value: unknown, options: readonly number[]): boolean {
	return options.includes(value as number)
}

function parseNumberOption(
	value: string | null,
	options: readonly number[],
): number | null {
	if (value === null) {
		return null
	}

	const parsed = Number.parseInt(value, 10)
	return isOption(parsed, options) ? parsed : null
}

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
	const difficulty = searchParams.get('difficulty')
	const scope = searchParams.get('scope')

	return {
		questionCount:
			parseNumberOption(
				searchParams.get('questionCount'),
				QUESTION_COUNT_OPTIONS,
			) ?? DEFAULT_GAME_CONFIG.questionCount,
		attemptsPerQuestion:
			parseNumberOption(
				searchParams.get('attempts'),
				ATTEMPTS_PER_QUESTION_OPTIONS,
			) ?? DEFAULT_GAME_CONFIG.attemptsPerQuestion,
		difficulty: isDifficulty(difficulty)
			? difficulty
			: DEFAULT_GAME_CONFIG.difficulty,
		scope: isScope(scope) ? scope : DEFAULT_GAME_CONFIG.scope,
	}
}
