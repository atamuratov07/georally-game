import { Info } from 'lucide-react'
import { Toggle as TogglePrimitive } from 'radix-ui'
import { useTranslation } from 'react-i18next'
import { cn } from '../utils'
import { mapControlClass } from './map-controls'

interface CardToggleProps {
	hidden: boolean
	onHiddenChange: (hidden: boolean) => void
	className?: string
}

export function CardToggle({
	hidden,
	onHiddenChange,
	className,
}: CardToggleProps) {
	const { t } = useTranslation()

	return (
		<div className={cn('absolute top-15 right-3 z-10', className)}>
			<TogglePrimitive.Root
				aria-label={t('map.info.show')}
				title={hidden ? t('map.info.show') : t('map.info.hide')}
				pressed={!hidden}
				onPressedChange={pressed => onHiddenChange(!pressed)}
				className={mapControlClass(!hidden)}
			>
				<Info aria-hidden='true' className='size-6' strokeWidth={2.25} />
			</TogglePrimitive.Root>
		</div>
	)
}
