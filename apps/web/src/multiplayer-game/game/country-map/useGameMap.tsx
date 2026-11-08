import type { GameParticipantView } from '@georally/game-domain/multiplayer/game'
import { useCallback, useMemo } from 'react'
import type {
	MapHighlight,
	PickCountryMapProps,
} from '../../../shared/map/types'
import { CountryInfoCard } from '../../../shared/widgets/CountryInfoCard'
import {
	getCorrectCountryInfo,
	getCountryInfo,
} from '../../model/gameSelectors'
import { SelectedAnswerMarker } from './SelectedAnswerMarker'

const EMPTY_HIGHLIGHTS: readonly MapHighlight[] = []
const EMPTY_MARKERS: NonNullable<PickCountryMapProps['markers']> = []
const noopPick = () => undefined

interface UseRoomGameMapArgs {
	game: GameParticipantView
	showCountryInfo: boolean
	submitPending: boolean
	onSubmitAnswer: (countryId: string) => void
}

interface UseRoomGameMapResult {
	mapProps: PickCountryMapProps
}

export function useGameMap({
	game,
	submitPending,
	showCountryInfo,
	onSubmitAnswer,
}: UseRoomGameMapArgs): UseRoomGameMapResult {
	const eligibleCountryIdsKey = game.eligibleCountryIds.join('|')
	const interactiveIds = useMemo<ReadonlySet<string>>(
		() => new Set(game.eligibleCountryIds),
		[game, eligibleCountryIdsKey],
	)

	const isCompleted = game.phase === 'completed'
	const isOpen = game.phase === 'open'
	const correctCountryId =
		game.phase === 'revealed' || game.phase === 'leaderboard'
			? game.correctCountryId
			: null
	const submissionCountryId =
		game.phase === 'completed'
			? null
			: (game.viewerSubmission?.countryId ?? null)

	const correctCountryInfo = getCorrectCountryInfo(game)
	const selectedCountryInfo = getCountryInfo(submissionCountryId)

	const handlePick = useCallback(
		(countryId: string) => {
			void onSubmitAnswer(countryId)
		},
		[onSubmitAnswer],
	)

	const resetViewKey =
		game.phase !== 'completed'
			? `${game.currentQuestionNumber}:${game.startedAt}`
			: null

	const mapProps = useMemo<PickCountryMapProps>(() => {
		if (isCompleted) {
			return {
				onPick: noopPick,
				interactiveIds,
				scope: game.scope,
				highlights: EMPTY_HIGHLIGHTS,
				markers: EMPTY_MARKERS,
				popup: null,
				disabled: true,
				resetViewKey,
			}
		}

		if (isOpen) {
			return {
				onPick: handlePick,
				interactiveIds,
				scope: game.scope,
				highlights: submissionCountryId
					? [
							{
								countryId: submissionCountryId,
								tone: 'selected',
							},
						]
					: EMPTY_HIGHLIGHTS,
				markers:
					submissionCountryId && selectedCountryInfo
						? [
								{
									id: `selected-${submissionCountryId}`,
									longitude: selectedCountryInfo.centroidLng,
									latitude: selectedCountryInfo.centroidLat,
									element: <SelectedAnswerMarker />,
								},
							]
						: EMPTY_MARKERS,
				popup: null,
				disabled: Boolean(submissionCountryId) || submitPending,
				resetViewKey,
			}
		}

		const highlights: NonNullable<MapHighlight[]> = []
		if (correctCountryId) {
			highlights.push({
				countryId: correctCountryId,
				tone: 'correct',
			})
		}

		if (submissionCountryId && submissionCountryId !== correctCountryId) {
			highlights.push({
				countryId: submissionCountryId,
				tone: 'wrong',
			})
		}

		return {
			onPick: noopPick,
			interactiveIds,
			scope: game.scope,
			highlights,
			markers: EMPTY_MARKERS,
			revealTarget: correctCountryInfo
				? {
						countryId: correctCountryInfo.id,
						longitude: correctCountryInfo.centroidLng,
						latitude: correctCountryInfo.centroidLat,
					}
				: null,
			popupElement:
				correctCountryInfo && showCountryInfo ? (
					<CountryInfoCard info={correctCountryInfo} />
				) : null,
			disabled: true,
			resetViewKey,
		}
	}, [
		correctCountryId,
		correctCountryInfo,
		showCountryInfo,
		game.scope,
		handlePick,
		isCompleted,
		interactiveIds,
		isOpen,
		resetViewKey,
		selectedCountryInfo,
		submissionCountryId,
		submitPending,
	])

	return {
		mapProps,
	}
}
