import { Heart } from 'lucide-react'
import { motion, type Transition } from 'motion/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils'

const HEART_CLASS = 'size-8 sm:size-9'
/** A zigzag crack down the middle of Lucide's 24×24 heart. */
const CRACK_PATH = 'M12.4 6.6 10.7 10.1l2.6 2.3-2.2 3.5 0.9 3.4'

type SlotChange = 'lost' | 'gained' | null

function HeartSlot({
	filled,
	beating,
	index,
}: {
	filled: boolean
	beating: boolean
	index: number
}) {
	const [previous, setPrevious] = useState(filled)
	const [change, setChange] = useState<SlotChange>(null)

	// Remember what just happened, so the remounted heart can animate it.
	if (previous !== filled) {
		setPrevious(filled)
		setChange(filled ? 'gained' : 'lost')
	}

	const justLost = change === 'lost'
	let transition: Transition = { duration: 0.2 }
	if (filled && change === 'gained') {
		transition = {
			type: 'spring',
			stiffness: 520,
			damping: 14,
			delay: index * 0.07,
		}
	} else if (justLost) {
		transition = { duration: 0.5, ease: 'easeOut' }
	}

	return (
		<motion.span
			key={filled ? 'full' : 'lost'}
			className='relative block'
			initial={
				change === 'gained'
					? { scale: 0.3, opacity: 0 }
					: justLost
						? { scale: 1.3, rotate: -10 }
						: false
			}
			animate={
				filled
					? { scale: 1, opacity: 1 }
					: {
							scale: 1,
							rotate: 0,
							x: justLost ? [0, -5, 5, -3, 3, 0] : 0,
						}
			}
			transition={transition}
		>
			<span
				className={cn('relative block', beating && 'animate-heart-pulse')}
			>
				{/*
				 * The 3D edge is a second heart drawn 3px lower, not a CSS
				 * drop-shadow: filters on a continuously scaled element get
				 * re-rasterised and can blink out on GPU-composited browsers.
				 */}
				<Heart
					aria-hidden='true'
					strokeWidth={2.5}
					className={cn(
						HEART_CLASS,
						'absolute inset-0 translate-y-[3px]',
						filled
							? 'fill-coral-700 text-coral-700'
							: 'fill-ink/25 text-ink/25',
					)}
				/>
				<Heart
					aria-hidden='true'
					strokeWidth={2.5}
					className={cn(
						HEART_CLASS,
						'relative',
						filled
							? 'fill-coral-400 text-coral-200'
							: 'fill-line-strong text-paper',
					)}
				/>
				{filled ? null : (
					<svg
						aria-hidden='true'
						viewBox='0 0 24 24'
						fill='none'
						className={cn(HEART_CLASS, 'absolute inset-0')}
					>
						<motion.path
							d={CRACK_PATH}
							stroke='var(--color-paper)'
							strokeWidth={2}
							strokeLinecap='round'
							strokeLinejoin='round'
							initial={{ pathLength: justLost ? 0 : 1 }}
							animate={{ pathLength: 1 }}
							transition={{ duration: 0.3, delay: 0.1 }}
						/>
					</svg>
				)}
			</span>
		</motion.span>
	)
}

interface HeartsProps {
	attemptsLeft: number
	maxAttempts: number
}

export function Hearts({ attemptsLeft, maxAttempts }: HeartsProps) {
	const { t } = useTranslation()
	const safeAttempts = Math.max(0, Math.min(attemptsLeft, maxAttempts))
	const isLastHeart = safeAttempts === 1 && maxAttempts > 1

	return (
		<div
			role='img'
			aria-label={t('singleplayer.attemptsLeft', { count: safeAttempts })}
			className='flex items-center gap-1'
		>
			{Array.from({ length: maxAttempts }, (_, index) => (
				<HeartSlot
					key={index}
					index={index}
					filled={index < safeAttempts}
					beating={isLastHeart && index === 0}
				/>
			))}
		</div>
	)
}
