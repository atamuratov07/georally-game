import { useTranslation } from 'react-i18next'
import { useMatch } from 'react-router-dom'
import { masteryPaths } from '@/mastery/paths'
import { CountryCardsIcon } from '@/shared/widgets/CountryCardsIcon'
import { outlinedText } from '@/shared/widgets/outlinedText'
import { LocalizedLink } from './LocalizedLink'

const LABEL_TEXT = outlinedText(0.1, 0.09, 'em')

export function ReviewLink() {
	const { t } = useTranslation()
	const onReview = useMatch(`${masteryPaths.home}/*`)

	if (onReview) return null

	return (
		<LocalizedLink
			to={masteryPaths.home}
			className='group inline-flex h-10 items-center gap-1.5 rounded-full transition-transform active:translate-y-0.5 max-lg:size-10 max-lg:justify-center lg:mr-2 lg:pr-3 lg:pl-2'
		>
			<CountryCardsIcon className='size-10 drop-shadow-[0_1.5px_0_var(--color-ink)] lg:size-9' />
			<span
				className='text-[17px] font-black text-white max-lg:sr-only'
				style={LABEL_TEXT}
			>
				{t('review.title')}
			</span>
		</LocalizedLink>
	)
}
