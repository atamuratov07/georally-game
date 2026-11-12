import { useTranslation } from 'react-i18next'
import type { SingleplayerModeId } from '../../paths'
import { GamePanel, LoadingStatus } from './GamePanel'
import { LeaveButton } from './LeaveButton'

export function GameLoader({ mode }: { mode: SingleplayerModeId }) {
	const { t } = useTranslation()

	return (
		<GamePanel
			start={<LeaveButton mode={mode} tone='dark' />}
			status={<LoadingStatus label={t('game.loading')} />}
		/>
	)
}
