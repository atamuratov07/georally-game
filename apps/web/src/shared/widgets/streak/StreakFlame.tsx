import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useState, type CSSProperties } from 'react'
import { cn } from '@/shared/utils'
import { FLAME } from './flameShapes'
import './streak.css'

export type FlameState = 'lit' | 'risk' | 'cold'
type Tier = 'warm' | 'hot' | 'blaze' | 'cold'

const color = (token: string) => `var(--color-${token})`

const PALETTES: Readonly<Record<Tier, Readonly<Record<string, string>>>> = {
	warm: {
		body: color('coral-400'),
		light: color('coral-200'),
		mid: color('sunflower-400'),
		midLight: color('sunflower-200'),
		core: color('sunflower-50'),
		digits: color('coral-500'),
	},
	hot: {
		body: color('coral-500'),
		light: color('coral-300'),
		mid: color('sunflower-400'),
		midLight: color('sunflower-200'),
		core: color('sunflower-50'),
		digits: color('coral-500'),
	},
	blaze: {
		body: color('coral-500'),
		light: color('coral-200'),
		mid: color('sunflower-300'),
		midLight: color('sunflower-100'),
		core: '#fff',
		digits: color('coral-500'),
	},
	cold: {
		body: color('line'),
		light: '#fff',
		mid: color('paper'),
		midLight: '#fff',
		core: '#fff',
		digits: color('muted'),
	},
}

const TONGUES = [
	{ x: 53, y: 30, size: 1, dx: 4, dur: 1.4, delay: 0, tone: 'body' },
	{ x: 79, y: 44, size: 0.75, dx: 3, dur: 1.1, delay: -0.5, tone: 'mid' },
	{ x: 22, y: 56, size: 0.65, dx: -3, dur: 1.25, delay: -0.9, tone: 'body' },
] as const

const SPARKS = [
	{ x: 30, y: 60, r: 2.2, dx: -6, dur: 1.8, delay: 0 },
	{ x: 70, y: 44, r: 1.8, dx: 5, dur: 1.6, delay: -0.6 },
	{ x: 50, y: 30, r: 1.6, dx: -3, dur: 2, delay: -1.2 },
	{ x: 82, y: 70, r: 1.5, dx: 8, dur: 1.7, delay: -0.3 },
	{ x: 18, y: 76, r: 1.7, dx: -8, dur: 1.9, delay: -1 },
] as const

const BURST = [
	[-34, -30],
	[-20, -52],
	[0, -62],
	[20, -52],
	[34, -30],
	[-40, -6],
	[40, -6],
] as const

const SPLINES = Array(4).fill('.45 0 .55 1').join(';')

function tierOf(state: FlameState, count: number): Tier {
	if (state === 'cold') return 'cold'
	if (count >= 30) return 'blaze'
	return count >= 7 ? 'hot' : 'warm'
}

const RISK_SCALE = 'scale(0.6)'
// Follows the shrunken flame's core, which sits lower in the box.
const RISK_DIGITS = 'translateY(12cqw) scale(0.62)'

function digitsSize(count: number) {
	if (count < 10) return 'text-[42cqw]'
	return count < 100 ? 'text-[34cqw]' : 'text-[26cqw]'
}

export function StreakFlame({
	count,
	state,
	ignite = null,
	className,
}: {
	count: number
	state: FlameState
	ignite?: { from: number; delay: number } | null
	className?: string
}) {
	const reduceMotion = useReducedMotion()
	const igniteFrom = ignite?.from
	const igniteDelay = ignite?.delay
	const igniting = igniteFrom !== undefined && !reduceMotion
	const [lit, setLit] = useState(!igniting)

	useEffect(() => {
		if (igniteDelay === undefined || reduceMotion) return
		const timer = setTimeout(() => setLit(true), igniteDelay * 1000)
		return () => clearTimeout(timer)
	}, [igniteDelay, reduceMotion])

	const before = igniting && !lit
	const shownState: FlameState = before
		? igniteFrom > 0
			? 'risk'
			: 'cold'
		: state
	const shownCount = before ? igniteFrom : count
	const tier = tierOf(shownState, shownCount)
	const palette = PALETTES[tier]
	const moving = !reduceMotion && shownState !== 'cold'
	const pace = shownState === 'risk' ? 1.6 : 1
	const flared = igniting && lit
	const id = useId().replace(/[^a-zA-Z0-9]/g, '')
	const ref = (name: string) => `${id}${name}`
	const paint = (tone: string): CSSProperties => ({
		fill: palette[tone],
		transition: 'fill 0.3s',
	})
	const tongues = tier === 'blaze' ? 3 : tier === 'hot' ? 2 : 1
	const sparks = tier === 'blaze' ? 5 : tier === 'hot' ? 3 : 2

	const layer = (
		name: 'outer' | 'mid' | 'core',
		dur: number,
		begin: number,
	) => (
		<path id={ref(name)} d={FLAME.still[name]}>
			{moving ? (
				<animate
					attributeName='d'
					values={FLAME[name]}
					dur={`${dur * pace}s`}
					begin={`${begin}s`}
					repeatCount='indefinite'
					calcMode='spline'
					keyTimes='0;.25;.5;.75;1'
					keySplines={SPLINES}
				/>
			) : null}
		</path>
	)

	return (
		<div
			className={cn(
				'@container relative aspect-[100/120] shrink-0',
				className,
			)}
		>
			<motion.div
				className='absolute inset-0'
				style={{ transformOrigin: '50% 100%' }}
				initial={false}
				animate={
					flared
						? {
								transform: [
									RISK_SCALE,
									'scale(1.28)',
									'scale(0.94)',
									'scale(1)',
								],
							}
						: {
								transform:
									shownState === 'risk' ? RISK_SCALE : 'scale(1)',
							}
				}
				transition={
					flared
						? { duration: 0.7, times: [0, 0.35, 0.7, 1], ease: 'easeOut' }
						: { type: 'spring', stiffness: 400, damping: 20 }
				}
			>
				<svg
					aria-hidden='true'
					viewBox='0 0 100 120'
					className='absolute inset-0 size-full overflow-visible'
				>
					<defs>
						{layer('outer', 1.4, 0)}
						{layer('mid', 1.1, -0.3)}
						{layer('core', 0.9, -0.5)}
						<clipPath id={ref('clip')}>
							<use href={`#${ref('outer')}`} />
						</clipPath>
						<mask
							id={ref('rim')}
							maskUnits='userSpaceOnUse'
							x='-20'
							y='-20'
							width='140'
							height='160'
						>
							<use href={`#${ref('outer')}`} fill='#fff' />
							<use
								href={`#${ref('outer')}`}
								fill='#000'
								transform='translate(3 2.5)'
							/>
						</mask>
						<mask
							id={ref('midRim')}
							maskUnits='userSpaceOnUse'
							x='-20'
							y='-20'
							width='140'
							height='160'
						>
							<use href={`#${ref('mid')}`} fill='#fff' />
							<use
								href={`#${ref('mid')}`}
								fill='#000'
								transform='translate(2.5 2)'
							/>
						</mask>
						<radialGradient id={ref('glow')}>
							<stop
								offset='0'
								stopColor={color('sunflower-300')}
								stopOpacity='0.7'
							/>
							<stop
								offset='1'
								stopColor={color('sunflower-300')}
								stopOpacity='0'
							/>
						</radialGradient>
					</defs>
					{shownState === 'cold' ? null : (
						<ellipse
							className={moving ? 'streak-glow' : undefined}
							cx='50'
							cy='104'
							rx='46'
							ry='16'
							fill={`url(#${ref('glow')})`}
							opacity={shownState === 'risk' ? 0.4 : 1}
						/>
					)}
					<use href={`#${ref('outer')}`} style={paint('body')} />
					<g clipPath={`url(#${ref('clip')})`}>
						<use
							href={`#${ref('outer')}`}
							style={paint('light')}
							mask={`url(#${ref('rim')})`}
						/>
						<use href={`#${ref('mid')}`} style={paint('mid')} />
						<use
							href={`#${ref('mid')}`}
							style={paint('midLight')}
							mask={`url(#${ref('midRim')})`}
						/>
						<use href={`#${ref('core')}`} style={paint('core')} />
					</g>
					{moving && shownState === 'lit'
						? TONGUES.slice(0, tongues).map((tongue, i) => (
								<g
									key={i}
									transform={`translate(${tongue.x} ${tongue.y}) scale(${tongue.size})`}
								>
									<path
										className='streak-tongue'
										d='M0 0C5-5 4-13 0-19C-4-13-5-5 0 0Z'
										style={
											{
												...paint(tongue.tone),
												'--dx': `${tongue.dx}px`,
												'--dur': `${tongue.dur}s`,
												'--delay': `${tongue.delay}s`,
											} as CSSProperties
										}
									/>
								</g>
							))
						: null}
					{moving && shownState === 'lit'
						? SPARKS.slice(0, sparks).map((spark, i) => (
								<circle
									key={i}
									className='streak-spark'
									cx={spark.x}
									cy={spark.y}
									r={spark.r}
									fill={i % 2 ? palette.light : palette.mid}
									style={
										{
											'--dx': `${spark.dx}px`,
											'--dur': `${spark.dur}s`,
											'--delay': `${spark.delay}s`,
										} as CSSProperties
									}
								/>
							))
						: null}
					{flared
						? BURST.map(([dx, dy], i) => (
								<circle
									key={i}
									className='streak-burst'
									cx='50'
									cy='66'
									r='3'
									fill={i % 2 ? palette.mid : palette.light}
									style={
										{
											'--dx': `${dx}px`,
											'--dy': `${dy}px`,
											'--delay': `${i * 0.02}s`,
										} as CSSProperties
									}
								/>
							))
						: null}
				</svg>
			</motion.div>
			<p
				className={cn(
					'absolute inset-x-0 top-[74%] flex -translate-y-1/2 justify-center leading-none font-black text-white tabular-nums',
					digitsSize(count),
				)}
				style={{
					WebkitTextStroke: `0.13em ${palette.digits}`,
					paintOrder: 'stroke fill',
				}}
			>
				<span className='sr-only'>{count}</span>
				<motion.span
					aria-hidden='true'
					className='block'
					initial={false}
					animate={{
						transform: flared
							? [RISK_DIGITS, 'scale(1.15)', 'scale(1)']
							: shownState === 'risk'
								? RISK_DIGITS
								: 'scale(1)',
					}}
					transition={
						flared
							? { duration: 0.6, times: [0, 0.45, 1], ease: 'easeOut' }
							: { type: 'spring', stiffness: 400, damping: 22 }
					}
				>
					<span
						aria-hidden='true'
						className={cn(
							'block h-[1.2em] overflow-hidden px-[0.12em]',
							moving && 'streak-digits',
							shownState === 'risk' && '[--pace:2.2s]',
						)}
					>
						{igniting ? (
							<motion.span
								className='flex flex-col'
								initial={false}
								animate={{
									transform: lit
										? 'translateY(-50%)'
										: 'translateY(0%)',
								}}
								transition={{
									type: 'spring',
									stiffness: 380,
									damping: 16,
									delay: 0.12,
								}}
							>
								<span className='grid h-[1.2em] place-items-center'>
									{igniteFrom}
								</span>
								<span className='grid h-[1.2em] place-items-center'>
									{count}
								</span>
							</motion.span>
						) : (
							<span className='grid h-[1.2em] place-items-center'>
								{count}
							</span>
						)}
					</span>
				</motion.span>
			</p>
		</div>
	)
}
