import { useId, type ReactNode } from 'react'
import { cn } from '@/shared/utils'

const CARD = { x: 11, y: 10, width: 14, height: 20, rx: 3.4 }
const GLOBE = { cx: 18, cy: 18.8, r: 4.8 }

const FAN =
	'transition-[rotate,translate] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] [transform-box:view-box] [transform-origin:18px_36px] motion-reduce:transition-none'

function Card({
	fill,
	shade,
	clipId,
	className,
	children,
}: {
	fill: string
	shade: string
	clipId: string
	className: string
	children?: ReactNode
}) {
	return (
		<g className={cn(FAN, className)}>
			<rect {...CARD} fill={fill} stroke='none' />
			<rect
				x={CARD.x}
				y={CARD.y + CARD.height - 4.5}
				width={CARD.width}
				height='6'
				fill={shade}
				stroke='none'
				clipPath={`url(#${clipId})`}
			/>
			<path d='M14 13.2h3.2' strokeWidth='1.6' opacity='0.85' />
			{children}
			<rect {...CARD} fill='none' />
		</g>
	)
}

function Globe({ clipId }: { clipId: string }) {
	const { cx, cy, r } = GLOBE

	return (
		<>
			<circle {...GLOBE} fill='var(--color-ocean-300)' stroke='none' />
			<g clipPath={`url(#${clipId})`} stroke='none'>
				<path
					fill='var(--color-ocean-400)'
					d={`M${cx - r} ${cy + 1.5}a${r} ${r} 0 0 0 ${2 * r} 0v${r}h-${2 * r}z`}
				/>
				<g fill='var(--color-sunflower-200)'>
					<path
						d={`M${cx - 4} ${cy - 3.4}c1.5-1.2 4.1-1.5 5.3-.4 1 .9.2 1.9-.9 2.3-1 .3-1 1.3-1.9 1.7-1 .4-1.8-.3-2.4-1-.4-.6-.6-1.7-.1-2.6z`}
					/>
					<path
						d={`M${cx + 0.8} ${cy + 1.3}c1-.6 2.5-.5 3 .5.5.8 0 1.8-1 2.2-1 .4-2.3 0-2.5-1-.2-.7 0-1.3.5-1.7z`}
					/>
				</g>
			</g>
			<path
				d={`M${cx - 3.2} ${cy - 1.5}a3.4 3.4 0 0 1 1.8-1.8`}
				fill='none'
				strokeWidth='1.2'
			/>
			<circle {...GLOBE} fill='none' strokeWidth='1.7' />
		</>
	)
}

export function CountryCardsIcon({ className }: { className?: string }) {
	const id = useId()
	const cardClip = `${id}card`
	const globeClip = `${id}globe`

	return (
		<svg
			viewBox='0 0 36 36'
			aria-hidden='true'
			stroke='white'
			strokeWidth='2.1'
			strokeLinecap='round'
			className={cn('overflow-visible', className)}
		>
			<defs>
				<clipPath id={cardClip}>
					<rect {...CARD} />
				</clipPath>
				<clipPath id={globeClip}>
					<circle {...GLOBE} />
				</clipPath>
			</defs>
			<Card
				fill='var(--color-coral-400)'
				shade='var(--color-coral-500)'
				clipId={cardClip}
				className='-rotate-22 group-hover:-rotate-30 group-focus-visible:-rotate-30'
			/>
			<Card
				fill='var(--color-sunflower-400)'
				shade='var(--color-sunflower-500)'
				clipId={cardClip}
				className='rotate-22 group-hover:rotate-30 group-focus-visible:rotate-30'
			/>
			<Card
				fill='var(--color-ocean-500)'
				shade='var(--color-ocean-600)'
				clipId={cardClip}
				className='-translate-y-[3.5px] group-hover:-translate-y-[5.5px] group-focus-visible:-translate-y-[5.5px]'
			>
				<Globe clipId={globeClip} />
			</Card>
		</svg>
	)
}

export function ReviewEmblem() {
	return (
		<CountryCardsIcon className='size-10 drop-shadow-[0_2px_0_var(--color-ink)]' />
	)
}
