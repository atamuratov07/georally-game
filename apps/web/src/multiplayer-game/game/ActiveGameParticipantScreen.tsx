import type { GameParticipantView } from '@georally/game-domain/multiplayer/game'
import type { VisibleMemberInfo } from '@georally/game-domain/multiplayer/room'
import { useTranslation } from 'react-i18next'
import { StatusScreen } from '@/shared/layout'
import { RoomNotices } from '@/shared/widgets/RoomNotices'
import { getCurrentRound } from '../model/gameSelectors'
import { CountryMapGameScreen } from './country-map/CountryMapGameScreen'

interface ActiveGameParticipantScreenProps {
	game: GameParticipantView
	members: VisibleMemberInfo[]
	showCountryInfo: boolean
	submitPending: boolean
	actionErrorMessage: string | null
	isReconnecting: boolean
	onSubmitAnswer: (countryId: string) => Promise<void>
}

export function ActiveGameParticipantScreen({
	game,
	members,
	showCountryInfo,
	submitPending,
	actionErrorMessage,
	isReconnecting,
	onSubmitAnswer,
}: ActiveGameParticipantScreenProps) {
	const { t } = useTranslation()
	const currentRound = getCurrentRound(game)

	if (game.phase === 'completed' || !currentRound) {
		return <StatusScreen title={t('multiplayer.game.finishing')} />
	}

	return (
		<>
			<RoomNotices
				isReconnecting={isReconnecting}
				actionErrorMessage={actionErrorMessage}
			/>

			<CountryMapGameScreen
				game={game}
				currentRound={currentRound}
				members={members}
				showCountryInfo={showCountryInfo}
				submitPending={submitPending}
				onSubmitAnswer={onSubmitAnswer}
			/>
		</>
	)
}
