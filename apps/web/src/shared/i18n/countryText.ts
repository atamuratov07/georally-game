import type { CountryInfo } from '@georally/country-catalog'
import type { AppLanguage } from './locales'

export function getCountryName(
	info: CountryInfo,
	language: AppLanguage,
): string {
	return info.name[language]
}

export function getCountryCapital(
	info: CountryInfo,
	language: AppLanguage,
): string {
	return info.capital[language]
}

export function getCountryCurrency(
	info: CountryInfo,
	language: AppLanguage,
): string {
	const { name, symbol } = info.currency
	return `${name[language]} (${symbol[language]})`
}
