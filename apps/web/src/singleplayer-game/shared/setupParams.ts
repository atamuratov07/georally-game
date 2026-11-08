import {
	GAME_DIFFICULTIES,
	GAME_SCOPES,
	type GameDifficulty,
	type GameScope,
} from '@georally/game-domain'

export const DIFFICULTY_OPTIONS: Array<{ value: GameDifficulty }> = [
	{ value: 'easy' },
	{ value: 'medium' },
	{ value: 'hard' },
]

export function isDifficulty(value: unknown): value is GameDifficulty {
	return GAME_DIFFICULTIES.includes(value as GameDifficulty)
}

export function isScope(value: unknown): value is GameScope {
	return GAME_SCOPES.includes(value as GameScope)
}

export function isOption(value: unknown, options: readonly number[]): boolean {
	return options.includes(value as number)
}

export function readNumberOption(
	searchParams: URLSearchParams,
	key: string,
	options: readonly number[],
	fallback: number,
): number {
	const value = searchParams.get(key)
	const parsed = value === null ? Number.NaN : Number.parseInt(value, 10)
	return isOption(parsed, options) ? parsed : fallback
}

export function readDifficulty(
	searchParams: URLSearchParams,
	fallback: GameDifficulty,
): GameDifficulty {
	const value = searchParams.get('difficulty')
	return isDifficulty(value) ? value : fallback
}

export function readScope(
	searchParams: URLSearchParams,
	fallback: GameScope,
): GameScope {
	const value = searchParams.get('scope')
	return isScope(value) ? value : fallback
}
