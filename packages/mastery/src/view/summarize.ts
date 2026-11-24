import type { CountryPool, GameScope } from '@georally/game-domain'
import type { MasteryLayer } from './layers'

export interface MasteryCount {
	known: number
	total: number
}

export type MasterySummary = Readonly<Record<GameScope, MasteryCount>>

export function summarizeLayer(
	layer: MasteryLayer,
	pool: CountryPool,
): MasterySummary {
	const count = (): MasteryCount => ({ known: 0, total: 0 })
	const summary: Record<GameScope, MasteryCount> = {
		all: count(),
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
		const level = layer.get(countryId)?.level
		const known = level === 'familiar' || level === 'mastered' ? 1 : 0
		for (const counted of [summary.all, summary[continent]]) {
			counted.total += 1
			counted.known += known
		}
	}
	return summary
}
