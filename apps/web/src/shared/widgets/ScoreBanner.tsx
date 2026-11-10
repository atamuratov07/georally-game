import { animate } from 'motion'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils'
import { outlinedText } from './outlinedText'

const SCORE_VISIBLE_DURATION_MS = 2400
const ENTER_DURATION_S = 0.4
const ENTER_DURATION_MS = ENTER_DURATION_S * 1000
const SCORE_EASE = [0.22, 1, 0.36, 1] as const
const AWARD_REVEAL_DELAY_MS = 200
const AWARD_VISIBLE_DURATION_MS = 800
const SCORE_COUNT_DURATION_S = 0.72

/** Written the way a hand draws them: the check left to right, the cross top-left stroke first. */
const CHECK_STROKES = ['M4 12.5 9.5 18 20 6']
const CROSS_STROKES = ['M6 6 18 18', 'M18 6 6 18']
const DRAW_START_S = 0.12
const STROKE_DURATION_S = { check: 0.42, cross: 0.2 }
const STROKE_GAP_S = 0.06
const DRAW_EASE = [0.65, 0, 0.35, 1] as const

const OUTLINED_TEXT = outlinedText(8, 6)

type ScoreBannerTriggerKey = number | string

interface ScoreBannerSnapshot {
	key: ScoreBannerTriggerKey
	isCorrect: boolean | null
	totalScore: number
	awardedScore: number
}

interface ScoreBannerProps {
	triggerKey: ScoreBannerTriggerKey | null
	isCorrect: boolean | null
	totalScore: number
	awardedScore: number
	durationMs?: number
	className?: string
}

function formatAwardedScore(scoreDelta: number): string {
	return scoreDelta >= 0 ? `+${scoreDelta}` : String(scoreDelta)
}

function ResultMark({ isCorrect }: { isCorrect: boolean }) {
	const { t } = useTranslation()
	const strokes = isCorrect ? CHECK_STROKES : CROSS_STROKES
	const strokeDuration = STROKE_DURATION_S[isCorrect ? 'check' : 'cross']
	const drawEnd =
		DRAW_START_S +
		strokes.length * strokeDuration +
		(strokes.length - 1) * STROKE_GAP_S
	const layers = [
		{
			width: 7,
			offsetY: 1.3,
			className: isCorrect ? 'stroke-grass-800' : 'stroke-coral-800',
		},
		{ width: 7, offsetY: 0, className: 'stroke-white' },
		{
			width: 4,
			offsetY: 0,
			className: isCorrect ? 'stroke-grass-500' : 'stroke-coral-500',
		},
	]

	return (
		<motion.span
			role='img'
			aria-label={isCorrect ? t('game.correct') : t('game.incorrect')}
			className='relative block size-24 sm:size-28'
			initial={{ scale: 0.6, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={{ type: 'spring', stiffness: 520, damping: 24 }}
		>
			<motion.svg
				viewBox='0 0 24 24'
				fill='none'
				strokeLinecap='round'
				strokeLinejoin='round'
				className='size-full overflow-visible'
				animate={
					isCorrect
						? { scale: [1, 1.14, 1] }
						: { x: [0, -9, 9, -6, 6, -3, 0] }
				}
				transition={{
					delay: drawEnd,
					duration: isCorrect ? 0.3 : 0.42,
					ease: 'easeOut',
				}}
			>
				{layers.map(layer =>
					strokes.map((d, index) => {
						const delay =
							DRAW_START_S + index * (strokeDuration + STROKE_GAP_S)
						return (
							<motion.path
								key={`${layer.className}-${d}`}
								d={d}
								strokeWidth={layer.width}
								transform={`translate(0 ${layer.offsetY})`}
								className={layer.className}
								initial={{ pathLength: 0, opacity: 0 }}
								animate={{ pathLength: 1, opacity: 1 }}
								transition={{
									pathLength: {
										delay,
										duration: strokeDuration,
										ease: DRAW_EASE,
									},
									opacity: { delay, duration: 0.01 },
								}}
							/>
						)
					}),
				)}
			</motion.svg>
		</motion.span>
	)
}

export function ScoreBanner({
	triggerKey,
	totalScore,
	isCorrect,
	awardedScore,
	durationMs = SCORE_VISIBLE_DURATION_MS,
	className,
}: ScoreBannerProps) {
	const { t } = useTranslation()
	const [snapshot, setSnapshot] = useState<ScoreBannerSnapshot | null>(null)
	const [isVisible, setIsVisible] = useState(false)
	const lastTriggerKeyRef = useRef<ScoreBannerTriggerKey | null>(null)
	const [score, setScore] = useState(totalScore - awardedScore)
	const [showAward, setShowAward] = useState(false)
	const [bumpCount, setBumpCount] = useState(0)

	useEffect(() => {
		if (triggerKey === null) {
			setIsVisible(false)
			return
		}

		if (triggerKey === lastTriggerKeyRef.current) {
			return
		}

		lastTriggerKeyRef.current = triggerKey
		setSnapshot({
			key: triggerKey,
			totalScore,
			isCorrect,
			awardedScore,
		})
		setIsVisible(true)

		const hideTimeoutId = setTimeout(() => {
			setIsVisible(false)
		}, durationMs)

		return () => {
			clearTimeout(hideTimeoutId)
		}
	}, [awardedScore, durationMs, isCorrect, totalScore, triggerKey])

	useEffect(() => {
		if (!isVisible || !snapshot) {
			setShowAward(false)
			return
		}

		const initialScore = snapshot.totalScore - snapshot.awardedScore
		const awardRevealAt = ENTER_DURATION_MS + AWARD_REVEAL_DELAY_MS
		let awardRevealTimeoutId = 0
		let awardHideTimeoutId = 0
		let stopCounting: (() => void) | undefined

		setScore(initialScore)
		setShowAward(false)

		if (snapshot.awardedScore === 0) {
			setScore(snapshot.totalScore)
			return
		}

		awardRevealTimeoutId = window.setTimeout(() => {
			setShowAward(true)

			awardHideTimeoutId = window.setTimeout(() => {
				setShowAward(false)
				setBumpCount(count => count + 1)

				stopCounting = animate(initialScore, snapshot.totalScore, {
					duration: SCORE_COUNT_DURATION_S,
					ease: SCORE_EASE,
					onUpdate: latest => {
						setScore(Math.round(latest))
					},
				}).stop
			}, AWARD_VISIBLE_DURATION_MS)
		}, awardRevealAt)

		return () => {
			clearTimeout(awardRevealTimeoutId)
			clearTimeout(awardHideTimeoutId)
			stopCounting?.()
		}
	}, [isVisible, snapshot])

	if (!snapshot) {
		return null
	}

	return (
		<div
			className={cn(
				'pointer-events-none absolute top-6 left-1/2 z-20 -translate-x-1/2 select-none',
				className,
			)}
		>
			<AnimatePresence
				mode='wait'
				onExitComplete={() => {
					if (!isVisible) {
						setSnapshot(null)
					}
				}}
			>
				{isVisible ? (
					<motion.div
						key={snapshot.key}
						className='relative flex flex-col items-center'
						initial={{ opacity: 0, y: -12 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -16, scale: 0.9 }}
						transition={{ duration: ENTER_DURATION_S, ease: SCORE_EASE }}
					>
						{snapshot.isCorrect !== null ? (
							<ResultMark isCorrect={snapshot.isCorrect} />
						) : null}

						<div className='relative mt-1'>
							<motion.p
								key={bumpCount}
								aria-label={`${t('game.score')}: ${snapshot.totalScore}`}
								className='text-5xl font-black text-white tabular-nums sm:text-6xl'
								style={OUTLINED_TEXT}
								animate={
									bumpCount > 0 ? { scale: [1, 1.3, 1] } : undefined
								}
								transition={{ duration: 0.45, ease: 'easeOut' }}
							>
								{score}
							</motion.p>

							<AnimatePresence>
								{showAward ? (
									<motion.span
										key='award'
										aria-hidden='true'
										className='absolute top-1/2 left-full ml-5 -translate-y-1/2 text-3xl font-black whitespace-nowrap text-sunflower-300 tabular-nums sm:text-4xl'
										style={OUTLINED_TEXT}
										initial={{ opacity: 0, scale: 0.4, x: 16 }}
										animate={{ opacity: 1, scale: 1, x: 0 }}
										exit={{
											opacity: 0,
											scale: 0.4,
											x: -48,
											transition: { duration: 0.3, ease: 'easeIn' },
										}}
										transition={{
											type: 'spring',
											stiffness: 520,
											damping: 16,
										}}
									>
										{formatAwardedScore(snapshot.awardedScore)}
									</motion.span>
								) : null}
							</AnimatePresence>
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</div>
	)
}
