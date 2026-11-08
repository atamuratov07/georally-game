import type { ActiveGameParticipantView } from '@georally/game-domain/multiplayer/game'
import type { VisibleMemberInfo } from '@georally/game-domain/multiplayer/room'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from '@/app/LocaleContext'
import { getCountryName } from '@/shared/i18n'
import { PickCountryMap } from '@/shared/map/PickCountryMap'
import { GameHud } from '@/shared/widgets/GameHud'
import { ScoreBanner } from '@/shared/widgets/ScoreBanner'
import {
	getLeaderboardEntries,
	getTargetCountryInfo,
	type CurrentRoundView,
} from '../../model/gameSelectors'
import { getMemberColorIndexes } from '../../model/roomSelectors'
import { Countdown } from '../Countdown'
import { RoomLeaderboardOverlay } from './LeaderboardOverlay'
import { useGameMap } from './useGameMap'

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
	const leaderboardEntries = useMemo(() => {
		const colorIndexes = getMemberColorIndexes(members)
		return getLeaderboardEntries(game, members, 5).map(entry => ({
			...entry,
			colorIndex: colorIndexes.get(entry.participantId),
		}))
	}, [game, members])
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
		: t('game.countryFallback')
	const deadlineAt = game.phase === 'open' ? currentRound.deadlineAt : null

	return (
		<section className='flex h-full flex-col overflow-hidden bg-paper'>
			<GameHud
				current={currentRound.currentQuestionNumber}
				total={currentRound.questionCount}
				completed={
					currentRound.currentQuestionNumber -
					(game.phase === 'open' ? 1 : 0)
				}
				targetName={targetName}
				targetFlagUrl={targetInfo?.flagUrl}
				end={
					deadlineAt !== null ? (
						<Countdown deadlineAt={deadlineAt} />
					) : null
				}
			/>

			<main className='relative min-h-0 flex-1'>
				<PickCountryMap {...mapProps} />

				<ScoreBanner
					triggerKey={scoreBannerTriggerKey}
					isCorrect={isCorrect}
					totalScore={game.viewerScore}
					awardedScore={awardedScore}
				/>

				{game.phase === 'leaderboard' ? (
					<RoomLeaderboardOverlay
						entries={leaderboardEntries}
						viewerParticipantId={game.viewerParticipantId}
						shownAt={game.leaderboardShownAt}
					/>
				) : null}
			</main>
		</section>
	)
}
