import type {
	CountryId,
	GameContinent,
	GameDifficulty,
} from '@georally/game-domain'

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
