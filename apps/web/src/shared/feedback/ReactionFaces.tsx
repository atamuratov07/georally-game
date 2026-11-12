import type { ComponentProps, ReactNode } from 'react'

const PIN =
	'M32 50 C27 43.5 14.5 34 14.5 22.5 A17.5 17.5 0 1 1 49.5 22.5 C49.5 34 37 43.5 32 50 Z'
const HEAD_X = 32
const HEAD_Y = 22.5

const FEATURE = {
	className: 'stroke-ink',
	fill: 'none',
	strokeWidth: 2.6,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
} as const

function Pin({
	body,
	ring,
	children,
}: {
	body: string
	ring: string
	children: ReactNode
}) {
	return (
		<>
			<path d={PIN} className={body} />
			<circle cx={HEAD_X} cy={HEAD_Y} r={12} className={ring} />
			<circle
				cx={HEAD_X}
				cy={HEAD_Y}
				r={9.6}
				className='fill-sunflower-50'
			/>
			{children}
		</>
	)
}

function Shadow({ rx, cx = 32 }: { rx: number; cx?: number }) {
	return (
		<ellipse
			cx={cx}
			cy={56}
			rx={rx}
			ry={3.2}
			className='fill-ocean-500'
			opacity={0.3}
		/>
	)
}

function DotEyes() {
	return (
		<>
			<circle cx={28.4} cy={21.8} r={1.7} className='fill-ink' />
			<circle cx={35.6} cy={21.8} r={1.7} className='fill-ink' />
		</>
	)
}

const PING_MARKS = [
	[8, 12, 11.5, 14.5],
	[6.5, 21, 10.5, 21],
	[8, 30, 11.5, 27.5],
] as const

type FaceProps = ComponentProps<'svg'>

const TOPPLE_DEGREES = 30

export function MissedPin(props: FaceProps) {
	return (
		<svg viewBox='0 0 64 64' aria-hidden='true' {...props}>
			<Shadow rx={13} cx={36} />
			<g transform={`translate(-5 3) rotate(${TOPPLE_DEGREES} 32 50)`}>
				<Pin body='fill-coral-500' ring='fill-coral-600'>
					<g transform={`rotate(${-TOPPLE_DEGREES} ${HEAD_X} ${HEAD_Y})`}>
						<DotEyes />
						<path d='M28.6 28.2 Q32 25.2 35.4 28.2' {...FEATURE} />
					</g>
				</Pin>
			</g>
		</svg>
	)
}

export function StandingPin(props: FaceProps) {
	return (
		<svg viewBox='0 0 64 64' aria-hidden='true' {...props}>
			<Shadow rx={10} />
			<g transform='translate(0 3)'>
				<Pin body='fill-sunflower-400' ring='fill-sunflower-500'>
					<DotEyes />
					<path d='M28.8 27 L35.2 27' {...FEATURE} />
				</Pin>
			</g>
		</svg>
	)
}

export function BouncingPin(props: FaceProps) {
	return (
		<svg viewBox='0 0 64 64' aria-hidden='true' {...props}>
			<Shadow rx={7} />
			{PING_MARKS.flatMap(([x1, y1, x2, y2]) =>
				[
					[x1, x2],
					[64 - x1, 64 - x2],
				].map(([from, to]) => (
					<path
						key={`${from}-${y1}`}
						d={`M${from} ${y1} L${to} ${y2}`}
						className='stroke-grass-500'
						strokeWidth={2.8}
						strokeLinecap='round'
					/>
				)),
			)}
			<g transform='translate(0 -1)'>
				<Pin body='fill-grass-500' ring='fill-grass-600'>
					<path d='M26.6 22.4 Q28.4 19.8 30.2 22.4' {...FEATURE} />
					<path d='M33.8 22.4 Q35.6 19.8 37.4 22.4' {...FEATURE} />
					<path
						d='M28 25.6 Q32 30.8 36 25.6 Z'
						className='fill-ink stroke-ink'
						strokeWidth={1.6}
						strokeLinejoin='round'
					/>
				</Pin>
			</g>
		</svg>
	)
}
