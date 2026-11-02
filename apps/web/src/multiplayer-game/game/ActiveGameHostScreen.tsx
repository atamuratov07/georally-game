import type { GameHostView } from '@georally/game-domain/multiplayer/game'
import type { VisibleMemberInfo } from '@georally/game-domain/multiplayer/room'
import { AnimatePresence, motion } from 'motion/react'
import { FloatingNotice } from '../../shared/ui/FloatingNotice'
import {
	getCurrentRound,
	getHostStandings,
	getTargetCountryInfo,
	type HostParticipantStanding,
} from '../model/gameSelectors'
import { Button } from '../../shared/ui'
import { Check, HashIcon, LoaderIcon, Users, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { animate, type ValueTransition } from 'motion'
import { getCountryName } from '../../shared/i18n'
import { useTranslation } from 'react-i18next'
import { cn } from '../../shared/utils'
import { useCurrentLocale } from '../../app/LocaleContext'

const EASE = [0.22, 1, 0.36, 1] as const
const ROW_LAYOUT_TRANSITION = {
	duration: 0.5,
	ease: EASE,
} as ValueTransition
const SCORE_COUNT_DURATION_S = 0.6

interface ActiveGameHostScreenProps {
	game: GameHostView
	members: VisibleMemberInfo[]
	revealPending: boolean
	advancePending: boolean
	actionErrorMessage: string | null
	isReconnecting: boolean
	onRevealRound: () => Promise<void>
	onAdvanceRound: () => Promise<void>
}

function AnimatedScore({
	score,
	submission,
	className,
}: {
	score: number
	submission: HostParticipantStanding['submission']
	className?: string
}) {
	const [display, setDisplay] = useState(score)
	const previousValueRef = useRef(score)

	useEffect(() => {
		if (previousValueRef.current === score) return
		const from = previousValueRef.current
		previousValueRef.current = score

		const controls = animate(from, score, {
			duration: SCORE_COUNT_DURATION_S,
			ease: EASE,
			onUpdate: latest => setDisplay(Math.round(latest)),
		})

		return () => controls.stop()
	}, [score])

	return (
		<div
			className={`tabular-nums text-center text-lg sm:text-xl font-bold text-indigo-600 ${className}`}
		>
			<span className='relative'>
				{new Intl.NumberFormat('en-US').format(display)}
				{submission && (
					<motion.span
						initial={{ x: -10, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ duration: 0.1 }}
						className={cn(
							'absolute top-1/2 right-0 -translate-y-1/2 translate-x-[120%]  text-sm font-bold text-grey-500',
							submission.submittedAt
								? submission.isCorrect
									? 'text-emerald-700'
									: 'text-rose-600'
								: 'text-gray-500',
						)}
					>
						{`${submission.isCorrect || !submission.submittedAt ? '+' : '-'}${Math.abs(submission.scoreAwarded)}`}
					</motion.span>
				)}
			</span>
		</div>
	)
}

function PlayerBadge({
	name,
	connected,
}: {
	name: string
	connected: boolean
}) {
	const words = name.trim().split(/\s+/)
	const initials = (
		words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0]
	).toUpperCase()
	return (
		<span
			className={`relative grid h-9 w-9 min-w-9 place-items-center rounded-full text-lg uppercase font-regular ${
				connected
					? 'bg-yellow-200 text-blue-300'
					: 'bg-gray-100 text-gray-300'
			}`}
		>
			{initials}
			{!connected ? (
				<span className='absolute z-5 bottom-0.5 right-0.5 flex items-center justify-center w-2.5 h-2.5 rounded-full bg-red-400'>
					<X className='w-2 h-2 stroke-3 text-white' />
				</span>
			) : null}
		</span>
	)
}

function AnswerProgress({
	startedAt,
	submittedAt,
}: {
	startedAt: number
	submittedAt: number | null
}) {
	return (
		<div className='flex items-center justify-end gap-2'>
			{submittedAt && (
				<span>
					{new Date(submittedAt - startedAt).toISOString().slice(14, 19)}
				</span>
			)}
			<span
				aria-hidden='true'
				className={cn(
					'h-3 w-3 rounded-full transition-colors duration-300',
					submittedAt ? 'bg-amber-400' : 'bg-slate-200',
				)}
			/>
		</div>
	)
}

function SubmissionMark({
	submission,
}: {
	submission: HostParticipantStanding['submission']
}) {
	const { t } = useTranslation()

	if (!submission) return null

	return (
		<div className='flex w-full items-center justify-center'>
			{submission.submittedAt ? (
				<motion.span
					initial={{ scale: 0.4, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ duration: 0.32, ease: EASE }}
					className={`grid h-7 w-7 place-items-center rounded-full ${
						submission.isCorrect
							? 'bg-emerald-100 text-emerald-700'
							: 'bg-rose-100 text-rose-600'
					}`}
				>
					{submission.isCorrect ? (
						<Check
							aria-label={t('multiplayer.game.correctMark')}
							size={15}
							strokeWidth={3}
						/>
					) : (
						<X
							aria-label={t('multiplayer.game.incorrectMark')}
							size={15}
							strokeWidth={3}
						/>
					)}
				</motion.span>
			) : null}
		</div>
	)
}

function ParticipantRow({
	standing,
	showSubmission,
	startedAt,
}: {
	standing: HostParticipantStanding
	showSubmission: boolean
	startedAt: number
}) {
	return (
		<motion.div
			layout
			transition={{
				layout: ROW_LAYOUT_TRANSITION,
			}}
			className={cn(
				'grid grid-cols-[1rem_minmax(10rem,1fr)_5rem_6rem_5rem] items-center gap-2 rounded-lg border-slate-200 px-4 py-3 hover:bg-gray-100 transition-colors',
				standing.connected ? 'bg-gray-50' : 'bg-gray-200/80',
			)}
		>
			<div className='text-base sm:text-xl font-bold text-gray-600'>
				{standing.rank}
			</div>

			<div className='flex items-center gap-2 min-w-auto'>
				<PlayerBadge name={standing.name} connected={standing.connected} />
				<p
					className={`truncate text-sm sm:text-base font-semibold ${standing.connected ? 'text-gray-800' : 'text-gray-400'}`}
				>
					{standing.name}
				</p>
			</div>

			<div className='text-gray-800 font-semibold text-center'>
				{standing.correctCount}
			</div>

			<AnimatedScore
				score={standing.score}
				submission={standing.submission}
			/>

			<div className='flex items-center justify-end gap-2'>
				{showSubmission ? (
					<SubmissionMark submission={standing.submission} />
				) : (
					<AnswerProgress
						startedAt={startedAt}
						submittedAt={standing.submittedAt}
					/>
				)}
			</div>
		</motion.div>
	)
}

export function ActiveGameHostScreen({
	game,
	actionErrorMessage,
	isReconnecting,
	members,
	advancePending,
	revealPending,
	onAdvanceRound,
	onRevealRound,
}: ActiveGameHostScreenProps) {
	const { t } = useTranslation()
	const language = useCurrentLocale()
	const currentRound = getCurrentRound(game)
	if (game.phase === 'completed' || !currentRound) {
		return (
			<main className='grid h-full place-items-center bg-slate-950 px-5 py-8 text-white'>
				<p className='text-sm font-semibold text-slate-300'>
					{t('multiplayer.game.finishing')}
				</p>
			</main>
		)
	}

	const isLastRound = game.currentQuestionNumber === game.questionCount
	const standings = getHostStandings(game, members)
	const showSubmission = game.phase !== 'open'
	const targetCountry = getTargetCountryInfo(game)
	const targetName = targetCountry
		? getCountryName(targetCountry, language)
		: t('multiplayer.game.countryFallback')

	return (
		<div className='fixed inset-0 overflow-x-hidden overflow-y-scroll bg-white'>
			<AnimatePresence mode='wait'>
				{isReconnecting ? (
					<FloatingNotice>
						{t('multiplayer.lobby.reconnecting')}
					</FloatingNotice>
				) : null}
			</AnimatePresence>

			<AnimatePresence mode='wait'>
				{actionErrorMessage ? (
					<FloatingNotice
						tone='error'
						offsetTop={isReconnecting ? 'stacked' : 'default'}
					>
						{actionErrorMessage}
					</FloatingNotice>
				) : null}
			</AnimatePresence>

			<div className='absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl rounded-b-[26px] border border-white/70 bg-white/94 p-5 text-center shadow-[0_0_20px_rgba(15,23,42,0.2)]'>
				<p className='text-[11px] font-black uppercase tracking-[0.22em] text-amber-700'>
					{t('multiplayer.game.questionProgress', {
						current: game.currentQuestionNumber,
						total: game.questionCount,
					})}
				</p>
				<div className='mt-3'>
					<h3 className='text-xl font-black tracking-tight text-balance text-slate-950 sm:text-2xl'>
						{game.phase === 'open'
							? t('multiplayer.game.findCountry')
							: t('multiplayer.game.correctAnswer')}
					</h3>
					<h1
						className={cn(
							'text-2xl font-black tracking-tight text-balance sm:text-4xl',
							game.phase === 'open' ? 'text-blue-400' : 'text-green-400',
						)}
					>
						{targetName}
					</h1>
				</div>

				{game.phase === 'open' ? (
					<div className='mt-4 flex items-center justify-center gap-2 text-sm font-bold text-slate-500'>
						<Users aria-hidden='true' size={16} />
						{t('multiplayer.game.answeredProgress', {
							answered: game.answeredCount,
							total: game.participantCount,
						})}
					</div>
				) : null}
			</div>

			<div className='h-full min-h-150 flex flex-col items-center justify-between gap-10'>
				<div className='w-full max-w-3xl min-h-20 mt-50 px-5 overflow-x-scroll'>
					<div className='flex flex-col space-y-2.5 min-w-lg'>
						<div className='grid grid-cols-[1rem_minmax(10rem,1fr)_5rem_6rem_5rem] items-center gap-2 rounded-md px-4 py-3 mb-3 text-[12px] uppercase font-extrabold text-white bg-slate-600'>
							<div className=''>
								<HashIcon className='size-3 sm:size-4 stroke-4' />
							</div>

							<div className='ml-11 text-start text-base sm:text-lg'>
								{t('multiplayer.game.playerColumn')}
							</div>

							<div className='text-center'>
								{t('multiplayer.game.correctColumn')}
							</div>

							<div className='text-center'>
								{t('multiplayer.game.scoreColumn')}
							</div>

							<div className='text-center'>
								{!showSubmission
									? t('multiplayer.game.answeredColumn')
									: t('multiplayer.game.answerColumn')}
							</div>
						</div>

						<AnimatePresence>
							{standings.map(standing => (
								<ParticipantRow
									key={standing.participantId}
									standing={standing}
									startedAt={game.startedAt}
									showSubmission={showSubmission}
								/>
							))}
						</AnimatePresence>
					</div>
				</div>

				<div className='mb-10'>
					{game.phase === 'open' ? (
						<Button
							className='flex items-center justify-center'
							variant='amber'
							is3d
							disabled={revealPending}
							onClick={() => onRevealRound()}
						>
							{revealPending ? (
								<LoaderIcon className='animate-spin' />
							) : (
								<>{t('multiplayer.game.revealAnswer')}</>
							)}
						</Button>
					) : (
						<Button
							className='flex items-center justify-center'
							variant={isLastRound ? 'indigo' : 'teal'}
							is3d
							disabled={advancePending}
							onClick={() => onAdvanceRound()}
						>
							{advancePending ? (
								<LoaderIcon className='animate-spin' />
							) : isLastRound ? (
								t('multiplayer.game.finishGame')
							) : (
								t('multiplayer.game.nextRound')
							)}
						</Button>
					)}
				</div>
			</div>
		</div>
	)
}
