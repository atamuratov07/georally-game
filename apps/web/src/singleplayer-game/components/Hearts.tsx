import { HeartIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'

const SHAKE_ANIMATION = {
	x: [0, -4, 4, -3, 3, 0],
}

interface HeartsProps {
	attemptsLeft: number
	maxAttempts: number
}

export function Hearts({
	attemptsLeft,
	maxAttempts,
}: HeartsProps) {
	const { t } = useTranslation()
	const safeAttempts = Math.max(0, Math.min(attemptsLeft, maxAttempts))

	return (
		<div
			className='flex items-center gap-1 sm:gap-2'
			aria-label={t('singleplayer.attemptsLeft', {
				count: safeAttempts,
			})}
		>
			{Array.from({ length: maxAttempts }, (_, index) => {
				const isFilled = index >= maxAttempts - safeAttempts
				return (
					<motion.div
						key={index}
						animate={!isFilled ? SHAKE_ANIMATION : undefined}
						transition={{
							duration: 0.35,
							ease: 'easeInOut',
						}}
					>
						<HeartIcon
							className={`size-6 sm:size-8 stroke-3 ${isFilled ? 'fill-rose-400 stroke-rose-300 drop-shadow-[0_0_1px_rgba(251,113,133,1)]' : 'fill-slate-300 stroke-slate-200'}`}
						/>
					</motion.div>
				)
			})}
		</div>
	)
}
