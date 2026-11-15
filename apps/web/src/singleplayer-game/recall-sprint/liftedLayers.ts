import type {
	FillLayerSpecification,
	LineLayerSpecification,
} from 'maplibre-gl'
import {
	ARCHIPELAGO_SOURCE_ID,
	COUNTRY_LAYER,
	LIFTED_STATE,
	SELECTION_EDGE,
	SELECTION_FILL,
	SOURCE_ID,
	stateFlag,
} from '@/shared/map/map-styles'

const lifted = stateFlag(LIFTED_STATE)

const islandsTint: FillLayerSpecification = {
	id: 'sprint-lifted-islands-tint',
	type: 'fill',
	source: ARCHIPELAGO_SOURCE_ID,
	paint: {
		'fill-color': SELECTION_FILL,
		'fill-opacity': ['case', lifted, 0.15, 0],
	},
}

const shadow: FillLayerSpecification = {
	id: 'sprint-lifted-shadow',
	type: 'fill',
	source: SOURCE_ID,
	'source-layer': COUNTRY_LAYER,
	paint: {
		'fill-color': '#18223d',
		'fill-opacity': ['case', lifted, 0.3, 0],
		'fill-translate': [0, 6],
	},
}

const surface: FillLayerSpecification = {
	id: 'sprint-lifted-surface',
	type: 'fill',
	source: SOURCE_ID,
	'source-layer': COUNTRY_LAYER,
	paint: {
		'fill-color': SELECTION_FILL,
		'fill-opacity': ['case', lifted, 0.95, 0],
	},
}

const edge: LineLayerSpecification = {
	id: 'sprint-lifted-edge',
	type: 'line',
	source: SOURCE_ID,
	'source-layer': COUNTRY_LAYER,
	paint: {
		'line-color': SELECTION_EDGE,
		'line-width': 3,
		'line-opacity': ['case', lifted, 1, 0],
	},
}

const islands: LineLayerSpecification = {
	id: 'sprint-lifted-islands',
	type: 'line',
	source: ARCHIPELAGO_SOURCE_ID,
	layout: { 'line-join': 'round' },
	paint: {
		'line-color': SELECTION_EDGE,
		'line-width': 3,
		'line-opacity': ['case', lifted, 1, 0],
	},
}

export const liftedLayers = [islandsTint, shadow, surface, edge, islands]
