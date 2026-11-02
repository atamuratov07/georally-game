import { animate } from 'motion'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const SCORE_VISIBLE_DURATION_MS = 3000
const ENTER_DURATION_S = 0.4
const ENTER_DURATION_MS = ENTER_DURATION_S * 1000
const SCORE_EASE = [0.22, 1, 0.36, 1] as const
const AWARD_REVEAL_DELAY_MS = 0.2
const AWARD_VISIBLE_DURATION_MS = 800
const SCORE_COUNT_DURATION_S = 0.72

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

function CorrectMark() {
	return (
		<svg
			viewBox='0 0 512 444.81'
			fill='currentColor'
			aria-hidden='true'
			className='h-12 w-[3.4rem] translate-x-2 text-emerald-400 sm:h-14 sm:w-16'
		>
			<path d='M104.42 183.22c31.76 18.29 52.42 33.49 77.03 60.61C245.27 141.1 314.54 84.19 404.62 3.4l8.81-3.4H512C379.83 146.79 277.36 267.82 185.61 444.81 137.84 342.68 95.26 272.18 0 206.81l104.42-23.59z' />
		</svg>
	)
}

function IncorrectMark() {
	return (
		<svg
			viewBox='0 0 477 512.55'
			fill='none'
			aria-hidden='true'
			className='h-12 w-[3.2rem] text-rose-500 drop-shadow-[0_10px_28px_rgba(15,23,42,0.28)] sm:h-14 sm:w-[3.7rem]'
		>
			<path
				fill='currentColor'
				d='M366.76 187.49c-24.98 25.3-46.02 46.99-64.72 66.8 41.13 47.31 82.57 91.21 159.57 160.49 10.58 9.52 16.34 18.15 15.26 26.89-1.12 9.04-8.97 16.03-25.51 21.42l-.54.14c-105.31 34.11-91.92 13.16-158.66-68.87-21.91-24.69-40.46-46.2-57.13-65.72-37.96 44.38-74.46 91.19-133.98 166.84-8.81 11.19-17.04 17.5-25.83 17.01-9.1-.52-16.59-7.89-23.06-24.05l-.18-.52c-40.96-102.84-19.2-90.84 58.26-162.86 24.98-25.3 46.02-46.99 64.72-66.8-41.13-47.31-82.57-91.2-159.57-160.49C4.81 88.25-.95 79.62.13 70.88c1.12-9.04 8.97-16.03 25.51-21.42l.54-.14c105.31-34.11 91.92-13.16 158.66 68.87 21.9 24.69 40.46 46.2 57.13 65.72 37.96-44.38 74.46-91.19 133.98-166.84C384.76 5.88 392.99-.43 401.78.06c9.1.52 16.59 7.89 23.06 24.05l.18.52c40.96 102.84 19.2 90.84-58.26 162.86z'
			/>
		</svg>
	)
}

function ScoreMark({ isCorrect }: { isCorrect: boolean }) {
	return isCorrect ? <CorrectMark /> : <IncorrectMark />
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

		awardRevealTimeoutId = setTimeout(() => {
			setShowAward(true)

			awardHideTimeoutId = setTimeout(() => {
				setShowAward(false)

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
			className={`pointer-events-none absolute top-3 left-1/2 z-20 -translate-x-1/2 select-none ${className ?? ''}`}
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
					<div
						key={snapshot.key}
						className='relative text-center text-white'
					>
						<motion.div
							aria-hidden='true'
							className='absolute top-1/2 left-1/2 -z-10 h-40 w-28 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-slate-950/85 blur-2xl'
							initial={{ opacity: 0, scale: 0.1 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.1 }}
							transition={{
								duration: ENTER_DURATION_S,
								ease: SCORE_EASE,
							}}
						/>

						<motion.div
							className='flex justify-center'
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{
								duration: ENTER_DURATION_S,
								ease: SCORE_EASE,
							}}
						>
							{snapshot.isCorrect !== null ? (
								<ScoreMark isCorrect={snapshot.isCorrect} />
							) : null}
						</motion.div>

						<motion.div
							className='relative mx-auto mt-6 w-fit tabular-nums text-white'
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{
								duration: ENTER_DURATION_S,
								ease: SCORE_EASE,
							}}
						>
							<p className='-mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400'>
								{t('score.yourScore')}
							</p>
							<p className='text-[clamp(1.5rem,8vw,2.5rem)] font-black'>
								{score}
							</p>

							{showAward ? (
								<motion.p
									initial={{ opacity: 0, x: 12 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{
										duration: 0.28,
										ease: SCORE_EASE,
									}}
									className='absolute top-1/2 left-full -translate-y-1/2 text-xl font-black text-amber-300'
								>
									{formatAwardedScore(snapshot.awardedScore)}
								</motion.p>
							) : null}
						</motion.div>
					</div>
				) : null}
			</AnimatePresence>
		</div>
	)
}
