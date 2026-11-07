import { Info } from 'lucide-react'
import { Toggle as TogglePrimitive } from 'radix-ui'
import { useTranslation } from 'react-i18next'
import { mapControlClass } from './map-controls'

interface CardToggleProps {
	hidden: boolean
	onHiddenChange: (hidden: boolean) => void
}

export function CardToggle({ hidden, onHiddenChange }: CardToggleProps) {
	const { t } = useTranslation()

	return (
		<div className='absolute top-15 right-3 z-10'>
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
