import type { CountryId } from '../shared/types'
import { normalize } from './normalize'
import type { AliasEntry, InputMethod } from './types'

type KeyTable = ReadonlyMap<string, ReadonlySet<CountryId>>

export interface AliasTable {
	typed: KeyTable
	voiceOnly: KeyTable
	maxTokens: number
}

export function buildAliases(entries: readonly AliasEntry[]): AliasTable {
	const typed = new Map<string, Set<CountryId>>()
	const voiceOnly = new Map<string, Set<CountryId>>()
	let maxTokens = 0

	for (const entry of entries) {
		const key = normalize(entry.text)
		if (!key) {
			continue
		}

		const table = entry.voiceOnly ? voiceOnly : typed
		const countryIds = table.get(key) ?? new Set<CountryId>()
		countryIds.add(entry.countryId)
		table.set(key, countryIds)
		maxTokens = Math.max(maxTokens, key.split(' ').length)
	}

	return { typed, voiceOnly: voiceOnly, maxTokens }
}

function tablesFor(aliases: AliasTable, method: InputMethod): KeyTable[] {
	return method === 'voice'
		? [aliases.typed, aliases.voiceOnly]
		: [aliases.typed]
}

export function lookupKey(
	aliases: AliasTable,
	key: string,
	method: InputMethod,
): CountryId[] {
	const countryIds = new Set<CountryId>()

	for (const table of tablesFor(aliases, method)) {
		for (const countryId of table.get(key) ?? []) {
			countryIds.add(countryId)
		}
	}

	return [...countryIds]
}

export function* searchableKeys(
	aliases: AliasTable,
	method: InputMethod,
): Generator<[string, ReadonlySet<CountryId>]> {
	for (const table of tablesFor(aliases, method)) {
		yield* table
	}
}
