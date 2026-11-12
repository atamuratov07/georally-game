import { useTranslation } from 'react-i18next'
import { LeaveButton } from '../../shared/components/LeaveButton'
import { SCORE_TEXT } from './scoreText'

interface ReviewBarProps {
	found: number
	total: number
	onLeave: () => void
}

export function ReviewBar({ found, total, onLeave }: ReviewBarProps) {
	const { t } = useTranslation()

	return (
		<div className='pointer-events-none absolute inset-x-3 top-3 z-30 flex justify-center'>
			<LeaveButton
				mode='recall-sprint'
				onLeave={onLeave}
				className='pointer-events-auto absolute left-0'
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
		</div>
	)
}
