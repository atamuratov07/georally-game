import type { CountryId } from '../shared/types'

export type AnswerLanguage = 'en' | 'ru' | 'uz'
export type InputMethod = 'typing' | 'voice'

export interface AliasEntry {
	countryId: CountryId
	text: string
	voiceOnly: boolean
}

export type MatchResult =
	| {
			kind: 'match'
			countryId: CountryId
			via: 'exact' | 'fuzzy'
			heard: string
	  }
	| { kind: 'ambiguous'; countryIds: CountryId[]; heard: string }
	| { kind: 'none'; heard: string }

export interface AnswerMatcher {
	match(candidates: readonly string[], method: InputMethod): MatchResult
}
