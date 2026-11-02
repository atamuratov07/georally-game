import type { ActiveGameParticipantView } from '@georally/game-domain/multiplayer/game'
import type { VisibleMemberInfo } from '@georally/game-domain/multiplayer/room'
import { useMemo } from 'react'
import { MapRenderer } from '../../../shared/map/MapRenderer'
import { ScoreBanner } from '../../../shared/widgets/ScoreBanner'
import {
	getLeaderboardEntries,
	getTargetCountryInfo,
	type CurrentRoundView,
} from '../../model/gameSelectors'
import { GameQuestionBar } from './GameQuestionBar'
import { RoomLeaderboardOverlay } from './LeaderboardOverlay'
import { useGameMap } from './useGameMap'
import { useTranslation } from 'react-i18next'
import { getCountryName } from '../../../shared/i18n'
import { useCurrentLocale } from '../../../app/LocaleContext'

interface CountryMapGameScreenProps {
	game: ActiveGameParticipantView
	members: VisibleMemberInfo[]
	showCountryInfo: boolean
	submitPending: boolean
	currentRound: CurrentRoundView
	onSubmitAnswer: (countryId: string) => Promise<void>
}

export function CountryMapGameScreen({
	game,
	currentRound,
	members,
	showCountryInfo,
	submitPending,
	onSubmitAnswer,
}: CountryMapGameScreenProps) {
	const { t } = useTranslation()
	const language = useCurrentLocale()
	const { mapProps } = useGameMap({
		game,
		submitPending,
		onSubmitAnswer,
		showCountryInfo,
	})
	const leaderboardEntries = useMemo(
		() => getLeaderboardEntries(game, members, 5),
		[game, members],
	)
	const evaluatedSubmission =
		game.phase === 'open' ? null : game.viewerSubmission
	const scoreBannerTriggerKey =
		game.phase === 'revealed' ? game.revealedAt : null
	const awardedScore = evaluatedSubmission?.scoreAwarded ?? 0
	const isCorrect =
		evaluatedSubmission && evaluatedSubmission.countryId !== null
			? evaluatedSubmission.isCorrect
			: null
	const targetInfo = getTargetCountryInfo(game)
	const targetName = targetInfo
		? getCountryName(targetInfo, language)
		: t('multiplayer.game.countryFallback')

	return (
		<section className='flex h-full flex-col overflow-hidden bg-slate-950 text-white'>
			<main className='relative min-h-0 flex-1'>
				<MapRenderer {...mapProps} />
			</main>

			<GameQuestionBar
				progressLabel={`${currentRound.currentQuestionNumber} / ${currentRound.questionCount}`}
				questionLabel={
					game.phase === 'open'
						? t('multiplayer.game.findCountry')
						: t('multiplayer.game.correctAnswer')
				}
				targetName={targetName}
				targetFlagUrl={targetInfo?.flagUrl}
				deadlineAt={game.phase === 'open' ? currentRound.deadlineAt : null}
			/>

			<ScoreBanner
				triggerKey={scoreBannerTriggerKey}
				isCorrect={isCorrect}
				totalScore={game.viewerScore}
				awardedScore={awardedScore}
				className='top-10'
			/>

			{game.phase === 'leaderboard' ? (
				<RoomLeaderboardOverlay
					entries={leaderboardEntries}
					viewerParticipantId={game.viewerParticipantId}
					shownAt={game.leaderboardShownAt}
				/>
			) : null}
		</section>
	)
}
