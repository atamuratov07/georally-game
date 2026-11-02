import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '@/shared/utils'

export function FloatingNotice({
	tone = 'neutral',
	offset = 0,
	icon,
	children,
}: {
	tone?: 'neutral' | 'error'
	/** Stack index, for showing two notices at once. */
	offset?: number
	icon?: ReactNode
	children: ReactNode
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: -20, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: -20, scale: 0.95 }}
			transition={{ type: 'spring', stiffness: 400, damping: 30 }}
			className='pointer-events-none fixed inset-x-0 z-60 flex justify-center px-4'
			style={{ top: `${0.75 + offset * 3.75}rem` }}
			role={tone === 'error' ? 'alert' : 'status'}
		>
			<div
				className={cn(
					'raised floating flex max-w-full items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-extrabold [--edge-size:4px]',
					'[&_svg]:size-4.5 [&_svg]:shrink-0 [&_svg]:stroke-[2.75]',
					tone === 'error'
						? 'border-coral-600 bg-coral-500 text-white [--edge:var(--color-coral-700)]'
						: 'border-line-strong bg-white text-ink [--edge:var(--color-line-strong)]',
				)}
			>
				{icon}
				<span className='min-w-0'>{children}</span>
			</div>
		</motion.div>
	)
}
