import { useState, type CSSProperties } from 'react'
import { cn } from '@/shared/utils'

const EVENING =
	'absolute inset-0 bg-[linear-gradient(180deg,#6b58cf_0%,#a97fd8_42%,#f3a3b5_75%,#ffc49a_100%)] opacity-0 transition-opacity duration-700'
const NIGHT =
	'bg-[linear-gradient(160deg,#1d2c62,var(--color-ink)_58%,#2a1d52)]'

const STARS = [
	{ x: '7%', y: '9%', size: 3, dur: 2.6, delay: 0 },
	{ x: '19%', y: '27%', size: 2, dur: 3.4, delay: -1.2 },
	{ x: '31%', y: '6%', size: 2, dur: 2.9, delay: -0.4 },
	{ x: '44%', y: '18%', size: 3, dur: 3.8, delay: -2.1 },
	{ x: '57%', y: '4%', size: 2, dur: 2.4, delay: -0.9 },
	{ x: '68%', y: '24%', size: 2, dur: 3.1, delay: -1.7 },
	{ x: '81%', y: '8%', size: 3, dur: 2.7, delay: -0.2 },
	{ x: '93%', y: '21%', size: 2, dur: 3.5, delay: -2.6 },
	{ x: '12%', y: '48%', size: 2, dur: 2.8, delay: -1.4 },
	{ x: '88%', y: '52%', size: 2, dur: 3.3, delay: -0.7 },
	{ x: '36%', y: '66%', size: 2, dur: 3, delay: -2.3 },
	{ x: '74%', y: '78%', size: 2, dur: 2.5, delay: -1.1 },
] as const

const CLOUDS = [
	{ top: '6%', width: 220, duration: 95, delay: -20, opacity: 1, rest: '8vw' },
	{
		top: '22%',
		width: 130,
		duration: 140,
		delay: -95,
		opacity: 0.7,
		rest: '62vw',
	},
	{
		top: '44%',
		width: 180,
		duration: 115,
		delay: -60,
		opacity: 0.9,
		rest: '38vw',
	},
	{
		top: '63%',
		width: 110,
		duration: 160,
		delay: -30,
		opacity: 0.6,
		rest: '80vw',
	},
	{
		top: '12%',
		width: 150,
		duration: 125,
		delay: -110,
		opacity: 0.8,
		rest: '45vw',
	},
	{
		top: '78%',
		width: 200,
		duration: 105,
		delay: -75,
		opacity: 0.85,
		rest: '15vw',
	},
] as const

// CLOUDS durations are timed for a lap 300px longer than the screen.
const SPEED_LAP_OVERHANG = 300
// Clouds are drawn at 60% below Tailwind's `sm`, see Cloud.
const SMALL_SCREEN = 640
const SMALL_CLOUD = 0.6

function lap(cloud: (typeof CLOUDS)[number], viewport: number) {
	const width = cloud.width * (viewport < SMALL_SCREEN ? SMALL_CLOUD : 1)
	return (
		(cloud.duration * (viewport + width)) / (viewport + SPEED_LAP_OVERHANG)
	)
}

function Cloud({ width }: { width: number }) {
	const shape = (
		<>
			<circle cx='34' cy='38' r='22' />
			<circle cx='62' cy='28' r='28' />
			<circle cx='92' cy='40' r='20' />
			<rect x='14' y='38' width='96' height='22' rx='11' />
		</>
	)

	return (
		<svg
			viewBox='0 0 124 66'
			aria-hidden='true'
			className='h-auto w-[var(--cloud-width)] max-sm:w-[calc(var(--cloud-width)*0.6)]'
			style={{ '--cloud-width': `${width}px` } as CSSProperties}
		>
			<g
				className='fill-[var(--cloud-shade)] transition-[fill] duration-700'
				transform='translate(0 6)'
			>
				{shape}
			</g>
			<g className='fill-[var(--cloud)] transition-[fill] duration-700'>
				{shape}
			</g>
		</svg>
	)
}

export function SkyBackground() {
	// Delays count from the clock, so every page's clouds stand where the last page's were.
	const [{ now, viewport }] = useState(() => ({
		now: Date.now() / 1000,
		viewport: window.innerWidth,
	}))

	return (
		<div
			aria-hidden='true'
			className='pointer-events-none fixed inset-0 overflow-hidden bg-[linear-gradient(180deg,#cfe8ff_0%,#e4f2ff_45%,#fff6df_100%)]'
		>
			<div className={cn(EVENING, 'in-data-[sky=dusk]:opacity-100')} />
			<div
				className={cn(EVENING, NIGHT, 'in-data-[sky=night]:opacity-100')}
			/>
			{STARS.map((star, index) => (
				<span
					key={index}
					className='absolute hidden size-[var(--size)] animate-twinkle rounded-full bg-white in-data-[sky=night]:block motion-reduce:animate-none'
					style={
						{
							left: star.x,
							top: star.y,
							'--size': `${star.size}px`,
							animationDuration: `${star.dur}s`,
							animationDelay: `${star.delay}s`,
						} as CSSProperties
					}
				/>
			))}
			{CLOUDS.map((cloud, index) => (
				<div
					key={index}
					className='absolute left-0 animate-cloud-drift motion-reduce:animate-none motion-reduce:[translate:var(--rest)_0]'
					style={
						{
							top: cloud.top,
							opacity: cloud.opacity,
							animationDuration: `${lap(cloud, viewport)}s`,
							animationDelay: `${-((now - cloud.delay) % lap(cloud, viewport))}s`,
							'--rest': cloud.rest,
						} as CSSProperties
					}
				>
					<Cloud width={cloud.width} />
				</div>
			))}
		</div>
	)
}
