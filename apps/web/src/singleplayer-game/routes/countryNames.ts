import { countryCatalog } from '@georally/country-catalog'
import { useCallback } from 'react'
import { useCurrentLocale } from '@/app/LocaleContext'
import { getCountryName } from '@/shared/i18n'

export function useCountryName(): (countryId: string) => string {
	const language = useCurrentLocale()
	return useCallback(
		(countryId: string) => {
			const info = countryCatalog.countriesById.get(countryId)
			return info ? getCountryName(info, language) : countryId
		},
		[language],
	)
}

export function flagUrlOf(countryId: string): string | undefined {
	return countryCatalog.countriesById.get(countryId)?.flagUrl
}
