import { countryCatalog } from '@georally/country-catalog'
import type { Attempt } from '@georally/game-domain/singleplayer/recall-sprint'
import type { GameRegions } from '@georally/game-domain'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from '@/app/LocaleContext'
import { getCountryName, getRegionsLabel } from '@/shared/i18n'

const OFFSET_Y = 14
const SHOWN = { opacity: 1, y: 0, scale: 1 }

interface SprintNoteProps {
	attempt: Attempt | null
	regions: GameRegions
	enterFrom: 'above' | 'below'
}

export function SprintNote({ attempt, regions, enterFrom }: SprintNoteProps) {
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
					<NoteMessage attempt={attempt} regions={regions} />
				</motion.div>
			) : null}
		</AnimatePresence>
	)
}

function NoteMessage({
	attempt,
	regions,
}: {
	attempt: Attempt
	regions: GameRegions
}) {
	const { t } = useTranslation()
	const language = useCurrentLocale()

	const countryName = (countryId: string) => {
		const info = countryCatalog.countriesById.get(countryId)
		return info ? getCountryName(info, language) : countryId
	}

	const [unresolved] = attempt.unresolved
	const message =
		attempt.repeatedIds.length > 0
			? t('recallSprint.note.repeated', {
					name: countryName(attempt.repeatedIds[0]),
				})
			: attempt.outsideIds.length > 0
				? t('recallSprint.note.outside', {
						name: countryName(attempt.outsideIds[0]),
						region: getRegionsLabel(t, regions),
					})
				: unresolved?.kind === 'ambiguous'
					? t('recallSprint.note.ambiguous', { text: unresolved.heard })
					: t('recallSprint.note.unknown', { text: attempt.heard })

	return (
		<p
			role='status'
			className='truncate rounded-full bg-coral-500 px-4 py-1.5 text-sm font-extrabold text-white'
		>
			{message}
		</p>
	)
}
