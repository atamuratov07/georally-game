import type { RouteState } from '@georally/game-domain/singleplayer/routes'
import { motion, useReducedMotion } from 'motion/react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { weekdayKey } from '@/shared/time/weekdays'
import { StreakFlame } from '@/shared/widgets/streak/StreakFlame'
import { WeekPunchCard } from '@/shared/widgets/streak/WeekPunchCard'
import { dailyStreak, dailyWeek } from './streak'

const FLARE_AFTER_PUNCH = 0.35

export function DailyStreak({
	entries,
	today,
	celebrate,
}: {
	entries: ReadonlyMap<number, RouteState>
	today: string
	celebrate: { day: string; delay: number } | null
}) {
	const { t } = useTranslation()
	const streak = useMemo(() => dailyStreak(entries, today), [entries, today])
	const slots = useMemo(
		() =>
			dailyWeek(entries, today).map(slot => ({
				...slot,
				label: t(`common.weekdayShort.${weekdayKey(slot.day)}`),
			})),
		[entries, today, t],
	)
	const punchIndex = celebrate
		? slots.findIndex(slot => slot.day === celebrate.day)
		: -1
	const punch =
		celebrate && punchIndex >= 0
			? { index: punchIndex, delay: celebrate.delay }
			: null
	const ignite =
		celebrate && celebrate.day === today
			? {
					from: Math.max(0, streak.current - 1),
					delay: celebrate.delay + FLARE_AFTER_PUNCH,
				}
			: null

	return (
		<section className='relative z-20 flex w-[calc(100%-1rem)] max-w-sm items-end gap-3'>
			<StreakFlame
				count={streak.current}
				state={
					streak.todayActive ? 'lit' : streak.current > 0 ? 'risk' : 'cold'
				}
				ignite={ignite}
				className='w-[5.25rem]'
			/>
			<WeekPunchCard
				className='min-w-0 flex-1'
				slots={slots}
				title={t('daily.streak', { count: streak.current })}
				aside={
					streak.best > streak.current ? (
						<PressedBest label={t('daily.best')} best={streak.best} />
					) : null
				}
				punch={punch}
			/>
		</section>
	)
}

function PressedBest({ label, best }: { label: string; best: number }) {
	const reduceMotion = useReducedMotion()

	return (
		<motion.p
			className='flex shrink-0 items-baseline gap-1 font-black text-sunflower-200 [text-shadow:0_-1px_0_rgb(168_98_0/0.45),0_1px_0_#fff]'
			initial={reduceMotion ? false : { scale: 1.3, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={{ duration: 0.18, ease: 'easeIn', delay: 0.6 }}
		>
			<span className='text-[0.6875rem] tracking-wider uppercase'>
				{label}
			</span>
			<span className='text-xl leading-none tabular-nums'>{best}</span>
		</motion.p>
	)
}
