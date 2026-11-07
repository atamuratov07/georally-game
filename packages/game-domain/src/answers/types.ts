import type { CountryId } from '../shared/types'

export type AnswerLanguage = 'en' | 'ru' | 'uz'
export type InputMethod = 'typing' | 'voice'

export interface AliasEntry {
	countryId: CountryId
	text: string
	only?: InputMethod
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

export interface TypedMatch {
	countryId: CountryId
	isPrefix: boolean
}

export interface AnswerMatcher {
	match(inputs: readonly string[], method: InputMethod): MatchResult
	matchAsTyped(text: string): TypedMatch | null
}
