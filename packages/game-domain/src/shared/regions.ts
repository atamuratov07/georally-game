import { GAME_CONTINENTS, type GameContinent, type GameRegions } from './types'

/** Every region picked becomes `[]`: the same game as the whole world. */
export function normalizeRegions<TRegion extends string>(
	regions: readonly TRegion[],
	order: readonly TRegion[],
): TRegion[] {
	const picked = order.filter(region => regions.includes(region))
	return picked.length === order.length ? [] : picked
}

export function normalizeGameRegions(regions: GameRegions): GameContinent[] {
	return normalizeRegions(regions, GAME_CONTINENTS)
}

export function isWholeWorld(regions: readonly string[]): boolean {
	return regions.length === 0
}

export function regionsInclude(
	regions: GameRegions,
	continent: GameContinent,
): boolean {
	return regions.length === 0 || regions.includes(continent)
}

export function isGameRegions(value: unknown): value is GameRegions {
	return (
		Array.isArray(value) &&
		value.every(region =>
			GAME_CONTINENTS.includes(region as GameContinent),
		) &&
		normalizeGameRegions(value as GameContinent[]).join() === value.join()
	)
}
