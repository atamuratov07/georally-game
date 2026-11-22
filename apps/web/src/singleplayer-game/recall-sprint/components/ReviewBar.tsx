import type { SprintEndedBy } from '@georally/game-domain/singleplayer/recall-sprint'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils'
import { LeaveButton } from '../../shared/components/LeaveButton'
import type { BestView } from '../../shared/personalBests'
import { NewBestBadge } from './NewBestBadge'
import { CAPTION_TEXT, SCORE_TEXT } from './scoreText'

interface ReviewBarProps {
	found: number
	total: number
	endedBy: SprintEndedBy
	best: BestView | null
	onLeave: () => void
	className?: string
}

export function ReviewBar({
	found,
	total,
	endedBy,
	best,
	onLeave,
	className,
}: ReviewBarProps) {
	const { t } = useTranslation()

	return (
		<div
			className={cn(
				'pointer-events-none absolute inset-x-3 z-30 flex flex-col items-center',
				className,
			)}
		>
			<LeaveButton
				mode='recall-sprint'
				onLeave={onLeave}
				className='pointer-events-auto absolute top-0 left-0'
			/>
			<p
				role='status'
				className='text-3xl font-black text-sunflower-300 tabular-nums [view-transition-name:sprint-score]'
				style={SCORE_TEXT}
			>
				<span aria-hidden='true'>
					{found} / {total}
				</span>
				<span className='sr-only'>
					{t('recallSprint.found', { found, total })}
				</span>
			</p>
			<p
				className='mt-1 animate-pop-in text-base font-black text-white [animation-delay:650ms]'
				style={CAPTION_TEXT}
			>
				{t(`recallSprint.review.ended.${endedBy}`)}
			</p>
			{best?.setNow && best.previous !== null ? (
				<NewBestBadge className='mt-2 text-sm [animation-delay:800ms]' />
			) : best && !best.setNow ? (
				<p
					className='mt-0.5 animate-pop-in text-sm font-extrabold text-white/90 tabular-nums [animation-delay:800ms]'
					style={CAPTION_TEXT}
				>
					{t('singleplayer.best.current', { value: best.best })}
				</p>
			) : null}
		</div>
	)
}
