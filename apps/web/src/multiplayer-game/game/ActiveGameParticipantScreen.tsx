import type { GameParticipantView } from '@georally/game-domain/multiplayer/game'
import type { VisibleMemberInfo } from '@georally/game-domain/multiplayer/room'
import { CountryMapGameScreen } from './country-map/CountryMapGameScreen'
import { getCurrentRound } from '../model/gameSelectors'
import { AnimatePresence } from 'motion/react'
import { FloatingNotice } from '../../shared/ui/FloatingNotice'
import { useTranslation } from 'react-i18next'

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
		return (
			<main className='grid h-full place-items-center bg-slate-950 px-5 py-8 text-white'>
				<p className='text-sm font-semibold text-slate-300'>
					{t('multiplayer.game.finishing')}
				</p>
			</main>
		)
	}

	// Add a game.kind switch here when the domain exposes multiple variants.
	return (
		<>
			<AnimatePresence mode='wait'>
				{isReconnecting ? (
					<FloatingNotice>
						{t('multiplayer.lobby.reconnecting')}
					</FloatingNotice>
				) : null}
			</AnimatePresence>

			<AnimatePresence mode='wait'>
				{actionErrorMessage ? (
					<FloatingNotice
						tone='error'
						offsetTop={isReconnecting ? 'stacked' : 'default'}
					>
						{actionErrorMessage}
					</FloatingNotice>
				) : null}
			</AnimatePresence>

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
