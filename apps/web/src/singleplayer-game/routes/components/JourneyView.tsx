import { motion, useReducedMotion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { FlagImage } from '@/shared/widgets/FlagImage'
import { cn } from '@/shared/utils'

const OUTLINED_DARK =
	'[paint-order:stroke_fill] [-webkit-text-stroke:3.5px_var(--color-ink)]'
const COUNTER_OUTLINE =
	'[paint-order:stroke_fill] [-webkit-text-stroke:5px_var(--counter-edge)]'
const SHAKE = [0, -6, 6, -4, 4, 0]
const SHAFT = 'M5 11h45'
const HEAD = 'M39 4l11 7-11 7'
const GRID =
	'route-journey grid grid-cols-[minmax(0,9rem)_auto_minmax(0,9rem)] items-start justify-center gap-2'
const COUNT_CLASS =
	'font-black whitespace-nowrap text-white tabular-nums [--counter-edge:var(--color-ink)]'
const SCORE_CLASS = cn(COUNTER_OUTLINE, 'text-3xl sm:text-4xl')
const PAR_CLASS = cn(COUNTER_OUTLINE, 'text-xl text-[#dfe3ea] sm:text-2xl')

const RISE_S = 0.35
const DRAW_S = 0.35
const ARRIVE_S = RISE_S + DRAW_S
const TARGET_AT_S = ARRIVE_S - 0.05
const TARGET_SETTLE_S = 0.35
const COUNT_AT_S = TARGET_AT_S + TARGET_SETTLE_S

const RISE = {
	initial: { y: 24, opacity: 0 },
	animate: { y: 0, opacity: 1 },
	transition: { duration: RISE_S, ease: 'easeOut' },
} as const
const POP_IN = {
	initial: { scale: 0.6, opacity: 0 },
	animate: { scale: 1, opacity: 1 },
	transition: {
		type: 'spring',
		stiffness: 500,
		damping: 24,
		delay: TARGET_AT_S,
		opacity: { duration: 0.12, delay: TARGET_AT_S },
	},
} as const

export interface JourneyEnd {
	name: string
	flagUrl?: string
}

interface JourneyViewProps {
	start: JourneyEnd
	target: JourneyEnd
	score: number
	par: number
	arrow: 'above' | 'below'
	title?: string
	className?: string
}

export function JourneyView({
	start,
	target,
	score,
	par,
	arrow,
	title,
	className,
}: JourneyViewProps) {
	return (
		<div className={cn(GRID, className)}>
			{title ? <h1 className='sr-only'>{title}</h1> : null}
			<Endpoint part='start' end={start} />
			<Middle arrow={arrow}>
				<ScoreCount score={score} par={par} />
				<JourneyArrow />
			</Middle>
			<Endpoint part='target' end={target} />
		</div>
	)
}

export function IntroJourneyView({
	start,
	target,
	par,
	arrow,
	onShown,
}: {
	start: JourneyEnd
	target: JourneyEnd
	par: number
	arrow: 'above' | 'below'
	onShown: () => void
}) {
	return (
		<div aria-hidden='true' className={GRID}>
			<Endpoint part='start' end={start} motionProps={RISE} />
			<Middle arrow={arrow}>
				<motion.p
					className={COUNT_CLASS}
					initial={{ y: 12, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{
						duration: 0.3,
						ease: 'easeOut',
						delay: COUNT_AT_S,
					}}
					onAnimationComplete={onShown}
				>
					<span className={cn('inline-block', SCORE_CLASS)}>0</span>
					<span className={PAR_CLASS}> / {par}</span>
				</motion.p>
				<JourneyArrow drawn />
			</Middle>
			<Endpoint part='target' end={target} motionProps={POP_IN} />
		</div>
	)
}

function Middle({
	arrow,
	children,
}: {
	arrow: 'above' | 'below'
	children: ReactNode
}) {
	return (
		<div
			data-part='middle'
			className={cn(
				'flex items-center gap-0.5 pt-1',
				arrow === 'above' ? 'flex-col-reverse' : 'flex-col',
			)}
		>
			{children}
		</div>
	)
}

function ScoreCount({
	score,
	par,
	className,
}: {
	score: number
	par: number
	className?: string
}) {
	const { t } = useTranslation()
	const reduceMotion = useReducedMotion()
	const [lastScore, setLastScore] = useState(score)
	const [changed, setChanged] = useState(false)
	if (lastScore !== score) {
		setLastScore(score)
		setChanged(true)
	}
	const animated = changed && !reduceMotion
	const over = score > par

	return (
		<p className={cn(COUNT_CLASS, className)}>
			<span className='sr-only'>
				{t('routes.scoreLabel', { score, par })}
			</span>
			<motion.span
				key={score}
				aria-hidden='true'
				initial={!animated ? false : over ? { x: 0 } : { scale: 1.3 }}
				animate={animated && over ? { x: SHAKE } : { scale: 1 }}
				transition={
					over
						? { duration: 0.35, ease: 'easeOut' }
						: { type: 'spring', stiffness: 600, damping: 22 }
				}
				style={{ originX: 1, originY: 1 }}
				className={cn(
					'inline-block',
					SCORE_CLASS,
					score > par && 'text-[#f44f3c]',
				)}
			>
				{score}
			</motion.span>
			<span aria-hidden='true' className={PAR_CLASS}>
				{' '}
				/ {par}
			</span>
		</p>
	)
}

function Endpoint({
	part,
	end: { name, flagUrl },
	motionProps,
}: {
	part: 'start' | 'target'
	end: JourneyEnd
	motionProps?: typeof RISE | typeof POP_IN
}) {
	return (
		<motion.div
			{...motionProps}
			data-part={part}
			aria-hidden='true'
			className='flex min-w-0 flex-col items-center gap-1.5'
		>
			{flagUrl ? (
				<FlagImage
					src={flagUrl}
					alt=''
					className='aspect-[auto_3/2] h-9 w-auto rounded-[5px] border-2 border-white bg-white shadow-[0_4px_10px_-2px_rgb(24_34_61/0.4)] sm:h-11'
				/>
			) : null}
			<span
				className={cn(
					'line-clamp-2 px-1 py-0.5 text-center text-base leading-tight font-extrabold text-white sm:text-lg',
					OUTLINED_DARK,
				)}
			>
				{name}
			</span>
		</motion.div>
	)
}

function JourneyArrow({ drawn = false }: { drawn?: boolean }) {
	const shaft = drawn
		? ({
				initial: { pathLength: 0, opacity: 0 },
				animate: { pathLength: 1, opacity: 1 },
				transition: {
					duration: DRAW_S,
					ease: 'easeInOut',
					delay: RISE_S,
					opacity: { duration: 0.05, delay: RISE_S },
				},
			} as const)
		: {}
	const head = drawn
		? ({
				initial: { pathLength: 0, opacity: 0 },
				animate: { pathLength: 1, opacity: 1 },
				transition: { duration: 0.12, delay: ARRIVE_S - 0.06 },
			} as const)
		: {}

	return (
		<svg
			aria-hidden='true'
			viewBox='0 0 58 22'
			className='h-5.5 w-14.5 overflow-visible'
			fill='none'
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<motion.path d={SHAFT} stroke='white' strokeWidth='9' {...shaft} />
			<motion.path d={HEAD} stroke='white' strokeWidth='9' {...head} />
			<motion.path
				d={SHAFT}
				stroke='var(--color-ocean-500)'
				strokeWidth='4.5'
				{...shaft}
			/>
			<motion.path
				d={HEAD}
				stroke='var(--color-ocean-500)'
				strokeWidth='4.5'
				{...head}
			/>
		</svg>
	)
}
