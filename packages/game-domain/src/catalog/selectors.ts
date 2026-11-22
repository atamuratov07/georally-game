import { regionsInclude } from '../shared/regions'
import type { CountryId, GameQuestionSetConfig } from '../shared/types'
import type { CountryPool, CountryPoolEntry } from './types'

export const DIFFICULTY_RANK: Record<
	GameQuestionSetConfig['difficulty'],
	number
> = {
	easy: 0,
	medium: 1,
	hard: 2,
}

function includesDifficulty(
	countryDifficulty: GameQuestionSetConfig['difficulty'],
	selectedDifficulty: GameQuestionSetConfig['difficulty'],
): boolean {
	return (
		DIFFICULTY_RANK[countryDifficulty] <= DIFFICULTY_RANK[selectedDifficulty]
	)
}

export function getCountryIds(pool: CountryPool): string[] {
	return Object.keys(pool.countriesById)
}

export function getCountryInfo(
	pool: CountryPool,
	countryId: string,
): CountryPoolEntry | undefined {
	return pool.countriesById[countryId]
}

export function hasCountry(pool: CountryPool, countryId: string): boolean {
	return getCountryInfo(pool, countryId) !== undefined
}

export function selectEligibleCountryIds(
	pool: CountryPool,
	config: Pick<GameQuestionSetConfig, 'difficulty' | 'regions'>,
): CountryId[] {
	return Object.entries(pool.countriesById)
		.filter(([_, country]) => {
			return (
				regionsInclude(config.regions, country.continent) &&
				includesDifficulty(country.difficulty, config.difficulty)
			)
		})
		.map(([countryId]) => countryId)
}
