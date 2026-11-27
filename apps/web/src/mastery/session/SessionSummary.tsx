import { playableCountryPool } from '@georally/country-catalog'
import {
	learnMore,
	LEARN_MORE_COUNT,
	loadDayResult,
	type DayResult,
} from '@georally/mastery'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { trackReviewSessionEnd } from '@/shared/analytics/track'
import { PageShell } from '@/shared/layout'
import { celebrate } from '@/shared/lib/confetti'
import { localDay } from '@/shared/time/localDay'
import { Button, CountUp } from '@/shared/ui'
import { outlinedText } from '@/shared/widgets/outlinedText'
import { mastery } from '../container'
import { MasteryMap } from '../map/MasteryMap'
import { ReviewEmblem } from '../shared/ReviewEmblem'
import { ReviewUnavailable } from '../shared/ReviewUnavailable'
import { Stat } from '../shared/Stat'
import type { SessionStats } from './sessionReducer'

const HEADLINE = outlinedText(9, 7)

type ResultState =
	| { status: 'loading' }
	| { status: 'failed' }
	| { status: 'ready'; result: DayResult }

function useDayResult(startedAt: number): ResultState {
	const [state, setState] = useState<ResultState>({ status: 'loading' })

	useEffect(() => {
		let ignore = false
		const day = localDay(startedAt)
		loadDayResult(mastery, {
			pool: playableCountryPool,
			day,
			tomorrow: localDay(day.end),
			now: Date.now(),
		}).then(
			result => {
				if (!ignore) setState({ status: 'ready', result })
			},
			(error: unknown) => {
				console.error(error)
				if (!ignore) setState({ status: 'failed' })
			},
		)
		return () => {
			ignore = true
		}
	}, [startedAt])

	return state
}

export function SessionSummary({
	stats,
	onLearnMore,
}: {
	stats: SessionStats
	onLearnMore: () => void
}) {
	const { t } = useTranslation()
	const [adding, setAdding] = useState(false)
	const state = useDayResult(stats.startedAt)
	const ended = useRef(false)
	const ready = state.status === 'ready'

	useEffect(() => {
		if (ended.current) return
		ended.current = true
		trackReviewSessionEnd({
			reviewedCount: stats.cards.size,
			newCount: stats.newCount,
			durationMs: Date.now() - stats.startedAt,
		})
		void navigator.storage?.persist?.()
	}, [stats])

	useEffect(() => {
		if (ready) celebrate()
	}, [ready])

	if (state.status === 'failed') {
		return <ReviewUnavailable />
	}
	if (state.status === 'loading') return null

	const { newIds, reviewedIds, flawless, dueTomorrow, unseenCount, layer } =
		state.result

	async function addMore() {
		setAdding(true)
		try {
			await learnMore(mastery, localDay(Date.now()))
			onLearnMore()
		} catch (error) {
			console.error(error)
			toast.error(t('review.learnMoreFailed'))
			setAdding(false)
		}
	}

	return (
		<PageShell
			headerTitle={t('review.title')}
			headerEmblem={<ReviewEmblem />}
			width='sm'
			center
		>
			<div className='flex flex-col items-center gap-7 text-center'>
				<motion.h1
					className='text-5xl font-black tracking-tight text-white sm:text-6xl'
					style={HEADLINE}
					initial={{ scale: 0.5, opacity: 0, rotate: -6 }}
					animate={{ scale: 1, opacity: 1, rotate: -2 }}
					transition={{ type: 'spring', stiffness: 380, damping: 14 }}
				>
					{flawless ? t('review.flawless') : t('review.niceWork')}
				</motion.h1>

				<div className='flex justify-center gap-14'>
					{newIds.length > 0 ? (
						<Stat
							outlined
							className='animate-pop-in [animation-delay:250ms]'
							valueClassName='text-berry-500'
							value={<CountUp value={newIds.length} delay={0.35} />}
							label={t('review.newCards', { count: newIds.length })}
						/>
					) : null}
					{reviewedIds.length > 0 ? (
						<Stat
							outlined
							className='animate-pop-in [animation-delay:400ms]'
							valueClassName='text-ink'
							value={<CountUp value={reviewedIds.length} delay={0.5} />}
							label={t('review.reviewed', { count: reviewedIds.length })}
						/>
					) : null}
				</div>

				<MasteryMap
					className='raised h-56 animate-pop-in rounded-card border-2 border-line [animation-delay:550ms] sm:h-64'
					layer={layer}
					todayIds={[...newIds, ...reviewedIds]}
				/>

				<div className='flex w-full flex-col items-center gap-3'>
					{dueTomorrow > 0 ? (
						<p className='text-base font-extrabold text-muted'>
							{t('review.tomorrow', { count: dueTomorrow })}
						</p>
					) : null}
					{unseenCount > 0 ? (
						<Button
							variant='lagoon'
							size='lg'
							className='w-full sm:w-64'
							pending={adding}
							onClick={addMore}
						>
							{t('review.learnMore', { count: LEARN_MORE_COUNT })}
						</Button>
					) : null}
					<Button asChild size='lg' className='w-full sm:w-64'>
						<LocalizedLink to='/'>{t('common.home')}</LocalizedLink>
					</Button>
				</div>
			</div>
		</PageShell>
	)
}
