import type {
	FillLayerSpecification,
	FilterSpecification,
	LineLayerSpecification,
} from 'maplibre-gl'
import {
	ARCHIPELAGO_SOURCE_ID,
	COUNTRY_LAYER,
	SELECTION_EDGE,
	SELECTION_FILL,
	SOURCE_ID,
} from '@/shared/map/map-styles'

export function buildLiftedLayers(countryId: string | null) {
	const filter: FilterSpecification = [
		'==',
		['get', 'iso_n3'],
		countryId ?? '__none__',
	]
	const islandsTint: FillLayerSpecification = {
		id: 'sprint-lifted-islands-tint',
		type: 'fill',
		source: ARCHIPELAGO_SOURCE_ID,
		filter,
		paint: { 'fill-color': SELECTION_FILL, 'fill-opacity': 0.15 },
	}
	const shadow: FillLayerSpecification = {
		id: 'sprint-lifted-shadow',
		type: 'fill',
		source: SOURCE_ID,
		'source-layer': COUNTRY_LAYER,
		filter,
		paint: {
			'fill-color': '#18223d',
			'fill-opacity': 0.3,
			'fill-translate': [0, 6],
		},
	}
	const surface: FillLayerSpecification = {
		id: 'sprint-lifted-surface',
		type: 'fill',
		source: SOURCE_ID,
		'source-layer': COUNTRY_LAYER,
		filter,
		paint: {
			'fill-color': SELECTION_FILL,
			'fill-opacity': 0.95,
		},
	}
	const edge: LineLayerSpecification = {
		id: 'sprint-lifted-edge',
		type: 'line',
		source: SOURCE_ID,
		'source-layer': COUNTRY_LAYER,
		filter,
		paint: {
			'line-color': SELECTION_EDGE,
			'line-width': 3,
		},
	}
	const islands: LineLayerSpecification = {
		id: 'sprint-lifted-islands',
		type: 'line',
		source: ARCHIPELAGO_SOURCE_ID,
		filter,
		layout: { 'line-join': 'round' },
		paint: {
			'line-color': SELECTION_EDGE,
			'line-width': 3,
		},
	}
	return { islandsTint, shadow, surface, edge, islands }
}
