import { Lightbulb } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/utils'

interface HintButtonProps {
	onHint: () => void
	compact?: boolean
	className?: string
}

export function HintButton({ onHint, compact, className }: HintButtonProps) {
	const { t } = useTranslation()

	return (
		<Button
			type='button'
			variant={compact ? 'ghost' : 'neutral'}
			size={compact ? 'icon' : 'lg'}
			className={cn(
				compact
					? 'size-11 rounded-[calc(var(--radius-card)-6px)] bg-sunflower-100 hover:bg-sunflower-200'
					: 'floating h-16 rounded-card border-sunflower-200 bg-sunflower-100 px-5 text-lg text-sunflower-800 [--edge-size:6px] [--edge:var(--color-sunflower-200)] hover:bg-sunflower-50',
				className,
			)}
			aria-label={compact ? t('routes.hint') : undefined}
			title={t('routes.hint')}
			onClick={onHint}
		>
			<Lightbulb
				aria-hidden='true'
				className='size-6 fill-sunflower-300 text-sunflower-600'
			/>
			{compact ? null : t('routes.hint')}
		</Button>
	)
}
