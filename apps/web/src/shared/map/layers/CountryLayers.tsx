import { useMemo } from 'react'
import { Layer } from 'react-map-gl/maplibre'
import {
	ACTIVE_STATE,
	ARCHIPELAGO_SOURCE_ID,
	archipelagoFillLayer,
	archipelagoOutlineLayer,
	BASE_STYLE_LAYER_ID,
	buildDimLayer,
	buildSelectionFillLayer,
	buildSelectionLineLayer,
	COUNTRY_LAYER,
	highlightLayer,
	hoverLayer,
	isSelectionTone,
	LABELS_BOTTOM_LAYER_ID,
	SELECTED_STATE,
	SHOWN_STATE,
	SOURCE_ID,
	TONE_STATE,
} from '../map-styles'
import type { MapHighlight } from '../types'
import {
	flagsFor,
	useFeatureState,
	type FeatureStates,
} from '../useFeatureState'

const WORLD = { source: SOURCE_ID, sourceLayer: COUNTRY_LAYER }
const ISLANDS = { source: ARCHIPELAGO_SOURCE_ID }

interface CountryLayersProps {
	loaded: boolean
	interactiveIds: ReadonlySet<string>
	highlights: readonly MapHighlight[]
	dimOpacity?: number
}

export function CountryLayers({
	loaded,
	interactiveIds,
	highlights,
	dimOpacity,
}: CountryLayersProps) {
	const selectedId =
		highlights.find(highlight => isSelectionTone(highlight.tone))
			?.countryId ?? null

	// The selected country is drawn by the selection layers, so it can fade in;
	// its islands take the selection colour instead.
	const { countryTones, islandTones } = useMemo(() => {
		const countries = new Map<string, string>()
		const islands = new Map<string, string>()
		for (const { countryId, tone } of highlights) {
			const isSelected = isSelectionTone(tone) && countryId === selectedId
			if (!isSelected) {
				countries.set(countryId, tone)
			}
			islands.set(countryId, isSelected ? 'target' : tone)
		}
		return {
			countryTones: countries as FeatureStates,
			islandTones: islands as FeatureStates,
		}
	}, [highlights, selectedId])

	const active = useMemo(() => flagsFor(interactiveIds), [interactiveIds])
	const shownIslands = useMemo(
		() => flagsFor([...interactiveIds, ...islandTones.keys()]),
		[interactiveIds, islandTones],
	)
	const selected = useMemo(() => flagsFor([selectedId]), [selectedId])

	useFeatureState(loaded, WORLD, ACTIVE_STATE, active)
	useFeatureState(loaded, WORLD, TONE_STATE, countryTones)
	useFeatureState(loaded, WORLD, SELECTED_STATE, selected)
	useFeatureState(loaded, ISLANDS, TONE_STATE, islandTones)
	useFeatureState(loaded, ISLANDS, SHOWN_STATE, shownIslands)

	const hasSelection = selectedId !== null
	const selectionFillLayer = useMemo(
		() => buildSelectionFillLayer(hasSelection),
		[hasSelection],
	)
	const selectionLineLayer = useMemo(
		() => buildSelectionLineLayer(hasSelection),
		[hasSelection],
	)
	const dimLayer = useMemo(() => buildDimLayer(dimOpacity), [dimOpacity])

	return (
		<>
			<Layer {...archipelagoFillLayer} beforeId={BASE_STYLE_LAYER_ID} />
			<Layer {...archipelagoOutlineLayer} beforeId={BASE_STYLE_LAYER_ID} />
			<Layer {...dimLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
			<Layer {...highlightLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
			<Layer {...selectionFillLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
			<Layer {...selectionLineLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
			<Layer {...hoverLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
		</>
	)
}
