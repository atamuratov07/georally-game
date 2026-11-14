import { ArrowRight, Flag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/utils'
import { outlinedText } from '@/shared/widgets/outlinedText'

export function GiveUpButton({
	onGiveUp,
	className,
}: {
	onGiveUp: () => void
	className?: string
}) {
	const { t } = useTranslation()

	return (
		<Button
			type='button'
			variant='neutral'
			size='icon'
			className={className}
			aria-label={t('singleplayer.giveUp')}
			title={t('singleplayer.giveUp')}
			onClick={onGiveUp}
		>
			<Flag aria-hidden='true' />
		</Button>
	)
}

export function NextButton({
	size,
	onNext,
}: {
	size: 'inline' | 'main'
	onNext: () => void
}) {
	const { t } = useTranslation()

	return (
		<Button
			type='button'
			size='icon'
			variant='ocean'
			className={cn(
				'animate-pop-in [&_svg]:stroke-[3.25]',
				size === 'main' ? 'size-16' : 'size-12',
			)}
			aria-label={t('singleplayer.next')}
			title={t('singleplayer.next')}
			onClick={onNext}
		>
			<ArrowRight
				aria-hidden='true'
				className={size === 'main' ? 'size-9' : 'size-7'}
			/>
		</Button>
	)
}

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
