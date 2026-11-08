import { useMemo } from 'react'
import { Layer } from 'react-map-gl/maplibre'
import {
	BASE_STYLE_LAYER_ID,
	buildArchipelagoLayers,
	buildDimLayer,
	buildHighlightLayer,
	buildSelectionFillLayer,
	buildSelectionLineLayer,
	hoverLayer,
	isSelectionTone,
	LABELS_BOTTOM_LAYER_ID,
} from '../map-styles'
import type { MapHighlight } from '../types'

interface CountryLayersProps {
	interactiveIds: ReadonlySet<string>
	highlights: readonly MapHighlight[]
	dimOpacity?: number
}

export function CountryLayers({
	interactiveIds,
	highlights,
	dimOpacity,
}: CountryLayersProps) {
	const selectedId =
		highlights.find(highlight => isSelectionTone(highlight.tone))
			?.countryId ?? null

	const highlightLayer = useMemo(
		() => buildHighlightLayer(highlights, selectedId),
		[highlights, selectedId],
	)
	const selectionFillLayer = useMemo(
		() => buildSelectionFillLayer(selectedId, selectedId !== null),
		[selectedId],
	)
	const selectionLineLayer = useMemo(
		() => buildSelectionLineLayer(selectedId, selectedId !== null),
		[selectedId],
	)
	const archipelagoLayers = useMemo(
		() => buildArchipelagoLayers(interactiveIds, highlights, selectedId),
		[interactiveIds, highlights, selectedId],
	)
	const dimLayer = useMemo(
		() => buildDimLayer(interactiveIds, true, dimOpacity),
		[dimOpacity, interactiveIds],
	)

	return (
		<>
			<Layer {...archipelagoLayers.fill} beforeId={BASE_STYLE_LAYER_ID} />
			<Layer {...archipelagoLayers.outline} beforeId={BASE_STYLE_LAYER_ID} />
			<Layer {...dimLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
			<Layer {...highlightLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
			<Layer {...selectionFillLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
			<Layer {...selectionLineLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
			<Layer {...hoverLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
		</>
	)
}
