import { motion, useReducedMotion } from 'motion/react'

export function PressedBest({ label, best }: { label: string; best: number }) {
	const reduceMotion = useReducedMotion()

	return (
		<motion.p
			className='flex shrink-0 items-baseline gap-1 font-black text-sunflower-200 [text-shadow:0_-1px_0_rgb(168_98_0/0.45),0_1px_0_#fff]'
			initial={reduceMotion ? false : { scale: 1.3, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={{ duration: 0.18, ease: 'easeIn', delay: 0.6 }}
		>
			<span className='text-[0.6875rem] tracking-wider uppercase'>
				{label}
			</span>
			<span className='text-xl leading-none tabular-nums'>{best}</span>
		</motion.p>
	)
}
