import { MapPin } from 'lucide-react'
import { motion } from 'motion/react'
import { HitRing } from '@/shared/map/HitRing'

export function SelectedAnswerMarker() {
	return (
		<div
			aria-hidden='true'
			className='pointer-events-none relative select-none'
		>
			<HitRing className='absolute -bottom-6 left-1/2 -ml-6' />
			<motion.span
				className='block'
				initial={{ y: -60, opacity: 0, scale: 0.6 }}
				animate={{ y: 0, opacity: 1, scale: 1 }}
				transition={{ type: 'spring', stiffness: 520, damping: 15 }}
			>
				<MapPin
					className='size-12 fill-coral-500 text-white drop-shadow-[0_4px_0_var(--color-coral-800)]'
					strokeWidth={2}
				/>
			</motion.span>
		</div>
	)
}
