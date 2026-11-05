import type {
	CountryId,
	CountryPool,
	CountryPoolEntry,
} from '@georally/game-domain'
import countryRegistryJson from '../generated/countries.json'
import type { CountryCatalogPayload, CountryRegistryPayload } from './types'

const countryRegistry = countryRegistryJson as CountryRegistryPayload

export function normalizeCountryId(
	value: string | number | null | undefined,
): CountryId | null {
	if (value === null || value === undefined) {
		return null
	}

	const parsed = Number.parseInt(String(value), 10)
	if (Number.isNaN(parsed)) {
		return null
	}

	return parsed.toString().padStart(3, '0')
}

export function buildCountryCatalog(
	payload: CountryRegistryPayload = countryRegistry,
): CountryCatalogPayload {
	const countriesById = new Map(
		payload.countries.map(country => [country.id, country]),
	)

	return {
		countriesById,
		countryIds: Array.from(countriesById.keys()),
	}
}

export function toSessionCountryPool(
	countryCatalog: CountryCatalogPayload,
): CountryPool {
	const countriesById: Record<CountryId, CountryPoolEntry> = {}

	for (const id of countryCatalog.countryIds) {
		const country = countryCatalog.countriesById.get(id)
		if (country) {
			countriesById[id] = {
				difficulty: country.difficulty,
				continent: country.continent,
			}
		}
	}

	return {
		countriesById,
	}
}

export const countryCatalog = buildCountryCatalog()

export const playableCountryPool = toSessionCountryPool(countryCatalog)
