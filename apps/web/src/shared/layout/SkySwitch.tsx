import { useReducedMotion } from 'motion/react'
import { useId, useState, type CSSProperties, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils'
import { applySky, currentSky, SKIES, type Sky } from './sky'

const SLICE = 360 / SKIES.length
const PIVOT = { x: 22, y: 33 }
const RADIUS = 40

const SKY_FILL: Readonly<Record<Sky, readonly [string, string]>> = {
	day: ['#6fb6f5', '#cfe8ff'],
	dusk: ['#6b58cf', '#ffb59a'],
	night: ['#16214d', '#2e2468'],
}

const EDGE: Readonly<Record<Sky, string>> = {
	day: '#3f8fd8',
	dusk: '#4c3aa8',
	night: '#0b1226',
}

const BODY: Readonly<Record<Sky, ReactNode>> = {
	day: <circle cx='22' cy='15' r='6' className='fill-sunflower-300' />,
	dusk: <circle cx='22' cy='19' r='7' fill='#ff8150' />,
	night: (
		<>
			<circle cx='21' cy='15' r='5.5' fill='#fff' />
			<circle cx='24' cy='13' r='4.5' fill={SKY_FILL.night[0]} />
			<circle cx='13' cy='12' r='1' fill='#fff' />
			<circle cx='30' cy='20' r='0.8' fill='#fff' />
		</>
	),
}

const half = (SLICE / 2) * (Math.PI / 180)
const WEDGE = [
	`M${PIVOT.x} ${PIVOT.y}`,
	`L${PIVOT.x - RADIUS * Math.sin(half)} ${PIVOT.y - RADIUS * Math.cos(half)}`,
	`A${RADIUS} ${RADIUS} 0 0 1 ${PIVOT.x + RADIUS * Math.sin(half)} ${PIVOT.y - RADIUS * Math.cos(half)}`,
	'Z',
].join('')

export function SkySwitch({ className }: { className?: string }) {
	const { t } = useTranslation()
	const reduceMotion = useReducedMotion()
	const id = useId().replace(/[^a-zA-Z0-9]/g, '')
	const [turns, setTurns] = useState(() => SKIES.indexOf(currentSky()))
	const sky = SKIES[turns % SKIES.length]
	const label = t('app.sky', { sky: t(`app.skies.${sky}`) })

	return (
		<button
			type='button'
			aria-label={label}
			title={label}
			className={cn(
				'pressable size-10 shrink-0 overflow-hidden rounded-full transition-[box-shadow,translate]',
				className,
			)}
			style={{ '--edge': EDGE[sky] } as CSSProperties}
			onClick={() => {
				applySky(SKIES[(turns + 1) % SKIES.length])
				setTurns(turns + 1)
			}}
		>
			<svg aria-hidden='true' viewBox='0 0 44 44' className='size-full'>
				<defs>
					{SKIES.map(name => (
						<linearGradient
							key={name}
							id={`${id}${name}`}
							x1='0'
							y1='0'
							x2='0'
							y2='1'
						>
							<stop offset='0' stopColor={SKY_FILL[name][0]} />
							<stop offset='1' stopColor={SKY_FILL[name][1]} />
						</linearGradient>
					))}
				</defs>
				<g
					style={{
						transform: `rotate(${-SLICE * turns}deg)`,
						transformBox: 'view-box',
						transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`,
						transition: reduceMotion
							? undefined
							: 'transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
					}}
				>
					{SKIES.map((name, i) => (
						<g
							key={name}
							transform={`rotate(${i * SLICE} ${PIVOT.x} ${PIVOT.y})`}
						>
							<path d={WEDGE} fill={`url(#${id}${name})`} />
							{BODY[name]}
						</g>
					))}
				</g>
				<path d='M-2 34Q22 26 46 34V46H-2Z' className='fill-grass-500' />
				<path
					d='M-2 34Q22 26 46 34'
					fill='none'
					className='stroke-grass-600'
					strokeWidth='1.5'
				/>
			</svg>
		</button>
	)
}
