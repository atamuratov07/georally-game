import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { loadReviewPlan, type ReviewPlan } from '@/mastery/bridge/reviewPlan'
import { localDay } from '@/shared/time/localDay'
import { useNow } from '@/shared/time/useNow'
import { cn } from '@/shared/utils'
import { PressedBest } from '@/shared/widgets/streak/PressedBest'
import { StreakFlame } from '@/shared/widgets/streak/StreakFlame'
import { WeekPunchCard } from '@/shared/widgets/streak/WeekPunchCard'
import { PortraitTicket } from '@/singleplayer-game/routes/daily/MiniTicket'
import { useDailyToday } from '@/singleplayer-game/routes/daily/useDailyToday'
import { ReviewCard } from './ReviewCard'
import './today.css'

export default function TodaySection() {
	const { t } = useTranslation()
	const reduceMotion = useReducedMotion()
	const now = useNow(1000, true)
	const dayKey = localDay(now).key
	const daily = useDailyToday(now)
	const [plan, setPlan] = useState<ReviewPlan | null | undefined>()

	useEffect(() => {
		let live = true
		void loadReviewPlan(Date.now()).then(result => {
			if (live) setPlan(result)
		})
		return () => {
			live = false
		}
	}, [dayKey])

	if (!daily || plan === undefined) return null

	const { ticket, slots } = daily
	const { current, best, todayActive } = daily.streak
	const [title, text] = todayActive
		? [
				t(
					current > 1
						? 'landing.today.doneTitle'
						: 'landing.today.firstTitle',
				),
				t('landing.today.doneText'),
			]
		: current > 0
			? [t('landing.today.riskTitle'), t('landing.today.riskText')]
			: [t('landing.today.startTitle'), t('landing.today.startText')]

	const deal = (index: number) =>
		reduceMotion
			? {}
			: {
					initial: { y: -28, rotate: index % 2 ? 7 : -7, opacity: 0 },
					animate: { y: 0, rotate: index % 2 ? 1.5 : -1.5, opacity: 1 },
					transition: {
						type: 'spring' as const,
						stiffness: 380,
						damping: 17,
						delay: 0.25 + 0.1 * index,
					},
				}

	return (
		<motion.section
			aria-labelledby='today-title'
			className='raised mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-[2rem] bg-[#f5f0ff] p-5 text-ink [--edge:#d6c8f5] sm:gap-8 sm:p-8'
			initial={reduceMotion ? false : { y: 24, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ type: 'spring', stiffness: 300, damping: 24 }}
		>
			<header className='flex items-center gap-4 sm:gap-6'>
				<StreakFlame
					count={current}
					state={todayActive ? 'lit' : current > 0 ? 'risk' : 'cold'}
					className='w-16 sm:w-20'
				/>
				<div className='min-w-0'>
					<h2
						id='today-title'
						className='text-2xl leading-tight font-black tracking-tight text-balance sm:text-4xl'
					>
						{title}
					</h2>
					<p className='mt-1 font-bold text-ink/60 sm:text-lg'>{text}</p>
				</div>
			</header>

			<div className={cn('grid gap-6', ticket && 'min-[540px]:grid-cols-2')}>
				{ticket ? (
					<motion.div {...deal(0)}>
						<PortraitTicket content={ticket} />
					</motion.div>
				) : null}
				<motion.div {...deal(1)}>
					<ReviewCard plan={plan} />
				</motion.div>
			</div>

			{best > 0 ? (
				<WeekPunchCard
					slots={slots}
					title={t('landing.today.thisWeek')}
					aside={
						best > current ? (
							<PressedBest label={t('daily.best')} best={best} />
						) : null
					}
				/>
			) : null}
		</motion.section>
	)
}
