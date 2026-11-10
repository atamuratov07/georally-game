import type { CountryId } from '../shared/types'
import {
	buildAliasTable,
	lookupCountries,
	searchableKeys,
	type AliasTable,
} from './aliasTable'
import { prepareCandidate, wordRuns, type Candidate } from './candidates'
import { findClosest } from './fuzzy'
import { keyOf } from './normalize'
import type {
	AliasEntry,
	AnswerMatcher,
	InputMethod,
	MatchResult,
} from './types'

interface Segment {
	start: number
	end: number
	countryIds: CountryId[]
}

interface WordScan {
	segments: Segment[]
	coveredWords: number
}

interface PhraseScan extends WordScan {
	words: string[]
}

const NO_PHRASE: PhraseScan = { words: [], segments: [], coveredWords: 0 }

function scanWordRuns(
	table: AliasTable,
	words: readonly string[],
	method: InputMethod,
): WordScan {
	const covered = new Array<boolean>(words.length).fill(false)
	const segments: Segment[] = []

	for (const run of wordRuns(words, table.maxWords)) {
		if (covered.slice(run.start, run.end).some(Boolean)) {
			continue
		}

		const runCountryIds = lookupCountries(table, run.key, method)
		if (runCountryIds.length > 0) {
			segments.push({
				start: run.start,
				end: run.end,
				countryIds: runCountryIds.sort(),
			})
			covered.fill(true, run.start, run.end)
		}
	}

	return { segments, coveredWords: covered.filter(Boolean).length }
}

function scanPhrase(
	candidate: Candidate,
	table: AliasTable,
	method: InputMethod,
): PhraseScan {
	let best = NO_PHRASE
	for (const words of candidate.wordsBySpelling) {
		const scan = scanWordRuns(table, words, method)
		if (scan.coveredWords > best.coveredWords) {
			best = { words, ...scan }
		}
	}
	return best
}

function countryIdsOf(scan: WordScan): CountryId[] {
	return scan.segments.flatMap(segment => segment.countryIds)
}

function findExact(
	table: AliasTable,
	wordsBySpelling: string[][],
	method: InputMethod,
): CountryId[] {
	let mostCovered = 0
	let countryIds: CountryId[] = []
	for (const words of wordsBySpelling) {
		let scan = scanWordRuns(table, words, method)
		if (method === 'typing' && scan.coveredWords < words.length) {
			scan = { segments: [], coveredWords: 0 }
		}

		if (scan.coveredWords === mostCovered) {
			countryIds.push(...countryIdsOf(scan))
		} else if (scan.coveredWords > mostCovered) {
			mostCovered = scan.coveredWords
			countryIds = countryIdsOf(scan)
		}
	}

	return [...new Set(countryIds)].sort()
}

function findFuzzy(
	table: AliasTable,
	wordsBySpelling: string[][],
	method: InputMethod,
): CountryId[] {
	const keys = wordsBySpelling.flatMap(words =>
		method === 'voice'
			? wordRuns(words, table.maxWords).map(run => run.key)
			: [keyOf(words)],
	)

	const countryIds = keys.flatMap(key => {
		const outcome = findClosest(table, key, method)
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

function isPrefixOfOtherName(
	table: AliasTable,
	key: string,
	countryId: CountryId,
): boolean {
	for (const [other, countryIds] of searchableKeys(table, 'typing')) {
		if (
			other !== key &&
			other.startsWith(key) &&
			[...countryIds].some(id => id !== countryId)
		) {
			return true
		}
	}
	return false
}

export function createAnswerMatcher(
	entries: readonly AliasEntry[],
): AnswerMatcher {
	const table = buildAliasTable(entries)

	return {
		match(inputs, method) {
			const candidates = inputs
				.map(input => prepareCandidate(input))
				.filter(candidate => candidate.heard !== '')

			for (const { heard, wordsBySpelling } of candidates) {
				const countryIds = findExact(table, wordsBySpelling, method)
				if (countryIds.length > 0) {
					return toResult(countryIds, 'exact', heard)
				}
			}

			for (const { heard, wordsBySpelling } of candidates) {
				const countryIds = findFuzzy(table, wordsBySpelling, method)
				if (countryIds.length > 0) {
					return toResult(countryIds, 'fuzzy', heard)
				}
			}

			return { kind: 'none', heard: candidates[0]?.heard ?? '' }
		},

		matchAsTyped(text) {
			const { wordsBySpelling } = prepareCandidate(text)
			const countryIds = findExact(table, wordsBySpelling, 'typing')
			if (countryIds.length !== 1) return null

			const [countryId] = countryIds
			const isPrefix = wordsBySpelling.some(words =>
				isPrefixOfOtherName(table, keyOf(words), countryId),
			)
			return { countryId, isPrefix }
		},

		matchAll(inputs, method) {
			let best = NO_PHRASE
			for (const input of inputs) {
				const candidate = prepareCandidate(input)
				if (candidate.heard === '') {
					continue
				}
				const scan = scanPhrase(candidate, table, method)
				if (scan.coveredWords > best.coveredWords) {
					best = scan
				}
			}
			if (best.coveredWords === 0) {
				return []
			}

			return [...best.segments]
				.sort((a, b) => a.start - b.start)
				.map(({ start, end, countryIds }) =>
					toResult(
						countryIds,
						'exact',
						best.words.slice(start, end).join(' '),
					),
				)
		},
	}
}
