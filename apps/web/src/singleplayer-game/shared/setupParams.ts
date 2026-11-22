import {
	GAME_CONTINENTS,
	GAME_DIFFICULTIES,
	normalizeGameRegions,
	type GameContinent,
	type GameDifficulty,
} from '@georally/game-domain'

export const DIFFICULTY_OPTIONS: Array<{ value: GameDifficulty }> = [
	{ value: 'easy' },
	{ value: 'medium' },
	{ value: 'hard' },
]

export function isDifficulty(value: unknown): value is GameDifficulty {
	return GAME_DIFFICULTIES.includes(value as GameDifficulty)
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

/** `scope=` is from links made before several regions could be picked. */
export function readRegionNames(searchParams: URLSearchParams): string[] {
	const list = searchParams.get('regions')
	if (list !== null) return list.split(',')
	const scope = searchParams.get('scope')
	return scope === null || scope === 'all' ? [] : [scope]
}

const CONTINENTS_OF_NAME: Readonly<Record<string, readonly GameContinent[]>> = {
	...Object.fromEntries(
		GAME_CONTINENTS.map(continent => [continent, [continent]]),
	),
	americas: ['north-america', 'south-america'],
}

export function readGameRegions(
	searchParams: URLSearchParams,
): GameContinent[] {
	return normalizeGameRegions(
		readRegionNames(searchParams).flatMap(
			name => CONTINENTS_OF_NAME[name] ?? [],
		),
	)
}

export function setRegions(
	searchParams: URLSearchParams,
	regions: readonly string[],
): URLSearchParams {
	if (regions.length > 0) searchParams.set('regions', regions.join(','))
	return searchParams
}
