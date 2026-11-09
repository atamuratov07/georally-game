import { Info } from 'lucide-react'
import { Toggle as TogglePrimitive } from 'radix-ui'
import { useTranslation } from 'react-i18next'
import { mapControlClass } from './map-controls'

const SLASH_LINE = { x1: 22.5, y1: 1.5, x2: 1.5, y2: 22.5 }

interface CardToggleProps {
	hidden: boolean
	onHiddenChange: (hidden: boolean) => void
	className?: string
}

function Slash({ hidden }: { hidden: boolean }) {
	const line = {
		...SLASH_LINE,
		pathLength: 1,
		strokeDasharray: '1 2',
		strokeDashoffset: hidden ? 0 : 1.05,
		strokeLinecap: 'round' as const,
		className:
			'transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none',
	}

	return (
		<svg
			aria-hidden='true'
			viewBox='0 0 24 24'
			fill='none'
			className='pointer-events-none absolute size-6 overflow-visible'
		>
			<line {...line} stroke='var(--color-ocean-500)' strokeWidth={6} />
			<line {...line} stroke='currentColor' strokeWidth={2.25} />
		</svg>
	)
}

export function CardToggle({
	hidden,
	onHiddenChange,
	className,
}: CardToggleProps) {
	const { t } = useTranslation()
	const label = hidden ? t('map.info.show') : t('map.info.hide')

	return (
		<div className={className}>
			<TogglePrimitive.Root
				aria-label={label}
				title={label}
				pressed={!hidden}
				onPressedChange={pressed => onHiddenChange(!pressed)}
				className={mapControlClass(false)}
			>
				<span className='relative grid size-6 place-items-center'>
					<Info aria-hidden='true' className='size-6' strokeWidth={2.25} />
					<Slash hidden={hidden} />
				</span>
			</TogglePrimitive.Root>
		</div>
	)
}
