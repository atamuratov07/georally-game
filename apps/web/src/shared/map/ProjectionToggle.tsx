import { Globe, Map as MapIcon } from 'lucide-react'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import { useTranslation } from 'react-i18next'
import { cn } from '../utils'
import { mapControlClass } from './map-controls'

export type ProjectionKind = 'flat' | 'globe'

interface ProjectionToggleProps {
	value: ProjectionKind
	globeDisabled: boolean
	onChange: (value: ProjectionKind) => void
	className?: string
}

export function ProjectionToggle({
	value,
	globeDisabled,
	onChange,
	className,
}: ProjectionToggleProps) {
	const { t } = useTranslation()

	return (
		<ToggleGroupPrimitive.Root
			type='single'
			orientation='vertical'
			className={cn('flex flex-col gap-2', className)}
			value={value}
			onValueChange={next => {
				if ((next === 'flat' || next === 'globe') && next !== value) {
					onChange(next)
				}
			}}
		>
			<ToggleGroupPrimitive.Item
				value='flat'
				aria-label={t('map.projection.flat')}
				title={t('map.projection.flat')}
				className={mapControlClass(value === 'flat')}
			>
				<MapIcon aria-hidden='true' className='size-6' strokeWidth={2.25} />
			</ToggleGroupPrimitive.Item>
			<ToggleGroupPrimitive.Item
				value='globe'
				aria-label={t('map.projection.globe')}
				title={t('map.projection.globe')}
				disabled={globeDisabled}
				className={mapControlClass(value === 'globe')}
			>
				<Globe aria-hidden='true' className='size-6' strokeWidth={2.25} />
			</ToggleGroupPrimitive.Item>
		</ToggleGroupPrimitive.Root>
	)
}
