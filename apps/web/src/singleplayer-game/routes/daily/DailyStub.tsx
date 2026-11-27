import { dailyRoutes } from '@georally/country-catalog/daily-routes'
import { createIdleState } from '@georally/game-domain/singleplayer/routes'
import { Lock, Play } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { prefetchMap } from '@/shared/map/prefetchMap'
import { localDay } from '@/shared/time/localDay'
import { useNow } from '@/shared/time/useNow'
import { weekdayKey } from '@/shared/time/weekdays'
import { StreakFlame } from '@/shared/widgets/streak/StreakFlame'
import { clock } from './clock'
import { dailySlot, loadDailyEntries } from './dailyStore'
import { dailyToday } from './dailyToday'
import { dailyPaths } from './paths'
import { dailyStreak } from './streak'
import './ticket.css'

const prefetchGame = () => {
	void import('./DailyGamePage')
	prefetchMap()
}

export function DailyStub() {
	const { t } = useTranslation()
	const reduceMotion = useReducedMotion()
	const now = useNow(1000, true)
	const [entries] = useState(loadDailyEntries)
	const day = localDay(now)
	const today = dailyToday(now, entries)
	const streak = useMemo(
		() => dailyStreak(entries, day.key),
		[entries, day.key],
	)

	if (today.kind === 'over') return null
	if (today.kind === 'puzzle' && today.game?.phase === 'finished') return null

	let stub: StubContent
	if (today.kind === 'soon') {
		stub = {
			to: dailyPaths.page,
			number: 1,
			eyebrow: t(`common.weekday.${weekdayKey(dailyRoutes.launch)}`),
			action: (
				<>
					<Lock aria-hidden='true' className='size-5 text-sunflower-200' />
					<Timer label={t('daily.opensIn')} ms={today.opensAt - now} />
				</>
			),
		}
	} else {
		const { number, game, carried } = today
		const unstarted = !game || game.phase === 'idle'
		stub = {
			to: dailyPaths.play,
			number,
			eyebrow: t(carried ? 'daily.yesterday' : 'daily.today'),
			onOpen: unstarted
				? () =>
						dailySlot(number).save(
							createIdleState({ kind: 'daily', number }),
						)
				: undefined,
			action: (
				<>
					<Play
						aria-hidden='true'
						fill='currentColor'
						className='size-5 text-sunflower-300 transition-transform group-hover:translate-x-0.5'
					/>
					<span className='text-lg'>
						{t(
							game?.phase === 'playing'
								? 'daily.continue'
								: 'daily.play',
						)}
					</span>
				</>
			),
		}
	}

	return (
		<motion.div
			className='mx-auto mb-5 max-w-md'
			initial={reduceMotion ? false : { y: -18, rotate: -5, opacity: 0 }}
			animate={{ y: 0, rotate: -1, opacity: 1 }}
			transition={{ type: 'spring', stiffness: 420, damping: 18 }}
		>
			<LocalizedLink
				to={stub.to}
				onClick={stub.onOpen}
				onPointerEnter={prefetchGame}
				onFocus={prefetchGame}
				className='group block rounded-2xl transition-transform duration-200 outline-offset-4 hover:-translate-y-0.5 hover:rotate-1 active:translate-y-0.5'
			>
				<span className='sr-only'>{t('daily.title')} </span>
				<span className='flex h-[4.5rem] [filter:drop-shadow(0_5px_0_var(--color-grass-800))_drop-shadow(0_14px_14px_rgb(24_34_61/0.18))]'>
					<span className='daily-mini-left flex min-w-0 flex-1 items-center gap-3 rounded-l-2xl bg-grass-500 px-4 text-white'>
						{streak.current > 0 ? (
							<StreakFlame
								count={streak.current}
								state={streak.todayActive ? 'lit' : 'risk'}
								className='-my-1 w-14'
							/>
						) : null}
						<span className='flex min-w-0 flex-col gap-0.5'>
							<span className='truncate text-xs font-extrabold tracking-wide text-sunflower-200 uppercase'>
								{stub.eyebrow}
							</span>
							<span className='text-3xl leading-none font-black tracking-tight'>
								<span className='text-sunflower-300'>#</span>
								{stub.number}
							</span>
						</span>
					</span>
					<span className='daily-mini-right flex shrink-0 items-center gap-2 rounded-r-2xl border-l-2 border-dashed border-white/35 bg-grass-600 px-5 font-black text-white'>
						{stub.action}
					</span>
				</span>
			</LocalizedLink>
		</motion.div>
	)
}

interface StubContent {
	to: string
	number: number
	eyebrow: string
	action: ReactNode
	onOpen?: () => void
}

function Timer({ label, ms }: { label: string; ms: number }) {
	return (
		<span className='flex flex-col items-end text-right leading-tight'>
			<span className='text-[0.625rem] font-extrabold tracking-wide text-sunflower-200 uppercase'>
				{label}
			</span>
			<span className='text-sm tabular-nums'>{clock(ms)}</span>
		</span>
	)
}
