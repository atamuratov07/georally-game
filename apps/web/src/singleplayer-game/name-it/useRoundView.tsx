import { countryCatalog } from '@georally/country-catalog'
import {
	getOutcome,
	getQuestionCount,
	getQuestionIndex,
	getTargetId,
	type GameState,
} from '@georally/game-domain/singleplayer/name-it'
import { useCallback, useMemo, useState } from 'react'
import { isTinyAt, MAX_FIT_ZOOM } from '@/shared/map/camera/framing'
import type { FitTarget } from '@/shared/map/camera/useFitCamera'
import { TinyCountryRing } from '@/shared/map/TinyCountryRing'
import type {
	MapHighlight,
	MapMarker,
	MapRevealTarget,
} from '@/shared/map/types'
import type { AnswerStage } from './roundControls'

const NO_IDS: readonly string[] = []
const NO_HIGHLIGHTS: readonly MapHighlight[] = []
const NO_MARKERS: readonly MapMarker[] = []

interface SettledRound {
	roundKey: string
	key: string
}

interface RoundViewOptions {
	state: GameState
	upcomingTargetId: string | null
	onBegin: () => void
	onNext: () => void
}

export function useRoundView({
	state,
	upcomingTargetId,
	onBegin,
	onNext,
}: RoundViewOptions) {
	const [advancing, setAdvancing] = useState(false)
	const [settled, setSettled] = useState<SettledRound | null>(null)

	const phase = state.phase
	const index = getQuestionIndex(state)
	const total = getQuestionCount(state) || state.config.questionCount
	const targetId = getTargetId(state)
	const outcome = getOutcome(state)
	const targetInfo = targetId
		? countryCatalog.countriesById.get(targetId)
		: undefined
	const revealed = phase === 'revealed' && !advancing
	const round =
		state.phase === 'answering' || state.phase === 'revealed' ? state : null

	const focusCountryId =
		phase === 'idle' || advancing ? upcomingTargetId : targetId
	const focusRound = phase === 'idle' ? 0 : advancing ? index + 1 : index
	const roundKey = `${focusRound}:${focusCountryId}`
	const focusStage = revealed ? 'reveal' : 'round'
	const focusBounds = focusCountryId
		? countryCatalog.countriesById.get(focusCountryId)?.bounds
		: undefined
	const focus = useMemo<FitTarget | null>(
		() =>
			focusCountryId && focusBounds
				? { key: `${roundKey}:${focusStage}`, bounds: focusBounds }
				: null,
		[focusBounds, focusCountryId, focusStage, roundKey],
	)
	const isRoundSettled = !advancing && settled?.roundKey === roundKey

	const handleFocusSettled = useCallback(
		(key: string) => {
			setSettled({ roundKey, key })
			if (phase === 'idle') {
				onBegin()
			} else if (advancing) {
				setAdvancing(false)
				onNext()
			}
		},
		[advancing, onBegin, onNext, phase, roundKey],
	)

	const handleNext = useCallback(() => {
		if (upcomingTargetId) {
			setAdvancing(true)
		} else {
			onNext()
		}
	}, [onNext, upcomingTargetId])

	const highlights = useMemo<readonly MapHighlight[]>(() => {
		if (!targetId || !isRoundSettled || !round) {
			return NO_HIGHLIGHTS
		}
		if (round.phase === 'answering') {
			return [{ countryId: targetId, tone: 'target' }]
		}
		return [
			{
				countryId: targetId,
				tone: outcome === 'correct' ? 'correct' : 'wrong',
			},
		]
	}, [isRoundSettled, outcome, round, targetId])

	const labelIds = useMemo(
		() => (revealed && targetId ? [targetId] : NO_IDS),
		[revealed, targetId],
	)

	const markers = useMemo<readonly MapMarker[]>(() => {
		if (
			!targetInfo ||
			!round ||
			!isRoundSettled ||
			!isTinyAt(targetInfo.bounds, MAX_FIT_ZOOM)
		) {
			return NO_MARKERS
		}
		return [
			{
				id: 'tiny-target',
				longitude: targetInfo.centroidLng,
				latitude: targetInfo.centroidLat,
				anchor: 'center',
				element: <TinyCountryRing />,
			},
		]
	}, [isRoundSettled, round, targetInfo])

	const isRevealSettled = revealed && settled?.key === focus?.key
	const reveal = useMemo<MapRevealTarget | null>(
		() =>
			isRevealSettled && targetInfo
				? {
						countryId: targetInfo.id,
						longitude: targetInfo.centroidLng,
						latitude: targetInfo.centroidLat,
					}
				: null,
		[isRevealSettled, targetInfo],
	)

	const stage: AnswerStage =
		phase === 'answering' && !advancing
			? 'answering'
			: revealed
				? 'revealed'
				: 'waiting'

	return {
		stage,
		roundKey,
		targetId,
		targetInfo,
		outcome,
		revealed,
		isRoundSettled,
		timing: round && !advancing ? round : null,
		progress: { current: Math.min(index + 1, total), total },
		focus,
		highlights,
		labelIds,
		markers,
		reveal,
		handleFocusSettled,
		handleNext,
	}
}
