import { motion } from 'motion/react'
import { cn } from '../utils'

export function HitRing({ className }: { className?: string }) {
	return (
		<motion.span
			aria-hidden='true'
			className={cn(
				'block size-12 rounded-full border-4 border-sunflower-300',
				className,
			)}
			initial={{ scale: 0, opacity: 0 }}
			animate={{ scale: [0, 1.6, 2.4], opacity: [0, 0.9, 0] }}
			transition={{ duration: 1.1, delay: 0.15, ease: 'easeOut' }}
		/>
	)
}
