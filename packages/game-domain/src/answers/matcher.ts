import type { CountryId } from '../shared/types'
import { buildAliases, lookupKey, type AliasTable } from './aliasTable'
import { keyOf, prepare, tokenRuns } from './candidates'
import { findClosest } from './fuzzy'
import type {
	AliasEntry,
	AnswerMatcher,
	InputMethod,
	MatchResult,
} from './types'

interface ExactFind {
	countryIds: CountryId[]
	coveredTokens: number
}

function scanTokenRuns(
	aliases: AliasTable,
	tokens: readonly string[],
	method: InputMethod,
): ExactFind {
	const covered = new Array<boolean>(tokens.length).fill(false)
	const countryIds: CountryId[] = []

	for (const run of tokenRuns(tokens, aliases.maxTokens)) {
		if (covered.slice(run.start, run.end).some(Boolean)) {
			continue
		}

		const runCountryIds = lookupKey(aliases, run.key, method)
		if (runCountryIds.length > 0) {
			countryIds.push(...runCountryIds)
			covered.fill(true, run.start, run.end)
		}
	}

	return { countryIds, coveredTokens: covered.filter(Boolean).length }
}

function findExact(
	aliases: AliasTable,
	tokensBySpelling: string[][],
	method: InputMethod,
): CountryId[] {
	let mostCovered = 0
	let countryIds: CountryId[] = []
	for (const tokens of tokensBySpelling) {
		let find = scanTokenRuns(aliases, tokens, method)
		if (method === 'typing' && find.coveredTokens < tokens.length) {
			find = { countryIds: [], coveredTokens: 0 }
		}

		if (find.coveredTokens === mostCovered) {
			countryIds.push(...find.countryIds)
		} else if (find.coveredTokens > mostCovered) {
			mostCovered = find.coveredTokens
			countryIds = [...find.countryIds]
		}
	}

	return [...new Set(countryIds)].sort()
}

function findFuzzy(
	aliases: AliasTable,
	tokensBySpelling: string[][],
	method: InputMethod,
): CountryId[] {
	const countryIds = tokensBySpelling.flatMap(tokens => {
		const key = keyOf(tokens)
		const outcome = findClosest(aliases, key, method)
		if (!outcome) {
			return []
		}

		return outcome.kind === 'match' ? [outcome.countryId] : outcome.countryIds
	})

	return [...new Set(countryIds)].sort()
}

function toResult(
	countryIds: CountryId[],
	via: 'exact' | 'fuzzy',
	heard: string,
): MatchResult {
	return countryIds.length === 1
		? { kind: 'match', countryId: countryIds[0], via, heard }
		: { kind: 'ambiguous', countryIds, heard }
}

export function createAnswerMatcher(
	entries: readonly AliasEntry[],
): AnswerMatcher {
	const aliases = buildAliases(entries)

	return {
		match(candidates, method) {
			const inputs = candidates
				.map(candidate => prepare(candidate, method))
				.filter(input => input.heard !== '')

			for (const { heard, spellings } of inputs) {
				const countryIds = findExact(aliases, spellings, method)
				if (countryIds.length > 0) {
					return toResult(countryIds, 'exact', heard)
				}
			}

			for (const { heard, spellings } of inputs) {
				const countryIds = findFuzzy(aliases, spellings, method)
				if (countryIds.length > 0) {
					return toResult(countryIds, 'fuzzy', heard)
				}
			}

			return { kind: 'none', heard: inputs[0]?.heard ?? '' }
		},
	}
}
