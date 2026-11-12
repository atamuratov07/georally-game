import { useTranslation } from 'react-i18next'
import { ProgressStrip, TimerChip } from '@/shared/widgets/GameHud'
import { GamePanel } from '../../shared/components/GamePanel'
import { LeaveButton } from '../../shared/components/LeaveButton'
import { RoundSplash, type RoundInfo } from './RoundSplash'

export function RoundPanel({ round }: { round: RoundInfo }) {
	const { t } = useTranslation()

	return (
		<GamePanel
			className='vt-panel'
			start={<LeaveButton mode='locate' tone='dark' />}
			end={<TimerChip seconds={0} label={t('game.elapsed')} />}
		>
			<RoundSplash round={round} />
			<ProgressStrip
				completed={round.completed}
				total={round.total}
				className='absolute inset-x-0 bottom-0'
			/>
		</GamePanel>
	)
}
