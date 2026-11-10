import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils'
import { outlinedText } from '@/shared/widgets/outlinedText'

const STEP_MS = 80
const CHIP_TEXT = outlinedText(6, 4)
const CHIP_TIMES = [0, 0.25, 0.55, 1]
const CHIP_PATH = { above: [-34, -26, -26, 0], below: [34, 26, 26, 0] }

interface FoundCounterProps {
	found: number
	total: number
	chipFrom: 'above' | 'below'
	className?: string
}

interface Chip {
	key: number
	amount: number
}

export function FoundCounter({
	found,
	total,
	chipFrom,
	className,
}: FoundCounterProps) {
	const { t } = useTranslation()
	const reduceMotion = useReducedMotion()
	const [previousFound, setPreviousFound] = useState(found)
	const [chip, setChip] = useState<Chip | null>(null)
	const [landed, setLanded] = useState(found)
	const [shown, setShown] = useState(found)

	if (found !== previousFound) {
		setPreviousFound(found)
		if (found > previousFound) {
			setChip({
				key: found,
				amount: (chip?.amount ?? 0) + found - previousFound,
			})
		} else {
			setChip(null)
			setLanded(found)
			setShown(found)
		}
	}

	useEffect(() => {
		if (shown >= landed) {
			return
		}
		const timer = setTimeout(() => setShown(count => count + 1), STEP_MS)
		return () => clearTimeout(timer)
	}, [landed, shown])

	const displayed = reduceMotion ? found : shown

	return (
		<span
			className={cn(
				'relative px-2 text-sm font-black text-muted tabular-nums',
				className,
			)}
			aria-label={t('recallSprint.counter', { found, total })}
		>
			{displayed}/{total}
			{chip && !reduceMotion ? (
				<motion.span
					key={chip.key}
					aria-hidden='true'
					className='pointer-events-none absolute top-1/2 left-1/2 -mt-4 -ml-6 w-12 text-center text-2xl font-black whitespace-nowrap text-sunflower-300 tabular-nums'
					style={CHIP_TEXT}
					initial={{ y: CHIP_PATH[chipFrom][0], opacity: 0, scale: 0.5 }}
					animate={{
						y: CHIP_PATH[chipFrom],
						opacity: [0, 1, 1, 0],
						scale: [0.5, 1.15, 1.15, 0.45],
					}}
					transition={{
						duration: 0.95,
						times: CHIP_TIMES,
						ease: 'easeInOut',
					}}
					onAnimationComplete={() => {
						setChip(null)
						setLanded(found)
					}}
				>
					+{chip.amount}
				</motion.span>
			) : null}
		</span>
	)
}
