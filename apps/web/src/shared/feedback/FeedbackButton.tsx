import { MessageSquareText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils'
import { useFeedback } from './useFeedback'

export function FeedbackButton({ className }: { className?: string }) {
	const { t } = useTranslation()
	const openFeedback = useFeedback()

	return (
		<button
			type='button'
			onClick={() => openFeedback()}
			className={cn(
				'inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-extrabold text-ink transition-colors hover:bg-ink/6',
				className,
			)}
		>
			<MessageSquareText
				aria-hidden='true'
				className='size-5'
				strokeWidth={2.5}
			/>
			<span className='max-sm:sr-only'>{t('feedback.open')}</span>
		</button>
	)
}
