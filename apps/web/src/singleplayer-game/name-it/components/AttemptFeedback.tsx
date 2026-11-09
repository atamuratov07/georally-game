import { countryCatalog } from '@georally/country-catalog'
import type { Attempt } from '@georally/game-domain/singleplayer/name-it'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from '@/app/LocaleContext'
import { getCountryName } from '@/shared/i18n'

const OFFSET_Y = 14
const SHOWN = { opacity: 1, y: 0, scale: 1 }

interface AttemptFeedbackProps {
	attempt: Attempt | null
	enterFrom: 'above' | 'below'
}

export function AttemptFeedback({ attempt, enterFrom }: AttemptFeedbackProps) {
	const reduceMotion = useReducedMotion()
	const hidden = reduceMotion
		? { opacity: 0 }
		: {
				opacity: 0,
				y: enterFrom === 'below' ? OFFSET_Y : -OFFSET_Y,
				scale: 0.96,
			}

	return (
		<AnimatePresence mode='wait' initial={false}>
			{attempt ? (
				<motion.div
					key={attempt.at}
					className='mx-auto w-fit max-w-full'
					initial={hidden}
					animate={SHOWN}
					exit={hidden}
					transition={{ duration: 0.22, ease: [0.2, 0.9, 0.3, 1.3] }}
				>
					<FeedbackMessage attempt={attempt} />
				</motion.div>
			) : null}
		</AnimatePresence>
	)
}

function FeedbackMessage({ attempt }: { attempt: Attempt }) {
	const { t } = useTranslation()
	const language = useCurrentLocale()

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
			role='status'
			className='truncate rounded-full border-2 border-coral-600 bg-coral-500 px-4 py-1.5 text-sm font-extrabold text-white shadow-[0_3px_0_0_var(--color-coral-700)]'
		>
			{message}
		</p>
	)
}
