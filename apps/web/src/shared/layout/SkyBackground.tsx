import type { CSSProperties } from 'react'

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
			<g fill='#cfe3f7' transform='translate(0 6)'>
				{shape}
			</g>
			<g fill='white'>{shape}</g>
		</svg>
	)
}

export function SkyBackground() {
	return (
		<div
			aria-hidden='true'
			className='pointer-events-none fixed inset-0 overflow-hidden bg-[linear-gradient(180deg,#cfe8ff_0%,#e4f2ff_45%,#fff6df_100%)]'
		>
			{CLOUDS.map((cloud, index) => (
				<div
					key={index}
					className='absolute left-0 animate-cloud-drift motion-reduce:animate-none motion-reduce:[translate:var(--rest)_0]'
					style={
						{
							top: cloud.top,
							opacity: cloud.opacity,
							animationDuration: `${cloud.duration}s`,
							animationDelay: `${cloud.delay}s`,
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
