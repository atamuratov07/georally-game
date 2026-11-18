import type {
	DataDrivenPropertyValueSpecification,
	ExpressionSpecification,
	MapGeoJSONFeature,
} from 'maplibre-gl'
import type {
	CircleLayerSpecification,
	FillLayerSpecification,
	LineLayerSpecification,
	SymbolLayerSpecification,
} from 'react-map-gl/maplibre'
import type { AppLanguage } from '../i18n'
import type { MapHighlightTone } from './types'

export const SOURCE_ID = 'world'
export const SOURCE_LAYER_ID = 'countries'
export const COUNTRY_LAYER = 'countries'
export const CENTROIDS_LAYER = 'centroids'
export const CAPITALS_LAYER = 'capitals'
export const GEOLINES_LAYER = 'geolines'
export const SEAS_LAYER = 'seas'

export const BASE_STYLE_LAYER_ID = 'countries-fill'
export const HOVER_LAYER_ID = 'countries-hovered'
export const HIGHLIGHT_LAYER_ID = 'countries-highlighted'
export const SELECTION_FILL_LAYER_ID = 'countries-selection-fill'
export const SELECTION_LINE_LAYER_ID = 'countries-selection-line'
export const DIM_LAYER_ID = 'countries-dimmed'
export const COUNTRY_LABEL_LAYER_ID = 'countries-label'
export const CAPITAL_LABEL_LAYER_ID = 'capitals-label'
export const CAPITAL_DOT_LAYER_ID = 'capitals-dot'
export const GEOLINES_LABEL_LAYER_ID = 'geolines-label'
export const SEA_LABEL_LAYER_ID = 'seas-label'
export const ARCHIPELAGO_SOURCE_ID = 'archipelagos'
export const ARCHIPELAGO_FILL_LAYER_ID = 'archipelagos-fill'
export const ARCHIPELAGO_OUTLINE_LAYER_ID = 'archipelagos-outline'
export const LABELS_BOTTOM_LAYER_ID = 'geolines'
export const TARGET_OUTLINE_LAYER_ID = 'countries-target-outline'

export const GLYPHS_URL = '/map/fonts/{fontstack}/{range}.pbf'
export const COUNTRY_LABEL_FONT = 'Noto Sans Bold'
export const CAPITAL_LABEL_FONT = 'Noto Sans Regular'
export const SEA_LABEL_FONT = 'Noto Sans Italic'

export const WATER_FILL = '#D8F2FF'
export const WRONG_FILL = '#fb5f4c'
export const REVEALED_FILL = '#3fa625'
export const SELECTION_FILL = '#ffc01a'
export const SELECTION_EDGE = '#a86200'
const SELECTION_FADE_MS = 350
export const SELECTED_FILL = '#8148f0'

const TONE_FILL: Record<MapHighlightTone, string> = {
	correct: REVEALED_FILL,
	wrong: WRONG_FILL,
	selected: SELECTED_FILL,
	target: SELECTION_FILL,
}

export function isSelectionTone(tone: MapHighlightTone): boolean {
	return tone === 'selected' || tone === 'target'
}

const zoomStops = <T,>(...stops: Array<[number, T]>): Array<[number, T]> =>
	stops

type TextFieldLayoutValue = NonNullable<
	SymbolLayerSpecification['layout']
>['text-field']

function labelTextField(language: AppLanguage): TextFieldLayoutValue {
	return ['get', `label_${language.toLowerCase().replace('-', '_')}`]
}

export const HOVER_STATE = 'hover'
/** The country can be picked, so it isn't dimmed. */
export const ACTIVE_STATE = 'active'
/** A `MapHighlightTone`. */
export const TONE_STATE = 'tone'
export const SELECTED_STATE = 'selected'
export const REGION_STATE = 'region'
export const REVEALED_STATE = 'revealed'
export const LIFTED_STATE = 'lifted'
export const OUTLINED_STATE = 'outlined'
/** An archipelago outline is drawn and can be picked. */
export const SHOWN_STATE = 'shown'

export function stateFlag(key: string): ExpressionSpecification {
	return ['boolean', ['feature-state', key], false]
}

const toneState: ExpressionSpecification = [
	'to-string',
	['feature-state', TONE_STATE],
]
const hasTone: ExpressionSpecification = ['!=', toneState, '']

function toneColor(fallback: string): ExpressionSpecification {
	return [
		'match',
		toneState,
		...Object.entries(TONE_FILL).flat(),
		fallback,
	] as ExpressionSpecification
}

export const highlightLayer: FillLayerSpecification = {
	id: HIGHLIGHT_LAYER_ID,
	type: 'fill',
	source: SOURCE_ID,
	'source-layer': COUNTRY_LAYER,
	paint: {
		'fill-color': toneColor('transparent'),
		'fill-outline-color': '#ffffff',
		'fill-opacity': 0.85,
	},
}

export function buildDimLayer(opacity = 0.75): FillLayerSpecification {
	return {
		id: DIM_LAYER_ID,
		type: 'fill',
		source: SOURCE_ID,
		'source-layer': COUNTRY_LAYER,
		paint: {
			'fill-color': '#eeeeee',
			'fill-outline-color': '#ffffff',
			'fill-opacity': ['case', stateFlag(ACTIVE_STATE), 0, opacity],
		},
	}
}

interface DimTone {
	color: string
	opacity: number
}

export function buildRevealDimLayer({
	region,
	outside,
}: {
	region: DimTone
	outside: DimTone
}): FillLayerSpecification {
	const inRegion = stateFlag(REGION_STATE)

	return {
		id: DIM_LAYER_ID,
		type: 'fill',
		source: SOURCE_ID,
		'source-layer': COUNTRY_LAYER,
		paint: {
			'fill-color': ['case', inRegion, region.color, outside.color],
			'fill-outline-color': '#ffffff',
			'fill-opacity': [
				'case',
				stateFlag(REVEALED_STATE),
				0,
				inRegion,
				region.opacity,
				outside.opacity,
			],
		},
	}
}

export const hoverLayer: FillLayerSpecification = {
	id: HOVER_LAYER_ID,
	type: 'fill',
	source: SOURCE_ID,
	'source-layer': COUNTRY_LAYER,
	paint: {
		'fill-outline-color': '#5527aa',
		'fill-color': '#9b6cfb',
		'fill-opacity': ['case', stateFlag(HOVER_STATE), 0.75, 0],
	},
}

export function buildCountryLabelLayer(
	language: AppLanguage,
): SymbolLayerSpecification {
	return {
		id: COUNTRY_LABEL_LAYER_ID,
		type: 'symbol',
		source: SOURCE_ID,
		'source-layer': CENTROIDS_LAYER,
		filter: ['all'],
		minzoom: 2,
		maxzoom: 24,
		layout: {
			'text-field': labelTextField(language),
			'text-font': [COUNTRY_LABEL_FONT],
			'text-size': {
				type: 'exponential',
				stops: zoomStops([2, 10], [4, 12], [6, 16]),
			},
			visibility: 'visible',
			'symbol-sort-key': ['get', 'rank'],
			'text-max-width': 14,
			'text-transform': {
				type: 'interval',
				stops: zoomStops<'none' | 'uppercase' | 'lowercase'>(
					[0, 'uppercase'],
					[2, 'none'],
				),
			},
		},
		paint: {
			'text-color': 'rgba(8, 37, 77, 1)',
			'text-halo-blur': {
				type: 'exponential',
				stops: zoomStops([2, 0.2], [6, 0]),
			},
			'text-halo-color': 'rgba(255, 255, 255, 1)',
			'text-halo-width': {
				type: 'exponential',
				stops: zoomStops([2, 1], [6, 1.6]),
			},
		},
	}
}

export function buildCapitalLabelLayer(
	language: AppLanguage,
): SymbolLayerSpecification {
	return {
		id: CAPITAL_LABEL_LAYER_ID,
		type: 'symbol',
		source: SOURCE_ID,
		'source-layer': CAPITALS_LAYER,
		minzoom: 3,
		layout: {
			'text-field': labelTextField(language),
			'text-font': [CAPITAL_LABEL_FONT],
			'text-size': {
				type: 'exponential',
				stops: zoomStops([2, 9], [6, 12]),
			},
			'text-offset': [0, 1],
			'text-anchor': 'top',
		},
		paint: {
			'text-color': '#0f172a',
			'text-halo-color': '#ffffff',
			'text-halo-width': 1,
		},
	}
}

export function buildGeolinesLablelLayer(
	language: AppLanguage,
): SymbolLayerSpecification {
	return {
		id: GEOLINES_LABEL_LAYER_ID,
		type: 'symbol',
		source: SOURCE_ID,
		'source-layer': GEOLINES_LAYER,
		minzoom: 1,
		maxzoom: 24,
		filter: ['all', ['!=', 'name', 'International Date Line']],
		paint: {
			'text-color': '#1077B0',
			'text-halo-blur': 1,
			'text-halo-color': 'rgba(255, 255, 255, 1)',
			'text-halo-width': 1,
		},
		layout: {
			'text-field': labelTextField(language),
			'text-font': ['Noto Sans Regular'],
			'text-size': {
				type: 'exponential',
				stops: zoomStops([2, 12], [6, 16]),
			},
			visibility: 'visible',
			'symbol-placement': 'line',
		},
	}
}

const isOcean: ExpressionSpecification = ['==', ['get', 'kind'], 'ocean']

export function buildSeaLabelLayer(
	language: AppLanguage,
): SymbolLayerSpecification {
	return {
		id: SEA_LABEL_LAYER_ID,
		type: 'symbol',
		source: SOURCE_ID,
		'source-layer': SEAS_LAYER,
		layout: {
			'text-field': labelTextField(language),
			'text-font': [SEA_LABEL_FONT],
			'text-size': [
				'interpolate',
				['linear'],
				['zoom'],
				1,
				['case', isOcean, 11, 9],
				6,
				['case', isOcean, 22, 14],
			],
			'text-letter-spacing': ['case', isOcean, 0.12, 0.04],
			'text-max-width': 7,
			'symbol-sort-key': ['get', 'rank'],
		},
		paint: {
			'text-color': '#3f86bd',
			'text-halo-color': WATER_FILL,
			'text-halo-width': 1,
		},
	}
}

const capitalRadiusByZoom: DataDrivenPropertyValueSpecification<number> = [
	'interpolate',
	['linear'],
	['zoom'],
	1,
	1.4,
	2,
	1.8,
	6,
	3.2,
]

export const capitalDotLayer: CircleLayerSpecification = {
	id: CAPITAL_DOT_LAYER_ID,
	type: 'circle',
	source: SOURCE_ID,
	'source-layer': CAPITALS_LAYER,
	minzoom: 3,
	paint: {
		'circle-color': '#0f172a',
		'circle-radius': capitalRadiusByZoom,
		'circle-stroke-color': '#ffffff',
		'circle-stroke-width': 1,
	},
}

// Drawn under the country fills, so they show over sea only and land keeps priority on click;
export const archipelagoFillLayer: FillLayerSpecification = {
	id: ARCHIPELAGO_FILL_LAYER_ID,
	type: 'fill',
	source: ARCHIPELAGO_SOURCE_ID,
	paint: {
		'fill-color': [
			'case',
			stateFlag(HOVER_STATE),
			'#9b6cfb',
			toneColor('#ffffff'),
		],
		'fill-opacity': ['case', stateFlag(HOVER_STATE), 0.3, hasTone, 0.4, 0],
	},
}

export const archipelagoOutlineLayer: LineLayerSpecification = {
	id: ARCHIPELAGO_OUTLINE_LAYER_ID,
	type: 'line',
	source: ARCHIPELAGO_SOURCE_ID,
	layout: { 'line-join': 'round' },
	paint: {
		'line-color': [
			'case',
			stateFlag(HOVER_STATE),
			'#5527aa',
			toneColor('#1077B0'),
		],
		'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1, 6, 2],
		'line-opacity': ['case', stateFlag(SHOWN_STATE), 1, 0],
	},
}

/** Hidden archipelago outlines still answer queries; this skips them. */
export function isPickableFeature(feature: MapGeoJSONFeature): boolean {
	return (
		feature.layer.id !== ARCHIPELAGO_FILL_LAYER_ID ||
		feature.state?.[SHOWN_STATE] === true
	)
}

const selected = stateFlag(SELECTED_STATE)

export function buildSelectionFillLayer(
	visible: boolean,
): FillLayerSpecification {
	return {
		id: SELECTION_FILL_LAYER_ID,
		type: 'fill',
		source: SOURCE_ID,
		'source-layer': COUNTRY_LAYER,
		paint: {
			'fill-color': ['case', selected, SELECTION_FILL, 'transparent'],
			'fill-opacity': visible ? 0.95 : 0,
			'fill-opacity-transition': { duration: SELECTION_FADE_MS, delay: 0 },
		},
	}
}

export function buildSelectionLineLayer(
	visible: boolean,
): LineLayerSpecification {
	return {
		id: SELECTION_LINE_LAYER_ID,
		type: 'line',
		source: SOURCE_ID,
		'source-layer': COUNTRY_LAYER,
		layout: { 'line-join': 'round' },
		paint: {
			'line-color': ['case', selected, SELECTION_EDGE, 'transparent'],
			'line-width': [
				'interpolate',
				['linear'],
				['zoom'],
				1,
				1,
				4,
				1.5,
				6,
				2,
			],
			'line-opacity': visible ? 1 : 0,
			'line-opacity-transition': { duration: SELECTION_FADE_MS, delay: 0 },
		},
	}
}

export const targetOutlineLayer: LineLayerSpecification = {
	id: TARGET_OUTLINE_LAYER_ID,
	type: 'line',
	source: SOURCE_ID,
	'source-layer': COUNTRY_LAYER,
	layout: { 'line-join': 'round' },
	paint: {
		'line-color': SELECTION_EDGE,
		'line-width': 3,
		'line-opacity': ['case', stateFlag(OUTLINED_STATE), 1, 0],
	},
}
