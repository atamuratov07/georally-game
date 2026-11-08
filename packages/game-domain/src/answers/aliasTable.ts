import type { CountryId } from '../shared/types'
import { keyOf, toWords } from './normalize'
import type { AliasEntry, InputMethod } from './types'

type KeyTable = ReadonlyMap<string, ReadonlySet<CountryId>>

export interface AliasTable {
	common: KeyTable
	only: Record<InputMethod, KeyTable>
	maxWords: number
}

export function buildAliasTable(entries: readonly AliasEntry[]): AliasTable {
	const common = new Map<string, Set<CountryId>>()
	const only: Record<InputMethod, Map<string, Set<CountryId>>> = {
		voice: new Map(),
		typing: new Map(),
	}
	let maxWords = 0

	for (const entry of entries) {
		const words = toWords(entry.text)
		const key = keyOf(words)
		if (!key) {
			continue
		}

		const keys = entry.only ? only[entry.only] : common
		const countryIds = keys.get(key) ?? new Set<CountryId>()
		countryIds.add(entry.countryId)
		keys.set(key, countryIds)
		maxWords = Math.max(maxWords, key.split(' ').length)
	}

	return { common, only, maxWords }
}

function keyTablesFor(table: AliasTable, method: InputMethod): KeyTable[] {
	return [table.common, table.only[method]]
}

export function lookupCountries(
	table: AliasTable,
	key: string,
	method: InputMethod,
): CountryId[] {
	const countryIds = new Set<CountryId>()

	for (const keys of keyTablesFor(table, method)) {
		for (const countryId of keys.get(key) ?? []) {
			countryIds.add(countryId)
		}
	}

	return [...countryIds]
}

export function* searchableKeys(
	table: AliasTable,
	method: InputMethod,
): Generator<[string, ReadonlySet<CountryId>]> {
	for (const keys of keyTablesFor(table, method)) {
		yield* keys
	}
}
