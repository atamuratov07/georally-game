import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils'
import { CAPTION_TEXT } from './scoreText'

interface MissedCaptionProps {
	missedCount: number
	position: number | null
	className?: string
}

export function MissedCaption({
	missedCount,
	position,
	className,
}: MissedCaptionProps) {
	const { t } = useTranslation()

	return (
		<p
			aria-live='polite'
			className={cn(
				'animate-pop-in text-lg font-black whitespace-nowrap text-white tabular-nums [animation-delay:650ms]',
				className,
			)}
			style={CAPTION_TEXT}
		>
			{position === null
				? t('recallSprint.review.missed', { count: missedCount })
				: t('recallSprint.review.position', {
						index: position + 1,
						count: missedCount,
					})}
		</p>
	)
}
