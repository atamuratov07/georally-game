import { dailyRoutes } from '@georally/country-catalog/daily-routes'
import {
	createIdleState,
	dailyDay,
	getTimeline,
} from '@georally/game-domain/singleplayer/routes'
import { Play } from 'lucide-react'
import { AnimatePresence, useReducedMotion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { LocalizedLink } from '@/app/LocalizedLink'
import { useLocalizedNavigate } from '@/app/useLocalizedNavigate'
import { BackLink, PageShell } from '@/shared/layout'
import { prefetchMap } from '@/shared/map/prefetchMap'
import { localDay } from '@/shared/time/localDay'
import { useNow } from '@/shared/time/useNow'
import { weekdayKey } from '@/shared/time/weekdays'
import { Button, TextButton } from '@/shared/ui'
import { singleplayerPaths } from '../../paths'
import { clock } from './clock'
import { DailyShareButton } from './DailyShareButton'
import { DailyStreak } from './DailyStreak'
import { DailyTicket, HiddenRoute, ResultStamp } from './DailyTicket'
import { dailySlot, loadDailyEntries } from './dailyStore'
import { dailyToday } from './dailyToday'
import { dailyPaths } from './paths'
import { tilesShownAt } from './share'
import { useDayStreak } from './useDayStreak'
import { useLazyBoard } from './useLazyBoard'

const TEAR_MS = 950
const SNAP_MS = 380
const SHARE_TILES_DELAY = 1.4
const PUNCH_AFTER_TILES = 0.35

const prefetchGame = () => {
	void import('./DailyGamePage')
	prefetchMap()
}

export default function DailyPage() {
	const { t } = useTranslation()
	const navigate = useLocalizedNavigate()
	const reduceMotion = useReducedMotion()
	const now = useNow(1000, true)
	const day = localDay(now)
	const [entries, setEntries] = useState(loadDailyEntries)
	const [readOn, setReadOn] = useState(day.key)
	const [torn, setTorn] = useState(false)
	if (readOn !== day.key) {
		setReadOn(day.key)
		setEntries(loadDailyEntries())
	}
	const today = dailyToday(now, entries)
	const finishedEntry =
		today.kind === 'puzzle' && today.game?.phase === 'finished'
			? today.entry
			: null
	const board = useLazyBoard(finishedEntry)
	const dayStreak = useDayStreak(entries, day.key)
	const location = useLocation()
	const [solvedNumber] = useState(
		() => (location.state as { solved?: number } | null)?.solved,
	)

	useEffect(() => {
		if (location.state !== null) navigate(dailyPaths.page, { replace: true })
	}, [location.state, navigate])

	useEffect(() => {
		if (finishedEntry) void navigator.storage?.persist?.()
	}, [finishedEntry])

	useEffect(() => {
		const timer = setTimeout(prefetchGame, 500)
		return () => clearTimeout(timer)
	}, [])

	const weekdayName = (key: string) => t(`common.weekday.${weekdayKey(key)}`)

	const practice = (
		<TextButton asChild>
			<LocalizedLink to={singleplayerPaths('routes').setup}>
				{t('daily.practice')}
			</LocalizedLink>
		</TextButton>
	)

	if (today.kind === 'over') {
		return (
			<DailyShell>
				<div className='flex animate-pop-in flex-col items-center gap-3 text-center'>
					<h1 className='text-3xl font-black tracking-tight'>
						{t('daily.overTitle')}
					</h1>
					<p className='max-w-xs font-bold text-muted'>
						{t('daily.overText')}
					</p>
					<Button asChild variant='grass' className='mt-4'>
						<LocalizedLink to={singleplayerPaths('routes').setup}>
							{t('daily.practice')}
						</LocalizedLink>
					</Button>
				</div>
			</DailyShell>
		)
	}

	if (today.kind === 'soon') {
		return (
			<DailyShell>
				<h1 className='sr-only'>{`${t('daily.title')} #1`}</h1>
				<AnimatePresence mode='wait'>
					<DailyTicket
						key='soon'
						eyebrow={weekdayName(dailyRoutes.launch)}
						number={1}
						locked
					>
						<Countdown
							label={t('daily.opensIn')}
							ms={today.opensAt - now}
							light
						/>
					</DailyTicket>
				</AnimatePresence>
				{practice}
			</DailyShell>
		)
	}

	const { number, entry, game, carried } = today
	const finished = game?.phase === 'finished' ? game : null
	const puzzleDay = dailyDay(dailyRoutes.launch, number)
	const celebrate =
		finished?.outcome === 'solved' && solvedNumber === number
			? {
					day: puzzleDay,
					delay:
						tilesShownAt(
							SHARE_TILES_DELAY,
							getTimeline(finished).length,
						) + PUNCH_AFTER_TILES,
				}
			: null

	function play() {
		const unstarted = !game || game.phase === 'idle'
		if (unstarted) {
			dailySlot(number).save(createIdleState({ kind: 'daily', number }))
		}
		if (reduceMotion || !unstarted) {
			navigate(dailyPaths.play)
			return
		}
		setTorn(true)
		setTimeout(() => {
			if ('vibrate' in navigator) navigator.vibrate(12)
		}, SNAP_MS)
		setTimeout(() => navigate(dailyPaths.play), TEAR_MS)
	}

	return (
		<DailyShell>
			<h1 className='sr-only'>{`${t('daily.title')} #${number}`}</h1>
			<DailyStreak
				entries={entries}
				today={day.key}
				dayStreak={dayStreak}
				celebrate={celebrate}
			/>
			<AnimatePresence mode='wait'>
				<DailyTicket
					key={number}
					eyebrow={carried ? t('daily.yesterday') : weekdayName(puzzleDay)}
					number={number}
					level={entry.level}
					torn={torn}
					stamp={
						finished ? (
							<ResultStamp game={finished} par={entry.par} />
						) : null
					}
				>
					<HiddenRoute
						par={entry.par}
						solved={finished?.outcome === 'solved'}
						ends={finished}
					/>
					{finished ? (
						<>
							<DailyShareButton
								number={number}
								board={board}
								state={finished}
								delay={SHARE_TILES_DELAY}
								className='mt-6'
							/>
							<div className='mt-5'>
								<Countdown
									label={t('daily.nextIn')}
									ms={day.end - now}
									light
								/>
							</div>
							<button
								type='button'
								className='mt-3 w-full text-center font-extrabold text-white/90 underline-offset-4 hover:underline'
								onClick={play}
								onPointerEnter={prefetchGame}
							>
								{t('daily.seeRoute')}
							</button>
						</>
					) : (
						<Button
							type='button'
							size='lg'
							className='mt-6 w-full'
							onClick={play}
							onPointerEnter={prefetchGame}
						>
							<Play aria-hidden='true' fill='currentColor' />
							{t(
								game?.phase === 'playing'
									? 'daily.continue'
									: 'daily.play',
							)}
						</Button>
					)}
				</DailyTicket>
			</AnimatePresence>
			{practice}
		</DailyShell>
	)
}

function DailyShell({ children }: { children: ReactNode }) {
	const { t } = useTranslation()

	return (
		<PageShell headerTitle={t('daily.title')}>
			<BackLink to='/'>{t('common.home')}</BackLink>
			<div className='flex flex-1 flex-col items-center gap-8 pt-2 pb-4 sm:justify-center sm:pt-6'>
				{children}
			</div>
		</PageShell>
	)
}

function Countdown({
	label,
	ms,
	light = false,
}: {
	label: string
	ms: number
	light?: boolean
}) {
	return (
		<p className='flex flex-col items-center gap-1 text-center'>
			<span
				className={
					light
						? 'text-sm font-extrabold tracking-wide text-sunflower-200 uppercase'
						: 'text-sm font-extrabold tracking-wide text-muted uppercase'
				}
			>
				{label}
			</span>
			<span
				className={
					light
						? 'text-5xl font-black tracking-tight text-white tabular-nums'
						: 'text-5xl font-black tracking-tight text-ink tabular-nums'
				}
			>
				{clock(ms)}
			</span>
		</p>
	)
}
