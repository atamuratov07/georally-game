import {
	GAME_DIFFICULTIES,
	GAME_SCOPES,
	type GameDifficulty,
	type GameScope,
} from '@georally/game-domain'
import { type GameConfig } from '@georally/game-domain/singleplayer/locate'

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

function isDifficulty(value: string | null): value is GameDifficulty {
	return value !== null && GAME_DIFFICULTIES.includes(value as GameDifficulty)
}

function isScope(value: string | null): value is GameScope {
	return value !== null && GAME_SCOPES.includes(value as GameScope)
}

function parseNumberOption(
	value: string | null,
	options: readonly number[],
): number | null {
	if (value === null) {
		return null
	}

	const parsed = Number.parseInt(value, 10)
	return options.includes(parsed) ? parsed : null
}

export type GameConfigParseResult =
	{ ok: true; value: GameConfig } | { ok: false; error: 'invalid_config' }

export function parseGameConfig(
	searchParams: URLSearchParams,
): GameConfigParseResult {
	const questionCount = parseNumberOption(
		searchParams.get('questionCount'),
		QUESTION_COUNT_OPTIONS,
	)
	const attemptsPerQuestion = parseNumberOption(
		searchParams.get('attempts'),
		ATTEMPTS_PER_QUESTION_OPTIONS,
	)
	const difficulty = searchParams.get('difficulty')
	const scope = searchParams.get('scope')

	if (
		questionCount === null ||
		attemptsPerQuestion === null ||
		!isDifficulty(difficulty) ||
		!isScope(scope)
	) {
		return { ok: false, error: 'invalid_config' }
	}

	return {
		ok: true,
		value: {
			questionCount,
			attemptsPerQuestion,
			difficulty,
			scope,
		},
	}
}
