import { playableCountryPool } from '@georally/country-catalog'
import type { GameScope } from '@georally/game-domain'
import { summarizeLayer } from '@georally/mastery'
import { ChevronLeft } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { getRegionLabel } from '@/shared/i18n'
import { Button } from '@/shared/ui'
import { outlinedText } from '@/shared/widgets/outlinedText'
import { masteryPaths } from '../paths'
import { ReviewUnavailable } from '../shared/ReviewUnavailable'
import { ContinentCounters } from './ContinentCounters'
import { ExploreMap } from './ExploreMap'
import { useMasteryLayer } from './useMasteryLayer'

const TITLE_TEXT = outlinedText(7, 5)

// An eased fade, so the edge where the shade ends can't be seen.
const SCRIM = {
	background: `linear-gradient(to top, ${[
		[0.85, 0],
		[0.63, 19],
		[0.46, 34],
		[0.32, 47],
		[0.24, 56.5],
		[0.16, 65],
		[0.11, 73],
		[0.06, 80.2],
		[0.035, 86.1],
		[0.018, 91],
		[0.007, 95.2],
		[0, 100],
	]
		.map(([alpha, at]) => `rgb(10 14 24 / ${alpha}) ${at}%`)
		.join(', ')})`,
}

export default function MasteryMapPage() {
	const { t } = useTranslation()
	const state = useMasteryLayer()
	const [focus, setFocus] = useState<GameScope>('all')
	const layer = state.status === 'ready' ? state.layer : null
	const summary = useMemo(
		() => (layer ? summarizeLayer(layer, playableCountryPool) : null),
		[layer],
	)

	if (state.status === 'failed') return <ReviewUnavailable />

	return (
		<div className='fixed inset-0 overflow-hidden bg-ocean-100'>
			{state.status === 'ready' ? (
				<ExploreMap
					layer={state.layer}
					plan={state.plan}
					now={state.now}
					focus={focus}
				/>
			) : null}

			<Button
				asChild
				variant='neutral'
				size='icon'
				className='absolute top-3 left-3 z-10'
				aria-label={t('review.title')}
				title={t('review.title')}
			>
				<LocalizedLink to={masteryPaths.home}>
					<ChevronLeft aria-hidden='true' strokeWidth={3} />
				</LocalizedLink>
			</Button>

			{summary ? (
				<motion.h1
					key={focus}
					initial={{ scale: 0.85 }}
					animate={{ scale: 1 }}
					transition={{ type: 'spring', stiffness: 420, damping: 16 }}
					className='pointer-events-none absolute inset-x-16 top-3 z-10 flex flex-col items-center text-center text-white'
					style={TITLE_TEXT}
				>
					<span className='text-3xl leading-tight font-black text-balance sm:text-4xl'>
						{getRegionLabel(t, focus)}
					</span>
					<span className='font-black tabular-nums'>
						<span className='text-4xl'>{summary[focus].known}</span>
						<span className='text-xl'>/{summary[focus].total}</span>
					</span>
				</motion.h1>
			) : null}

			{summary ? (
				<div
					className='absolute inset-x-0 bottom-0 z-10 pt-24'
					style={SCRIM}
				>
					<ContinentCounters
						summary={summary}
						focus={focus}
						onFocus={setFocus}
					/>
				</div>
			) : null}
		</div>
	)
}
