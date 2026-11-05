import type { CountryId } from '../shared/types'
import { searchableKeys, type AliasTable } from './aliasTable'
import { distance } from './distance'
import type { InputMethod } from './types'

export type FuzzyOutcome =
	| { kind: 'match'; countryId: CountryId }
	| { kind: 'ambiguous'; countryIds: CountryId[] }

export function typoTolerance(key: string, method: InputMethod): number {
	let tolerance = 2
	if (key.length <= 4) {
		tolerance = 0
	} else if (key.length <= 8) {
		tolerance = 1
	}

	return method === 'voice' ? Math.max(0, tolerance - 1) : tolerance
}

export function findClosest(
	aliases: AliasTable,
	key: string,
	method: InputMethod,
): FuzzyOutcome | null {
	const tolerance = typoTolerance(key, method)
	if (tolerance === 0) {
		return null
	}

	let bestDistance = tolerance + 1
	let bestKeys = new Map<string, ReadonlySet<CountryId>>()

	for (const [aliasKey, countryIds] of searchableKeys(aliases, method)) {
		const steps = distance(key, aliasKey, Math.min(tolerance, bestDistance))
		if (steps < bestDistance) {
			bestDistance = steps
			bestKeys = new Map([[aliasKey, countryIds]])
		} else if (steps === bestDistance && steps <= tolerance) {
			bestKeys.set(aliasKey, countryIds)
		}
	}

	const countryIds = [
		...new Set([...bestKeys.values()].flatMap(ids => [...ids])),
	].sort()

	if (countryIds.length === 0) {
		return null
	}

	if (countryIds.length === 1) {
		return { kind: 'match', countryId: countryIds[0] }
	}

	return bestKeys.size === 1 ? { kind: 'ambiguous', countryIds } : null
}
