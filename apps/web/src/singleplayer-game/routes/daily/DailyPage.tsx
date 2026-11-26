import { dailyRoutes } from '@georally/country-catalog/daily-routes'
import {
	createIdleState,
	dailyDay,
} from '@georally/game-domain/singleplayer/routes'
import { Play } from 'lucide-react'
import { AnimatePresence, useReducedMotion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { useLocalizedNavigate } from '@/app/useLocalizedNavigate'
import { BackLink, PageShell } from '@/shared/layout'
import { prefetchMap } from '@/shared/map/prefetchMap'
import { localDay, localDayStart } from '@/shared/time/localDay'
import { useNow } from '@/shared/time/useNow'
import { Button, TextButton } from '@/shared/ui'
import { singleplayerPaths } from '../../paths'
import { DailyTicket, HiddenRoute, ResultStamp } from './DailyTicket'
import { dailySlot, loadDailyEntries } from './dailyStore'
import { dailyToday } from './dailyToday'
import { dailyPaths } from './paths'

const TEAR_MS = 950
const SNAP_MS = 380

const prefetchGame = () => {
	void import('./DailyGamePage')
	prefetchMap()
}

function clock(ms: number): string {
	const seconds = Math.max(0, Math.ceil(ms / 1000))
	return [
		Math.floor(seconds / 3600),
		Math.floor(seconds / 60) % 60,
		seconds % 60,
	]
		.map(part => String(part).padStart(2, '0'))
		.join(':')
}

export default function DailyPage() {
	const { t, i18n } = useTranslation()
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

	useEffect(() => {
		const timer = setTimeout(prefetchGame, 500)
		return () => clearTimeout(timer)
	}, [])

	const weekday = (key: string) =>
		new Intl.DateTimeFormat(i18n.language, { weekday: 'long' }).format(
			localDayStart(key),
		)

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
						eyebrow={weekday(dailyRoutes.launch)}
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
			<AnimatePresence mode='wait'>
				<DailyTicket
					key={number}
					eyebrow={carried ? t('daily.yesterday') : weekday(puzzleDay)}
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
						<button
							type='button'
							className='mt-5 w-full text-center font-extrabold text-white/90 underline-offset-4 hover:underline'
							onClick={play}
							onPointerEnter={prefetchGame}
						>
							{t('daily.seeRoute')}
						</button>
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
			{finished ? (
				<Countdown label={t('daily.nextIn')} ms={day.end - now} />
			) : null}
			{practice}
		</DailyShell>
	)
}

function DailyShell({ children }: { children: ReactNode }) {
	const { t } = useTranslation()

	return (
		<PageShell headerTitle={t('daily.title')}>
			<BackLink to='/'>{t('common.home')}</BackLink>
			<div className='flex flex-1 flex-col items-center gap-8 pt-10 pb-4 sm:justify-center sm:pt-14'>
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
