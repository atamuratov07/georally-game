import type { CountryId } from '@georally/game-domain'
import type {
	AliasEntry,
	AnswerLanguage,
	InputMethod,
} from '@georally/game-domain/answers'
import aliasesJson from '../data/aliases.json'
import { countryCatalog } from './catalog'
import type {
	AliasesPayload,
	CatalogLanguage,
	CountryCatalogPayload,
} from './types'

export const countryAliases = aliasesJson as AliasesPayload

const CATALOG_LANGUAGE = {
	en: 'en',
	ru: 'ru',
	uz: 'uz-Latn',
} as const satisfies Record<AnswerLanguage, CatalogLanguage>

const LANGUAGES = Object.keys(CATALOG_LANGUAGE) as AnswerLanguage[]

function pushEntries(
	entries: AliasEntry[],
	countryId: CountryId,
	only: InputMethod | undefined,
	texts: readonly string[] | undefined,
): void {
	for (const raw of texts ?? []) {
		const text = raw.trim()
		if (text) {
			entries.push(only ? { countryId, text, only } : { countryId, text })
		}
	}
}

export function buildAliasEntries(
	catalog: CountryCatalogPayload = countryCatalog,
	aliases: AliasesPayload = countryAliases,
): readonly AliasEntry[] {
	const entries: AliasEntry[] = []

	for (const country of catalog.countriesById.values()) {
		for (const language of LANGUAGES) {
			pushEntries(entries, country.id, undefined, [
				country.name[CATALOG_LANGUAGE[language]],
			])
		}
	}

	for (const [countryId, names] of Object.entries(aliases)) {
		if (!catalog.countriesById.has(countryId)) {
			throw new Error(`Aliases list unknown country id "${countryId}".`)
		}

		for (const language of LANGUAGES) {
			pushEntries(entries, countryId, undefined, names[language])
			pushEntries(entries, countryId, 'typing', names.typing?.[language])
			pushEntries(entries, countryId, 'voice', names.voice?.[language])
		}
	}

	return entries
}

export const aliasEntries = buildAliasEntries()

export type { AliasesPayload } from './types'
