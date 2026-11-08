import { countryCatalog } from '@georally/country-catalog'
import type { Attempt } from '@georally/game-domain/singleplayer/name-it'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from '@/app/LocaleContext'
import { getCountryName } from '@/shared/i18n'

export function AttemptFeedback({ attempt }: { attempt: Attempt | null }) {
	const { t } = useTranslation()
	const language = useCurrentLocale()
	if (!attempt) {
		return null
	}

	const countryName = (countryId: string) => {
		const info = countryCatalog.countriesById.get(countryId)
		return info ? getCountryName(info, language) : countryId
	}

	const { result, method } = attempt
	const message =
		method === 'voice'
			? t('nameIt.feedback.heard', { text: result.heard })
			: result.kind === 'match'
				? result.via === 'fuzzy'
					? t('nameIt.feedback.typo', {
							text: result.heard,
							name: countryName(result.countryId),
						})
					: t('nameIt.feedback.wrong', {
							name: countryName(result.countryId),
						})
				: result.kind === 'ambiguous'
					? t('nameIt.feedback.ambiguous', { text: result.heard })
					: t('nameIt.feedback.unknown', { text: result.heard })

	return (
		<p
			key={attempt.at}
			role='status'
			className='mx-auto w-fit max-w-full animate-pop-in truncate rounded-full border-2 border-coral-600 bg-coral-500 px-4 py-1.5 text-sm font-extrabold text-white shadow-[0_3px_0_0_var(--color-coral-700)]'
		>
			{message}
		</p>
	)
}
