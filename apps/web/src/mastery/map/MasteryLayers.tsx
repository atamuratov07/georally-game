import type { CountryId } from '@georally/game-domain'
import type { MasteryLayer, MasteryLevel } from '@georally/mastery'
import { useMemo } from 'react'
import { Layer } from 'react-map-gl/maplibre'
import { TinyCountryRings } from '@/shared/map/layers/TinyCountryRings'
import {
	COUNTRY_LAYER,
	LABELS_BOTTOM_LAYER_ID,
	OUTLINED_STATE,
	SOURCE_ID,
} from '@/shared/map/map-styles'
import { flagsFor, useFeatureState } from '@/shared/map/useFeatureState'
import {
	FADING_STATE,
	MASTERY_STATE,
	masteryFadingLayer,
	masteryFillLayer,
	masteryOutlineLayer,
	RING_COLORS,
} from './masteryStyles'

const WORLD = { source: SOURCE_ID, sourceLayer: COUNTRY_LAYER }

export function MasteryLayers({
	loaded,
	layer,
	outlinedIds,
	outlineColor,
}: {
	loaded: boolean
	layer: MasteryLayer
	outlinedIds: readonly CountryId[]
	outlineColor: string
}) {
	const { levels, fading, ringColors } = useMemo(() => {
		const levels = new Map<CountryId, MasteryLevel>()
		const fading: CountryId[] = []
		const ringColors: Record<CountryId, string> = {}
		for (const [countryId, view] of layer) {
			levels.set(countryId, view.level)
			if (view.fading) fading.push(countryId)
			ringColors[countryId] = RING_COLORS[view.level]
		}
		return { levels, fading: flagsFor(fading), ringColors }
	}, [layer])
	const outlined = useMemo(() => flagsFor(outlinedIds), [outlinedIds])
	const outlineLayer = useMemo(
		() => masteryOutlineLayer(outlineColor),
		[outlineColor],
	)

	useFeatureState(loaded, WORLD, MASTERY_STATE, levels)
	useFeatureState(loaded, WORLD, FADING_STATE, fading)
	useFeatureState(loaded, WORLD, OUTLINED_STATE, outlined)

	return (
		<>
			<Layer {...masteryFillLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
			{loaded ? (
				<Layer {...masteryFadingLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
			) : null}
			<Layer {...outlineLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
			<TinyCountryRings countryIds={levels.keys()} colors={ringColors} />
		</>
	)
}
