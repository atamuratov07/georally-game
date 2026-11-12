import { animate, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { burst } from '@/shared/lib/confetti'
import { SCORE_TEXT } from './scoreText'

const POP_MS = 320
const COUNT_S = 1.1
const HOLD_MS = 400

interface FinalScoreProps {
	found: number
	total: number
	onDone: () => void
}

export function FinalScore({ found, total, onDone }: FinalScoreProps) {
	const { t } = useTranslation()
	const reduceMotion = useReducedMotion()
	const scoreRef = useRef<HTMLParagraphElement>(null)
	const [shown, setShown] = useState(reduceMotion ? found : 0)

	useEffect(() => {
		let doneTimer: number | undefined
		let stopCount: (() => void) | undefined
		const finish = () => {
			doneTimer = window.setTimeout(onDone, HOLD_MS)
		}

		if (reduceMotion || found === 0) {
			finish()
			return () => clearTimeout(doneTimer)
		}

		const startTimer = window.setTimeout(() => {
			const box = scoreRef.current?.getBoundingClientRect()
			if (box) {
				burst({
					x: (box.left + box.width / 2) / window.innerWidth,
					y: (box.top + box.height / 2) / window.innerHeight,
				})
			}
			stopCount = animate(0, found, {
				duration: COUNT_S,
				ease: [0.22, 1, 0.36, 1],
				onUpdate: latest => {
					const value = Math.round(latest)
					setShown(value)
					if (value === found && doneTimer === undefined) finish()
				},
			}).stop
		}, POP_MS)

		return () => {
			clearTimeout(startTimer)
			clearTimeout(doneTimer)
			stopCount?.()
		}
	}, [found, onDone, reduceMotion])

	return (
		<div className='absolute inset-0 z-40 grid animate-in place-items-center bg-ink/30 px-4 fade-in [view-transition-name:sprint-backdrop]'>
			<p
				ref={scoreRef}
				role='status'
				className='animate-pop-in text-[clamp(3rem,16vw,8rem)] font-black text-sunflower-300 tabular-nums [view-transition-name:sprint-score]'
				style={SCORE_TEXT}
			>
				<span aria-hidden='true'>
					{shown} / {total}
				</span>
				<span className='sr-only'>
					{t('recallSprint.found', { found, total })}
				</span>
			</p>
		</div>
	)
}
