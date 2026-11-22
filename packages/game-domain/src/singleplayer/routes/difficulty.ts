import { DIFFICULTY_RANK } from '../../catalog/selectors'
import type { CountryPool } from '../../catalog/types'
import type {
	CountryId,
	GameContinent,
	GameDifficulty,
} from '../../shared/types'
import { ROUTE_REGIONS, type RouteRegion } from './types'

export const ROUTE_REGION_CONTINENTS: Readonly<
	Record<RouteRegion, readonly GameContinent[]>
> = {
	europe: ['europe'],
	asia: ['asia'],
	africa: ['africa'],
	americas: ['north-america', 'south-america'],
}

export function routeRegionOf(continent: GameContinent): RouteRegion | null {
	return (
		ROUTE_REGIONS.find(region =>
			ROUTE_REGION_CONTINENTS[region].includes(continent),
		) ?? null
	)
}

export function ratingRank(pool: CountryPool): (id: CountryId) => number {
	return id => DIFFICULTY_RANK[pool.countriesById[id]?.difficulty ?? 'hard']
}

export function routeLevels(
	par: number,
	bestPathRank: number,
): GameDifficulty[] {
	const familiar = bestPathRank <= DIFFICULTY_RANK.medium
	const levels: GameDifficulty[] = []
	if (par >= 1 && par <= 3 && familiar) levels.push('easy')
	if ((par >= 3 && par <= 5 && familiar) || (par >= 2 && par <= 3)) {
		levels.push('medium')
	}
	if (par >= 6 || (par >= 4 && !familiar)) levels.push('hard')
	return levels
}

export function parFits(level: GameDifficulty, par: number): boolean {
	switch (level) {
		case 'easy':
			return par >= 1 && par <= 3
		case 'medium':
			return par >= 2 && par <= 5
		case 'hard':
			return par >= 4
	}
}
