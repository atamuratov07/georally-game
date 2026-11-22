import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils'

export function NewBestBadge({ className }: { className?: string }) {
	const { t } = useTranslation()

	return (
		<span
			className={cn(
				'raised inline-block -rotate-3 animate-pop-in rounded-full border-2 border-sunflower-500 bg-sunflower-400 px-4 py-1 text-base font-black text-ink [--edge-size:4px] [--edge:var(--color-sunflower-600)]',
				className,
			)}
		>
			{t('singleplayer.best.new')}
		</span>
	)
}
