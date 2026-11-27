import type { RouteState } from '@georally/game-domain/singleplayer/routes'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { celebrate as confetti } from '@/shared/lib/confetti'
import { PressedBest } from '@/shared/widgets/streak/PressedBest'
import { StreakFlame } from '@/shared/widgets/streak/StreakFlame'
import { WeekPunchCard } from '@/shared/widgets/streak/WeekPunchCard'
import type { DayStreak } from './useDayStreak'
import { useWeekSlots } from './useWeekSlots'

const FLARE_AFTER_PUNCH = 0.35
const MILESTONES = [7, 30, 100, 365]
const NO_DAYS: ReadonlySet<string> = new Set()
const SECTION =
	'relative z-20 flex w-[calc(100%-1rem)] max-w-sm items-end gap-3'
const FLAME = 'w-[5.25rem]'

export function DailyStreak({
	entries,
	today,
	dayStreak,
	celebrate,
}: {
	entries: ReadonlyMap<number, RouteState>
	today: string
	dayStreak: DayStreak | null
	celebrate: { day: string; delay: number } | null
}) {
	const { t } = useTranslation()
	const reviewDays = dayStreak?.reviewDays ?? NO_DAYS
	const current = dayStreak?.streak.current ?? 0
	const slots = useWeekSlots(entries, reviewDays, today)
	const punchIndex = celebrate
		? slots.findIndex(slot => slot.day === celebrate.day)
		: -1
	const punch =
		celebrate && punchIndex >= 0
			? { index: punchIndex, delay: celebrate.delay }
			: null
	const ignite =
		celebrate && celebrate.day === today && !reviewDays.has(today)
			? {
					from: Math.max(0, current - 1),
					delay: celebrate.delay + FLARE_AFTER_PUNCH,
				}
			: null
	const milestone =
		ignite && MILESTONES.includes(current) ? ignite.delay : null

	useEffect(() => {
		if (milestone === null) return
		const timer = setTimeout(confetti, milestone * 1000)
		return () => clearTimeout(timer)
	}, [milestone])

	if (!dayStreak) {
		return (
			<section aria-hidden='true' className={SECTION}>
				<span className={`${FLAME} aspect-[100/120]`} />
			</section>
		)
	}
	const { streak } = dayStreak

	return (
		<section className={SECTION}>
			<StreakFlame
				count={streak.current}
				state={
					streak.todayActive ? 'lit' : streak.current > 0 ? 'risk' : 'cold'
				}
				ignite={ignite}
				className={FLAME}
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
