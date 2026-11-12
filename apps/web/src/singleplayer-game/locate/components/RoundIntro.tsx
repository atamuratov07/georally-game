import { useTranslation } from 'react-i18next'
import { ProgressStrip } from '@/shared/widgets/GameHud'
import { GamePanel, LoadingStatus } from '../../shared/components/GamePanel'
import { LeaveButton } from '../../shared/components/LeaveButton'
import { RoundSplash, type RoundInfo } from './RoundSplash'

export function RoundIntro({
	round,
	ready,
}: {
	round: RoundInfo
	ready: boolean
}) {
	const { t } = useTranslation()

	return (
		<GamePanel
			className='vt-panel'
			start={<LeaveButton mode='locate' tone='dark' />}
			status={
				<LoadingStatus
					label={ready ? t('game.go') : t('game.loadingMap')}
					done={ready}
				/>
			}
		>
			<RoundSplash round={round} entrance />
			<ProgressStrip
				completed={round.completed}
				total={round.total}
				className='absolute inset-x-0 bottom-0'
			/>
		</GamePanel>
	)
}
