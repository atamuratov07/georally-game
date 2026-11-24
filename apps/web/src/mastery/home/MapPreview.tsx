import { playableCountryPool } from '@georally/country-catalog'
import {
	skillLayer,
	summarizeLayer,
	type CardId,
	type MasteryView,
} from '@georally/mastery'
import { ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { outlinedText } from '@/shared/widgets/outlinedText'
import { MasteryMap } from '../map/MasteryMap'
import { masteryPaths } from '../paths'

const TITLE_TEXT = outlinedText(5, 4)
const NO_CARDS: readonly CardId[] = []

export function MapPreview({
	views,
}: {
	views: ReadonlyMap<CardId, MasteryView>
}) {
	const { t } = useTranslation()
	const { known, total } = useMemo(
		() =>
			summarizeLayer(skillLayer(views, 'locate'), playableCountryPool).all,
		[views],
	)

	return (
		<MasteryMap
			className='raised h-44 rounded-card border-2 border-line transition-transform duration-150 hover:-translate-y-1 active:translate-y-0.5 sm:h-52 [&_.maplibregl-ctrl-bottom-right]:top-0 [&_.maplibregl-ctrl-bottom-right]:bottom-auto'
			views={views}
			todayIds={NO_CARDS}
			overlay={
				<LocalizedLink
					to={masteryPaths.map}
					className='group absolute inset-0 z-1 flex flex-col items-start justify-end p-3 font-black text-white'
					style={TITLE_TEXT}
				>
					<span className='text-xl leading-tight'>
						{t('review.myMap')}
					</span>
					<span className='tabular-nums'>
						<span className='text-3xl'>{known}</span>
						<span className='text-lg'>/{total}</span>
					</span>
					<span
						aria-hidden='true'
						className='raised absolute right-2.5 bottom-2.5 grid size-9 place-items-center rounded-full border-2 border-line-strong bg-white text-ink transition-transform group-hover:translate-x-0.5 group-active:translate-y-0.5'
					>
						<ChevronRight className='size-5' strokeWidth={3} />
					</span>
				</LocalizedLink>
			}
		/>
	)
}
