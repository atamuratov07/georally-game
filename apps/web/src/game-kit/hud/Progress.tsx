import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils'
import { outlinedText } from '@/shared/widgets/outlinedText'

const PROGRESS_TEXT = outlinedText(0.23, 0.17, 'em')

interface ProgressProps {
	current: number
	total: number
}

export function ProgressChip({
	current,
	total,
	className,
}: ProgressProps & { className?: string }) {
	const { t } = useTranslation()

	return (
		<span
			className={cn(
				'text-3xl font-black whitespace-nowrap text-sunflower-300 tabular-nums',
				className,
			)}
			style={PROGRESS_TEXT}
			aria-label={t('game.progress', { current, total })}
		>
			{current} / {total}
		</span>
	)
}

export function ProgressText({ current, total }: ProgressProps) {
	const { t } = useTranslation()

	return (
		<span
			className='px-2 text-sm font-black text-muted tabular-nums'
			aria-label={t('game.progress', { current, total })}
		>
			{current}/{total}
		</span>
	)
}
