import { countryCatalog } from '@georally/country-catalog'
import { useCallback, useMemo, useState } from 'react'
import { isTinyAt, MAX_FIT_ZOOM } from '@/shared/map/camera/framing'
import type { FitTarget } from '@/shared/map/camera/useFitCamera'
import { TinyCountryRing } from '@/shared/map/TinyCountryRing'
import type {
	MapHighlight,
	MapMarker,
	MapRevealTarget,
} from '@/shared/map/types'
import type { AnswerStage } from '../answering/useAnswerField'

const NO_IDS: readonly string[] = []
const NO_HIGHLIGHTS: readonly MapHighlight[] = []
const NO_MARKERS: readonly MapMarker[] = []

export type FocusKind = 'round' | 'reveal'

interface TargetRoundMapOptions {
	roundKey: string
	targetId: string | null
	stage: AnswerStage
	correct: boolean
	onSettled: (focus: FocusKind) => void
}

export type TargetRoundMap = ReturnType<typeof useTargetRoundMap>

export function useTargetRoundMap({
	roundKey,
	targetId,
	stage,
	correct,
	onSettled,
}: TargetRoundMapOptions) {
	const [settled, setSettled] = useState<{
		roundKey: string
		key: string
	} | null>(null)

	const targetInfo = targetId
		? countryCatalog.countriesById.get(targetId)
		: undefined
	const bounds = targetInfo?.bounds
	const focusKind: FocusKind = stage === 'revealed' ? 'reveal' : 'round'
	const focusKey = `${roundKey}:${focusKind}`
	const focus = useMemo<FitTarget | null>(
		() => (bounds ? { key: focusKey, bounds } : null),
		[bounds, focusKey],
	)
	const roundSettled = settled?.roundKey === roundKey
	const shown = roundSettled && stage !== 'waiting'

	const handleFocusSettled = useCallback(
		(key: string) => {
			setSettled({ roundKey, key })
			onSettled(focusKind)
		},
		[focusKind, onSettled, roundKey],
	)

	const highlights = useMemo<readonly MapHighlight[]>(
		() =>
			shown && targetId
				? [
						{
							countryId: targetId,
							tone:
								stage === 'answering'
									? 'target'
									: correct
										? 'correct'
										: 'wrong',
						},
					]
				: NO_HIGHLIGHTS,
		[correct, shown, stage, targetId],
	)

	const labelIds = useMemo(
		() => (stage === 'revealed' && targetId ? [targetId] : NO_IDS),
		[stage, targetId],
	)

	const markers = useMemo<readonly MapMarker[]>(
		() =>
			shown && targetInfo && isTinyAt(targetInfo.bounds, MAX_FIT_ZOOM)
				? [
						{
							id: 'tiny-target',
							longitude: targetInfo.centroidLng,
							latitude: targetInfo.centroidLat,
							anchor: 'center',
							element: <TinyCountryRing />,
						},
					]
				: NO_MARKERS,
		[shown, targetInfo],
	)

	const revealSettled = stage === 'revealed' && settled?.key === focus?.key
	const reveal = useMemo<MapRevealTarget | null>(
		() =>
			revealSettled && targetInfo
				? {
						countryId: targetInfo.id,
						longitude: targetInfo.centroidLng,
						latitude: targetInfo.centroidLat,
					}
				: null,
		[revealSettled, targetInfo],
	)

	return {
		roundKey,
		targetId,
		targetInfo,
		focus,
		settled: roundSettled,
		outlined: stage === 'answering' && roundSettled,
		highlights,
		labelIds,
		markers,
		reveal,
		handleFocusSettled,
	}
}
