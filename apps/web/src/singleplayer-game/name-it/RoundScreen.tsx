import { countryCatalog } from '@georally/country-catalog'
import type { InputMethod, MatchResult } from '@georally/game-domain/answers'
import {
	getLastAttempt,
	getOutcome,
	getQuestionCount,
	getQuestionIndex,
	getRoundPoints,
	getScore,
	getTargetId,
	type GameState,
} from '@georally/game-domain/singleplayer/name-it'
import { Flag, LogOut } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from '@/app/LocaleContext'
import { LocalizedLink } from '@/app/LocalizedLink'
import { defaultSpeechLanguage } from '@/shared/answers/speechLanguage'
import { getCountryName } from '@/shared/i18n'
import { useKeyboardInset } from '@/shared/lib/useKeyboardInset'
import type { FitTarget } from '@/shared/map/camera/useFitCamera'
import type {
	MapHighlight,
	MapMarker,
	MapRevealTarget,
} from '@/shared/map/types'
import { Button } from '@/shared/ui'
import { CountryInfoCard } from '@/shared/widgets/CountryInfoCard'
import { ScoreBanner } from '@/shared/widgets/ScoreBanner'
import { singleplayerPaths } from '../paths'
import { AnswerBar } from './components/AnswerBar'
import { AttemptFeedback } from './components/AttemptFeedback'
import { CountdownBar } from './components/Countdown'
import { NameItMap } from './NameItMap'

const TOP_INSET_PX = 72
const MAP_CONTROLS_TOP = '4.5rem'
const ANSWER_PANEL_PX = 110
const NO_IDS: readonly string[] = []
const NO_HIGHLIGHTS: readonly MapHighlight[] = []
const NO_MARKERS: readonly MapMarker[] = []

interface RoundScreenProps {
	state: GameState
	upcomingTargetId: string | null
	onBegin: () => void
	onAnswer: (method: InputMethod, result: MatchResult) => void
	onGiveUp: () => void
	onNext: () => void
}

interface SettledRound {
	roundKey: string
	isTiny: boolean
}

function TinyCountryRing() {
	return (
		<span className='relative block size-11'>
			<span className='absolute inset-0 animate-ping rounded-full border-4 border-sunflower-400' />
			<span className='absolute inset-0 rounded-full border-4 border-sunflower-500 shadow-[0_0_0_3px_rgb(255_255_255/0.85)]' />
		</span>
	)
}

export function RoundScreen({
	state,
	upcomingTargetId,
	onBegin,
	onAnswer,
	onGiveUp,
	onNext,
}: RoundScreenProps) {
	const { t } = useTranslation()
	const language = useCurrentLocale()
	const reduceMotion = useReducedMotion()
	const keyboardInset = useKeyboardInset()
	const [advancing, setAdvancing] = useState(false)
	const [settled, setSettled] = useState<SettledRound | null>(null)
	const [speechLanguage, setSpeechLanguage] = useState(() =>
		defaultSpeechLanguage(language),
	)

	const phase = state.phase
	const index = getQuestionIndex(state)
	const total = getQuestionCount(state) || state.config.questionCount
	const targetId = getTargetId(state)
	const outcome = getOutcome(state)
	const targetInfo = targetId
		? countryCatalog.countriesById.get(targetId)
		: undefined
	const revealed = phase === 'revealed' && !advancing
	const round =
		state.phase === 'answering' || state.phase === 'revealed' ? state : null

	const focusCountryId =
		phase === 'idle' || advancing ? upcomingTargetId : targetId
	const focusRound = phase === 'idle' ? 0 : advancing ? index + 1 : index
	const roundKey = `${focusRound}:${focusCountryId}`
	const focusStage = revealed ? 'reveal' : 'round'
	const focusBounds = focusCountryId
		? countryCatalog.countriesById.get(focusCountryId)?.bounds
		: undefined
	const focus = useMemo<FitTarget | null>(
		() =>
			focusCountryId && focusBounds
				? { key: `${roundKey}:${focusStage}`, bounds: focusBounds }
				: null,
		[focusBounds, focusCountryId, focusStage, roundKey],
	)
	const isRoundSettled = !advancing && settled?.roundKey === roundKey

	const handleFocusSettled = useCallback(
		(_key: string, isTiny: boolean) => {
			setSettled({ roundKey, isTiny })
			if (phase === 'idle') {
				onBegin()
			} else if (advancing) {
				setAdvancing(false)
				onNext()
			}
		},
		[advancing, onBegin, onNext, phase, roundKey],
	)

	const handleNext = () => {
		if (upcomingTargetId) {
			setAdvancing(true)
		} else {
			onNext()
		}
	}

	const highlights = useMemo<readonly MapHighlight[]>(() => {
		if (!targetId || !isRoundSettled || !round) {
			return NO_HIGHLIGHTS
		}
		if (round.phase === 'answering') {
			return [{ countryId: targetId, tone: 'target' }]
		}
		return [
			{
				countryId: targetId,
				tone: outcome === 'correct' ? 'correct' : 'wrong',
			},
		]
	}, [isRoundSettled, outcome, round, targetId])

	const labelIds = useMemo(
		() => (revealed && targetId ? [targetId] : NO_IDS),
		[revealed, targetId],
	)

	const markers = useMemo<readonly MapMarker[]>(() => {
		if (!targetInfo || !round || !isRoundSettled || !settled?.isTiny) {
			return NO_MARKERS
		}
		return [
			{
				id: 'tiny-target',
				longitude: targetInfo.centroidLng,
				latitude: targetInfo.centroidLat,
				anchor: 'center',
				element: <TinyCountryRing />,
			},
		]
	}, [isRoundSettled, round, settled?.isTiny, targetInfo])

	const reveal = useMemo<MapRevealTarget | null>(
		() =>
			revealed && targetInfo
				? {
						countryId: targetInfo.id,
						longitude: targetInfo.centroidLng,
						latitude: targetInfo.centroidLat,
					}
				: null,
		[revealed, targetInfo],
	)

	const insets = useMemo(
		() => ({ top: TOP_INSET_PX, bottom: ANSWER_PANEL_PX + keyboardInset }),
		[keyboardInset],
	)

	const current = Math.min(index + 1, total)
	const timing = round && !advancing ? round : null

	return (
		<section className='relative h-full overflow-hidden'>
			<h1 className='sr-only' aria-live='polite'>
				{revealed && targetInfo
					? getCountryName(targetInfo, language)
					: t('game.progress', { current, total })}
			</h1>

			<NameItMap
				scope={state.config.scope}
				focus={focus}
				targetId={targetId}
				outlined={phase === 'answering' && isRoundSettled}
				highlights={highlights}
				labelIds={labelIds}
				markers={markers}
				reveal={reveal}
				popup={
					reveal && targetInfo ? (
						<CountryInfoCard info={targetInfo} />
					) : null
				}
				insets={insets}
				controlsTop={MAP_CONTROLS_TOP}
				onFocusSettled={handleFocusSettled}
			/>

			<div className='pointer-events-none absolute inset-x-0 top-0 z-30'>
				<CountdownBar
					deadlineAt={timing ? timing.deadlineAt : null}
					frozenAt={
						timing?.phase === 'revealed' ? timing.resolvedAt : null
					}
					limitMs={state.config.timeLimitMs}
				/>
			</div>

			<Button
				asChild
				variant='neutral'
				size='icon'
				className='absolute top-4 left-3 z-30'
				aria-label={t('singleplayer.exit')}
				title={t('singleplayer.exit')}
			>
				<LocalizedLink to={singleplayerPaths('name-it').setup}>
					<LogOut aria-hidden='true' className='rotate-180' />
				</LocalizedLink>
			</Button>

			<span
				className='raised absolute top-4 right-3 z-30 grid h-11 min-w-11 place-items-center rounded-full border-2 border-line-strong bg-white px-3.5 text-base font-black text-ink tabular-nums [--edge-size:4px] [--edge:var(--color-line-strong)]'
				aria-label={t('game.progress', { current, total })}
			>
				{current}/{total}
			</span>

			{phase === 'answering' && isRoundSettled ? (
				<Button
					type='button'
					variant='neutral'
					size='sm'
					className='absolute top-18 right-3 z-30'
					onClick={onGiveUp}
				>
					<Flag aria-hidden='true' />
					{t('singleplayer.giveUp')}
				</Button>
			) : null}

			<ScoreBanner
				className='top-20'
				triggerKey={round?.phase === 'revealed' ? round.resolvedAt : null}
				isCorrect={outcome === null ? null : outcome === 'correct'}
				totalScore={getScore(state)}
				awardedScore={getRoundPoints(state) ?? 0}
			/>

			<div
				className='absolute inset-x-0 z-20 mx-auto flex w-full max-w-xl flex-col gap-3 px-4'
				style={{ bottom: keyboardInset > 0 ? keyboardInset : 24 }}
			>
				{phase === 'answering' ? (
					<motion.div
						key={index}
						className='flex flex-col gap-3'
						initial={reduceMotion ? false : { y: 56, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ type: 'spring', stiffness: 420, damping: 32 }}
					>
						<AttemptFeedback attempt={getLastAttempt(state)} />
						<AnswerBar
							targetId={targetId ?? ''}
							lastAttempt={getLastAttempt(state)}
							speechLanguage={speechLanguage}
							onSpeechLanguageChange={setSpeechLanguage}
							onAnswer={onAnswer}
						/>
					</motion.div>
				) : revealed ? (
					<Button
						type='button'
						variant='ocean'
						size='lg'
						className='mx-auto animate-pop-in px-10 [--drop:0_14px_30px_-8px_rgb(24_34_61/0.4)]'
						autoFocus
						onClick={handleNext}
					>
						{t('singleplayer.next')}
					</Button>
				) : null}
			</div>
		</section>
	)
}
