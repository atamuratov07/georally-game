import type { GameDifficulty } from '@georally/game-domain'
import {
	getScore,
	isPerfect,
	type FinishedRouteState,
	type RouteEnds,
} from '@georally/game-domain/singleplayer/routes'
import { Lock } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { getDifficultyLabel } from '@/shared/i18n'
import { cn } from '@/shared/utils'
import './ticket.css'

const SPRING = { type: 'spring', stiffness: 260, damping: 20 } as const
const POP = { type: 'spring', stiffness: 480, damping: 15 } as const
const OUTLINE =
	'[paint-order:stroke_fill] [-webkit-text-stroke:var(--stroke)_var(--color-ink)]'
const BEAD_DELAY = 0.45
const BEAD_STEP = 0.06

function numberSize(number: number) {
	return number < 100
		? 'text-[5.5rem]'
		: number < 1000
			? 'text-[4.75rem]'
			: 'text-[4rem]'
}

const TEAR_TIMES = [0, 0.3, 0.38, 0.6, 0.8, 1]
const HOLES = 48
const HOLE_SAMPLES = 6
const HOLE_PITCH = 7
const HOLE_RADIUS = 1.6

function seamClips() {
	const samples = HOLES * HOLE_SAMPLES
	const points = Array.from({ length: samples + 1 }, (_, i) => {
		const near =
			Math.abs((i % HOLE_SAMPLES) - HOLE_SAMPLES / 2) *
			(HOLE_PITCH / HOLE_SAMPLES)
		const bite =
			near < HOLE_RADIUS ? Math.sqrt(HOLE_RADIUS ** 2 - near ** 2) : 0
		return {
			x: `${((i / samples) * 100).toFixed(3)}%`,
			bite: bite.toFixed(2),
		}
	})
	const top = points
		.map(({ x, bite }) => `${x} calc(100% - ${bite}px)`)
		.reverse()
	const stub = points.map(({ x, bite }) => `${x} ${bite}px`)
	return {
		top: `polygon(0 0, 100% 0, ${top.join(', ')})`,
		stub: `polygon(${stub.join(', ')}, 100% 100%, 0 100%)`,
	}
}

const SEAM = seamClips()

const STUB_FALL = [
	[0, 0, 0, 0],
	[2, 5, 4, 0],
	[3, 6, 5, 0],
	[20, 70, 10, 10],
	[8, 220, 3, -8],
	[34, 440, 12, 12],
].map(
	([x, y, turn, tilt]) =>
		`perspective(700px) translate(${x}px, ${y}px) rotate(${turn}deg) rotateX(${tilt}deg)`,
)
const TOP_RECOIL = [0, 3, -1.5, 0.5, 0].map(y => `translateY(${y}px)`)

function revealDelay(par: number) {
	return BEAD_DELAY + Math.min(par, 8) * BEAD_STEP
}

interface DailyTicketProps {
	eyebrow: string
	number: number
	level?: GameDifficulty
	locked?: boolean
	torn?: boolean
	stamp?: ReactNode
	children: ReactNode
}

export function DailyTicket({
	eyebrow,
	number,
	level,
	locked = false,
	torn = false,
	stamp,
	children,
}: DailyTicketProps) {
	const { t } = useTranslation()
	const reduceMotion = useReducedMotion()
	const edges = torn ? SEAM : null

	return (
		<motion.div
			className='relative z-10 w-[calc(100%-1rem)] max-w-sm'
			animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
			transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
			exit={{
				y: 140,
				rotate: 8,
				opacity: 0,
				transition: { duration: 0.35, ease: 'easeIn' },
			}}
		>
			<motion.div
				className='relative [filter:drop-shadow(0_6px_0_var(--color-grass-800))_drop-shadow(0_22px_22px_rgb(24_34_61/0.2))]'
				initial={reduceMotion ? false : { y: 56, rotate: -10, opacity: 0 }}
				animate={{ y: 0, rotate: -2, opacity: 1 }}
				whileHover={reduceMotion || torn ? undefined : { rotate: 0, y: -4 }}
				transition={SPRING}
			>
				<motion.div
					className='daily-ticket-top rounded-t-card bg-grass-500 px-6 pt-5 pb-5 text-white'
					style={{ clipPath: edges?.top }}
					animate={torn ? { transform: TOP_RECOIL } : undefined}
					transition={{
						duration: 1,
						times: [0, 0.38, 0.5, 0.65, 1],
						ease: ['easeIn', 'easeOut', 'easeInOut', 'easeOut'],
					}}
				>
					<div className='flex items-start justify-between gap-3'>
						<p className='pt-1 text-sm font-extrabold tracking-wide text-sunflower-200 uppercase'>
							{eyebrow}
						</p>
						{level ? (
							<p className='shrink-0 rounded-full bg-grass-700/45 px-3 py-1 text-sm font-extrabold'>
								{getDifficultyLabel(t, level)}
							</p>
						) : null}
					</div>
					<p
						aria-hidden='true'
						className='mt-1 flex items-start leading-[0.9] font-black tracking-tight'
					>
						<span
							className={cn(
								OUTLINE,
								'mt-2 mr-1 text-5xl text-sunflower-300 [--stroke:5px]',
							)}
						>
							#
						</span>
						<motion.span
							className={cn(
								OUTLINE,
								numberSize(number),
								'tabular-nums [--stroke:8px] [text-shadow:0_6px_0_var(--color-ink)]',
							)}
							initial={reduceMotion ? false : { scale: 0.3, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ ...POP, delay: 0.2 }}
						>
							{number}
						</motion.span>
					</p>
				</motion.div>
				<motion.div
					className='relative'
					style={{ transformOrigin: '100% 0' }}
					animate={
						torn
							? {
									transform: STUB_FALL,
									opacity: [1, 1, 1, 1, 0.75, 0],
								}
							: undefined
					}
					transition={{
						duration: 1,
						times: TEAR_TIMES,
						ease: ['easeIn', 'linear', 'easeIn', 'easeInOut', 'easeIn'],
					}}
				>
					<div
						className='daily-ticket-stub rounded-b-card border-t-[3px] border-dashed border-grass-300/70 bg-grass-600 px-6 pt-6 pb-6 text-white'
						style={{ clipPath: edges?.stub }}
					>
						{children}
					</div>
					{locked ? <Padlock /> : null}
					{stamp}
				</motion.div>
			</motion.div>
		</motion.div>
	)
}

function Padlock() {
	const reduceMotion = useReducedMotion()

	return (
		<motion.span
			aria-hidden='true'
			className='absolute top-0 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-ink bg-sunflower-400 text-ink shadow-[0_3px_0_var(--color-ink)]'
			animate={reduceMotion ? undefined : { rotate: [0, -14, 12, -6, 0] }}
			transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 2.5 }}
		>
			<Lock className='size-5 stroke-[3]' />
		</motion.span>
	)
}

export function HiddenRoute({
	par,
	solved,
	ends,
}: {
	par: number
	solved: boolean
	ends: RouteEnds | null
}) {
	const { t } = useTranslation()
	const reduceMotion = useReducedMotion()
	const goldAt = (i: number) => revealDelay(par) + 0.25 + i * 0.07

	return (
		<div>
			<div aria-hidden='true' className='flex items-center gap-2'>
				<EndSlot id={ends?.startId} delay={0.3} />
				<div className='relative flex h-6 min-w-0 flex-1 items-center justify-evenly'>
					<span className='absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-ink'>
						{solved ? (
							<motion.span
								className='absolute inset-0 origin-left bg-sunflower-400'
								initial={reduceMotion ? false : { scaleX: 0 }}
								animate={{ scaleX: 1 }}
								transition={{
									delay: goldAt(0),
									duration: par * 0.07 + 0.1,
									ease: 'linear',
								}}
							/>
						) : null}
					</span>
					{Array.from({ length: par }, (_, i) => (
						<motion.span
							key={i}
							className={cn(
								'relative aspect-square overflow-hidden rounded-full border-ink bg-white',
								par > 8 ? 'border-2' : 'border-[3px]',
							)}
							style={{ width: `min(1rem, ${80 / par}%)` }}
							initial={reduceMotion ? false : { scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ ...POP, delay: BEAD_DELAY + i * BEAD_STEP }}
						>
							{solved ? (
								<motion.span
									className='absolute inset-0 bg-sunflower-400'
									initial={reduceMotion ? false : { scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ ...POP, delay: goldAt(i + 1) }}
								/>
							) : null}
						</motion.span>
					))}
				</div>
				<EndSlot id={ends?.targetId} delay={revealDelay(par)} />
			</div>
			<p className='sr-only'>
				{t('daily.between', { count: par })}
				{ends ? null : ` ${t('daily.hidden')}`}
			</p>
		</div>
	)
}

function EndSlot({ id, delay }: { id?: string; delay: number }) {
	const reduceMotion = useReducedMotion()

	return id ? (
		<motion.img
			src={`/flags/${id}.svg`}
			alt=''
			className='h-12 w-16 shrink-0 rounded-lg border-[3px] border-white bg-white object-cover'
			initial={reduceMotion ? false : { rotateY: 90 }}
			animate={{ rotateY: 0 }}
			transition={{ ...POP, delay }}
		/>
	) : (
		<span className='grid h-12 w-16 shrink-0 place-items-center rounded-lg border-[3px] border-dashed border-white/60 bg-white/10 text-2xl font-black text-white/85'>
			<motion.span
				animate={reduceMotion ? undefined : { rotate: [0, -14, 12, -6, 0] }}
				transition={{
					duration: 0.6,
					repeat: Infinity,
					repeatDelay: 3,
					delay: 1 + delay,
				}}
			>
				?
			</motion.span>
		</span>
	)
}

const STAMP_TONES = {
	perfect: 'border-sunflower-300 text-sunflower-200',
	solved: 'border-white text-white',
	gaveUp: 'border-coral-300 text-coral-100',
} as const

export function ResultStamp({
	game,
	par,
}: {
	game: FinishedRouteState
	par: number
}) {
	const { t } = useTranslation()
	const reduceMotion = useReducedMotion()
	const tone =
		game.outcome === 'gaveUp'
			? 'gaveUp'
			: isPerfect({ par }, game)
				? 'perfect'
				: 'solved'

	return (
		<motion.p
			className={cn(
				'absolute right-5 bottom-[calc(100%-1.75rem)] grid size-28 place-content-center rounded-full border-[6px] border-double bg-grass-700/85 text-center backdrop-blur-[2px]',
				STAMP_TONES[tone],
			)}
			initial={
				reduceMotion ? false : { scale: 2.6, rotate: -45, opacity: 0 }
			}
			animate={{ scale: 1, rotate: -12, opacity: 1 }}
			transition={{
				type: 'spring',
				stiffness: 520,
				damping: 17,
				delay: revealDelay(par) + 0.35 + par * 0.07,
			}}
		>
			{game.outcome === 'solved' ? (
				<>
					<span className='text-xs font-black tracking-wider uppercase'>
						{t(`routes.result.${tone}`)}
					</span>
					<span className='text-3xl leading-none font-black tabular-nums'>
						{getScore(game)}/{par}
					</span>
				</>
			) : (
				<span className='px-2 text-lg leading-tight font-black uppercase'>
					{t('routes.result.gaveUp')}
				</span>
			)}
		</motion.p>
	)
}
