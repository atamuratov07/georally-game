import type {
	CountryId,
	GameContinent,
	GameDifficulty,
} from '@georally/game-domain'
import type { AnswerLanguage } from '@georally/game-domain/answers'

export type CatalogLanguage = 'en' | 'ru' | 'uz-Latn'

export type LocalizedText = Readonly<Record<CatalogLanguage, string>>

export interface CountryCurrency {
	code: string
	name: LocalizedText
	symbol: LocalizedText
}

export interface CountryInfo {
	id: CountryId
	name: LocalizedText
	capital: LocalizedText
	currency: CountryCurrency
	continent: GameContinent
	difficulty: GameDifficulty
	population: number
	centroidLng: number
	centroidLat: number
	flagUrl: string
	independent: boolean
	unMember: boolean
}

export interface CountryRegistryPayload {
	version: number
	generated_at: string
	country_count: number
	countries: CountryInfo[]
}

export interface CountryCatalogPayload {
	countriesById: Map<CountryId, CountryInfo>
	countryIds: CountryId[]
}

export type AliasNames = Partial<Record<AnswerLanguage, string[]>>

export type AliasesPayload = Record<
	CountryId,
	AliasNames & { voice?: AliasNames }
>
