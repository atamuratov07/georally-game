import type { CountryPool, GameContinent } from '@georally/game-domain'
import type { MasteryLayer } from './layers'

export interface MasteryCount {
	mastered: number
	total: number
}

export interface MasterySummary {
	world: MasteryCount
	continents: Readonly<Record<GameContinent, MasteryCount>>
}

export function summarizeLayer(
	layer: MasteryLayer,
	pool: CountryPool,
): MasterySummary {
	const count = (): MasteryCount => ({ mastered: 0, total: 0 })
	const world = count()
	const continents: Record<GameContinent, MasteryCount> = {
		africa: count(),
		asia: count(),
		europe: count(),
		'north-america': count(),
		'south-america': count(),
		oceania: count(),
	}
	for (const [countryId, { continent }] of Object.entries(
		pool.countriesById,
	)) {
		const mastered = layer.get(countryId)?.level === 'mastered' ? 1 : 0
		for (const counted of [world, continents[continent]]) {
			counted.total += 1
			counted.mastered += mastered
		}
	}
	return { world, continents }
}
