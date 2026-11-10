import type { ReactNode } from 'react'
import { DEMO_SIZE } from './demoSize'
import { DEMO_COAST, DEMO_COUNTRIES, type Camera } from './demoWorld'

const FLIGHT = 'transform 1.1s cubic-bezier(0.45, 0, 0.2, 1)'

interface DemoMapProps {
	camera: Camera
	fillOf: (id: string, base: string) => string
	children?: ReactNode
}

export function DemoMap({ camera, fillOf, children }: DemoMapProps) {
	return (
		<svg
			viewBox={`0 0 ${DEMO_SIZE.width} ${DEMO_SIZE.height}`}
			className='absolute inset-0 size-full'
		>
			<g
				style={{
					transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.k})`,
					transformOrigin: '0 0',
					transition: FLIGHT,
				}}
			>
				{DEMO_COUNTRIES.map(country => (
					<path
						key={country.key}
						d={country.d}
						fill={fillOf(country.id, country.fill)}
						stroke='#ffffff'
						strokeWidth={1}
						vectorEffect='non-scaling-stroke'
						className='transition-[fill] duration-500'
					/>
				))}
				<path
					d={DEMO_COAST}
					fill='none'
					stroke='#4aa3d8'
					strokeWidth={1}
					vectorEffect='non-scaling-stroke'
				/>
				{children}
			</g>
		</svg>
	)
}
