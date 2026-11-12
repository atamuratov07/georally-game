import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/utils'

interface ReviewArrowProps {
	direction: 1 | -1
	onStep: (direction: 1 | -1) => void
	className?: string
}

export function ReviewArrow({
	direction,
	onStep,
	className,
}: ReviewArrowProps) {
	const { t } = useTranslation()
	const label =
		direction > 0
			? t('recallSprint.review.next')
			: t('recallSprint.review.previous')

	return (
		<Button
			type='button'
			size='icon'
			variant='neutral'
			className={cn(
				"size-14 animate-[pop-in_320ms_cubic-bezier(0.2,0.9,0.3,1.3)_both,bump_360ms_cubic-bezier(0.2,0.8,0.2,1)_950ms_both] [&_svg:not([class*='size-'])]:size-8",
				className,
			)}
			aria-label={label}
			title={label}
			onClick={() => onStep(direction)}
		>
			{direction > 0 ? (
				<ChevronRight aria-hidden='true' strokeWidth={3} />
			) : (
				<ChevronLeft aria-hidden='true' strokeWidth={3} />
			)}
		</Button>
	)
}
