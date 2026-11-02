import type { GameHostView } from '@georally/game-domain/multiplayer/game'
import type { VisibleMemberInfo } from '@georally/game-domain/multiplayer/room'
import { Check, UsersRound, X } from 'lucide-react'
import { animate, type ValueTransition } from 'motion'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from '@/app/LocaleContext'
import { getCountryName } from '@/shared/i18n'
import { StatusScreen } from '@/shared/layout'
import { Avatar, Button, Card } from '@/shared/ui'
import { cn } from '@/shared/utils'
import { GameHud } from '@/shared/widgets/GameHud'
import { RoomNotices } from '@/shared/widgets/RoomNotices'
import {
	getCurrentRound,
	getHostStandings,
	getTargetCountryInfo,
	type HostParticipantStanding,
} from '../model/gameSelectors'

const EASE = [0.22, 1, 0.36, 1] as const
const ROW_LAYOUT_TRANSITION = { duration: 0.5, ease: EASE } as ValueTransition
const SCORE_COUNT_DURATION_S = 0.6
const ROW_GRID =
	'grid grid-cols-[2rem_minmax(0,1fr)_3rem_4.5rem_4.5rem] items-center gap-2 sm:grid-cols-[2.5rem_minmax(0,1fr)_4rem_6rem_6rem] sm:gap-3'

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

function AnimatedScore({ score }: { score: number }) {
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

	return <span className='tabular-nums'>{display}</span>
}

function formatAnswerTime(ms: number): string {
	const totalSeconds = Math.max(0, Math.floor(ms / 1000))
	return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
}

function AnswerProgress({
	startedAt,
	submittedAt,
}: {
	startedAt: number
	submittedAt: number | null
}) {
	return submittedAt ? (
		<span className='inline-flex items-center gap-1.5 rounded-full bg-sunflower-100 px-2 py-0.5 text-sm font-black text-sunflower-800 tabular-nums'>
			<span
				aria-hidden='true'
				className='size-2 rounded-full bg-sunflower-500'
			/>
			{formatAnswerTime(submittedAt - startedAt)}
		</span>
	) : (
		<span aria-hidden='true' className='size-3 rounded-full bg-line-strong' />
	)
}

function SubmissionResult({
	submission,
}: {
	submission: HostParticipantStanding['submission']
}) {
	const { t } = useTranslation()

	if (!submission?.submittedAt) {
		return (
			<span className='text-sm font-bold text-muted'>
				{t('game.noAnswer')}
			</span>
		)
	}

	const Icon = submission.isCorrect ? Check : X

	return (
		<motion.span
			initial={{ scale: 0.4, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={{ duration: 0.32, ease: EASE }}
			className='inline-flex items-center gap-1.5'
		>
			<span
				role='img'
				aria-label={
					submission.isCorrect ? t('game.correct') : t('game.incorrect')
				}
				className={cn(
					'grid size-7 place-items-center rounded-full text-white',
					submission.isCorrect ? 'bg-grass-500' : 'bg-coral-500',
				)}
			>
				<Icon aria-hidden='true' className='size-4' strokeWidth={3.5} />
			</span>
			{submission.isCorrect ? (
				<span className='text-sm font-black text-grass-600 tabular-nums'>
					+{submission.scoreAwarded}
				</span>
			) : null}
		</motion.span>
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
		<motion.li
			layout
			transition={{ layout: ROW_LAYOUT_TRANSITION }}
			className={cn(ROW_GRID, 'px-3 py-2.5')}
		>
			<span className='text-center text-lg font-black text-muted tabular-nums'>
				{standing.rank}
			</span>
			<span
				className={cn(
					'flex min-w-0 items-center gap-2.5',
					!standing.connected && 'opacity-55',
				)}
			>
				<Avatar
					name={standing.name}
					size='sm'
					offline={!standing.connected}
				/>
				<span className='truncate font-extrabold'>{standing.name}</span>
			</span>
			<span className='text-center font-extrabold tabular-nums'>
				{standing.correctCount}
			</span>
			<span className='text-center text-xl font-black text-ocean-600'>
				<AnimatedScore score={standing.score} />
			</span>
			<span className='flex justify-center'>
				{showSubmission ? (
					<SubmissionResult submission={standing.submission} />
				) : (
					<AnswerProgress
						startedAt={startedAt}
						submittedAt={standing.submittedAt}
					/>
				)}
			</span>
		</motion.li>
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
		return <StatusScreen title={t('multiplayer.game.finishing')} />
	}

	const isOpen = game.phase === 'open'
	const isLastRound = game.currentQuestionNumber === game.questionCount
	const standings = getHostStandings(game, members)
	const targetCountry = getTargetCountryInfo(game)
	const targetName = targetCountry
		? getCountryName(targetCountry, language)
		: t('game.countryFallback')

	return (
		<div className='fixed inset-0 flex flex-col bg-paper'>
			<RoomNotices
				isReconnecting={isReconnecting}
				actionErrorMessage={actionErrorMessage}
			/>

			<GameHud
				current={game.currentQuestionNumber}
				total={game.questionCount}
				completed={game.currentQuestionNumber - (isOpen ? 1 : 0)}
				targetName={targetName}
				targetFlagUrl={targetCountry?.flagUrl}
				end={
					isOpen ? (
						<span
							className='inline-flex items-center gap-1.5 px-1 text-xl font-black text-ocean-300 tabular-nums'
							aria-label={t('multiplayer.game.answered', {
								answered: game.answeredCount,
								total: game.participantCount,
							})}
						>
							<UsersRound
								aria-hidden='true'
								className='size-5'
								strokeWidth={2.75}
							/>
							{game.answeredCount}/{game.participantCount}
						</span>
					) : null
				}
			/>

			<main className='min-h-0 flex-1 overflow-y-auto px-3 pt-5 pb-32 sm:px-6'>
				<Card className='mx-auto w-full max-w-3xl p-3 sm:p-4'>
					<div
						className={cn(
							ROW_GRID,
							'px-3 pb-2 text-xs font-extrabold text-muted uppercase',
						)}
					>
						<span className='text-center'>#</span>
						<span>{t('multiplayer.game.player')}</span>
						<span className='text-center'>{t('game.correct')}</span>
						<span className='text-center'>
							{t('multiplayer.game.points')}
						</span>
						<span className='text-center'>
							{t('multiplayer.game.status')}
						</span>
					</div>
					<ol className='flex flex-col divide-y-2 divide-line'>
						{standings.map(standing => (
							<ParticipantRow
								key={standing.participantId}
								standing={standing}
								startedAt={game.startedAt}
								showSubmission={!isOpen}
							/>
						))}
					</ol>
				</Card>
			</main>

			<div className='fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-white/92 backdrop-blur'>
				<div className='mx-auto flex max-w-3xl justify-center px-4 pt-3 pb-4'>
					{isOpen ? (
						<Button
							size='lg'
							className='w-full sm:w-auto sm:min-w-64'
							pending={revealPending}
							onClick={() => void onRevealRound()}
						>
							{t('multiplayer.game.revealAnswer')}
						</Button>
					) : (
						<Button
							size='lg'
							variant={isLastRound ? 'grape' : 'ocean'}
							className='w-full sm:w-auto sm:min-w-64'
							pending={advancePending}
							onClick={() => void onAdvanceRound()}
						>
							{isLastRound
								? t('multiplayer.game.finishGame')
								: t('multiplayer.game.nextRound')}
						</Button>
					)}
				</div>
			</div>
		</div>
	)
}
