import { useTranslation } from 'react-i18next'
import type { SingleplayerModeId } from '../../paths'
import { GamePanel, LoadingStatus } from './GamePanel'
import { LeaveButton } from './LeaveButton'

export function GameLoader({
	mode,
	leaveTo,
}: {
	mode: SingleplayerModeId
	leaveTo?: string
}) {
	const { t } = useTranslation()

	return (
		<GamePanel
			start={<LeaveButton mode={mode} to={leaveTo} tone='dark' />}
			status={<LoadingStatus label={t('game.loading')} />}
		/>
	)
}
