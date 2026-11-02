import { MapPin } from 'lucide-react'
import { motion } from 'motion/react'

export function SelectedAnswerMarker() {
	return (
		<div
			aria-hidden='true'
			className='pointer-events-none relative select-none'
		>
			<motion.span
				className='absolute -bottom-6 left-1/2 -ml-6 block size-12 rounded-full border-4 border-sunflower-300'
				initial={{ scale: 0, opacity: 0 }}
				animate={{ scale: [0, 1.6, 2.4], opacity: [0, 0.9, 0] }}
				transition={{ duration: 1.1, delay: 0.15, ease: 'easeOut' }}
			/>
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
