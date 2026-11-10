import type {
	DataDrivenPropertyValueSpecification,
	ExpressionSpecification,
	FilterSpecification,
} from 'maplibre-gl'
import type {
	CircleLayerSpecification,
	FillLayerSpecification,
	LineLayerSpecification,
	SymbolLayerSpecification,
} from 'react-map-gl/maplibre'
import type { AppLanguage } from '../i18n'
import type { MapHighlight, MapHighlightTone } from './types'

export const SOURCE_ID = 'world'
export const SOURCE_LAYER_ID = 'countries'
export const COUNTRY_LAYER = 'countries'
export const CENTROIDS_LAYER = 'centroids'
export const CAPITALS_LAYER = 'capitals'
export const GEOLINES_LAYER = 'geolines'

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
export const ARCHIPELAGO_SOURCE_ID = 'archipelagos'
export const ARCHIPELAGO_FILL_LAYER_ID = 'archipelagos-fill'
export const ARCHIPELAGO_OUTLINE_LAYER_ID = 'archipelagos-outline'
export const LABELS_BOTTOM_LAYER_ID = 'geolines'
export const TARGET_OUTLINE_LAYER_ID = 'countries-target-outline'

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

export type FillColorExpression = NonNullable<
	FillLayerSpecification['paint']
>['fill-color']

export type FillOpacityExpression = NonNullable<
	FillLayerSpecification['paint']
>['fill-opacity']

const zoomStops = <T,>(...stops: Array<[number, T]>): Array<[number, T]> =>
	stops

type TextFieldLayoutValue = NonNullable<
	SymbolLayerSpecification['layout']
>['text-field']

function labelTextField(language: AppLanguage): TextFieldLayoutValue {
	return ['get', `label_${language.toLowerCase().replace('-', '_')}`]
}

export function buildHighlightLayer(
	markers: readonly MapHighlight[],
	/** Drawn by the selection layers instead, so it can fade in. */
	selectedId?: string | null,
): FillLayerSpecification {
	const cases: string[] = []
	for (const marker of markers) {
		if (isSelectionTone(marker.tone) && marker.countryId === selectedId)
			continue
		cases.push(marker.countryId, TONE_FILL[marker.tone])
	}

	return {
		id: HIGHLIGHT_LAYER_ID,
		type: 'fill',
		source: SOURCE_ID,
		'source-layer': COUNTRY_LAYER,
		paint: {
			'fill-color':
				cases.length > 0
					? ([
							'match',
							['to-string', ['get', 'iso_n3']],
							...cases,
							'transparent',
						] as FillColorExpression)
					: 'transparent',
			'fill-outline-color': '#ffffff',
			'fill-opacity': 0.85,
		},
	}
}

export function buildDimLayer(
	interactiveIds: ReadonlySet<string>,
	enabled: boolean,
	opacity = 0.75,
): FillLayerSpecification {
	const fillOpacity: FillOpacityExpression = !enabled
		? 0
		: interactiveIds.size === 0
			? opacity
			: ([
					'match',
					['get', 'iso_n3'],
					[...interactiveIds],
					0,
					opacity,
				] as FillOpacityExpression)

	return {
		id: DIM_LAYER_ID,
		type: 'fill',
		source: SOURCE_ID,
		'source-layer': COUNTRY_LAYER,
		paint: {
			'fill-color': '#eeeeee',
			'fill-outline-color': '#ffffff',
			'fill-opacity': fillOpacity,
		},
	}
}

export const REVEALED_STATE = 'revealed'

interface DimTone {
	color: string
	opacity: number
}

export function buildRevealDimLayer(
	regionIds: ReadonlySet<string>,
	{ region, outside }: { region: DimTone; outside: DimTone },
): FillLayerSpecification {
	const byRegion = <T,>(pick: (tone: DimTone) => T) =>
		regionIds.size > 0
			? [
					'match',
					['get', 'iso_n3'],
					[...regionIds],
					pick(region),
					pick(outside),
				]
			: pick(outside)

	return {
		id: DIM_LAYER_ID,
		type: 'fill',
		source: SOURCE_ID,
		'source-layer': COUNTRY_LAYER,
		paint: {
			'fill-color': byRegion(tone => tone.color) as FillColorExpression,
			'fill-outline-color': '#ffffff',
			'fill-opacity': [
				'case',
				['boolean', ['feature-state', REVEALED_STATE], false],
				0,
				byRegion(tone => tone.opacity),
			] as FillOpacityExpression,
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
		'fill-opacity': [
			'case',
			['boolean', ['feature-state', 'hover'], false],
			0.75,
			0,
		],
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
			'text-font': ['Noto Sans Bold'],
			'text-size': {
				type: 'exponential',
				stops: zoomStops([2, 10], [4, 12], [6, 16]),
			},
			visibility: 'visible',
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
			'text-font': ['Noto Sans Regular'],
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
export function buildArchipelagoLayers(
	interactiveIds: ReadonlySet<string>,
	highlights: readonly MapHighlight[],
	selectedId: string | null,
): { fill: FillLayerSpecification; outline: LineLayerSpecification } {
	const toneById = new Map<string, string>()
	for (const highlight of highlights) {
		toneById.set(
			highlight.countryId,
			isSelectionTone(highlight.tone) && highlight.countryId === selectedId
				? SELECTION_FILL
				: TONE_FILL[highlight.tone],
		)
	}
	const visibleIds = new Set([...interactiveIds, ...toneById.keys()])
	const isoN3: ExpressionSpecification = ['get', 'iso_n3']
	const isHovered: ExpressionSpecification = [
		'boolean',
		['feature-state', 'hover'],
		false,
	]
	const hasTone: ExpressionSpecification | boolean =
		toneById.size > 0
			? ['in', isoN3, ['literal', [...toneById.keys()]]]
			: false
	const toneColor = (fallback: string): ExpressionSpecification | string =>
		toneById.size > 0
			? ([
					'match',
					isoN3,
					...[...toneById].flat(),
					fallback,
				] as ExpressionSpecification)
			: fallback
	const filter: FilterSpecification = [
		'in',
		isoN3,
		['literal', [...visibleIds]],
	]

	return {
		fill: {
			id: ARCHIPELAGO_FILL_LAYER_ID,
			type: 'fill',
			source: ARCHIPELAGO_SOURCE_ID,
			filter,
			paint: {
				'fill-color': ['case', isHovered, '#9b6cfb', toneColor('#ffffff')],
				'fill-opacity': ['case', isHovered, 0.3, hasTone, 0.4, 0],
			},
		},
		outline: {
			id: ARCHIPELAGO_OUTLINE_LAYER_ID,
			type: 'line',
			source: ARCHIPELAGO_SOURCE_ID,
			filter,
			layout: { 'line-join': 'round' },
			paint: {
				'line-color': ['case', isHovered, '#5527aa', toneColor('#1077B0')],
				'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1, 6, 2],
			},
		},
	}
}

function countryFilter(countryId: string | null): FilterSpecification {
	return ['==', ['get', 'iso_n3'], countryId ?? '__none__']
}

export function buildSelectionFillLayer(
	countryId: string | null,
	visible: boolean,
): FillLayerSpecification {
	return {
		id: SELECTION_FILL_LAYER_ID,
		type: 'fill',
		source: SOURCE_ID,
		'source-layer': COUNTRY_LAYER,
		filter: countryFilter(countryId),
		paint: {
			'fill-color': SELECTION_FILL,
			'fill-opacity': visible ? 0.95 : 0,
			'fill-opacity-transition': { duration: SELECTION_FADE_MS, delay: 0 },
		},
	}
}

export function buildSelectionLineLayer(
	countryId: string | null,
	visible: boolean,
): LineLayerSpecification {
	return {
		id: SELECTION_LINE_LAYER_ID,
		type: 'line',
		source: SOURCE_ID,
		'source-layer': COUNTRY_LAYER,
		filter: countryFilter(countryId),
		layout: { 'line-join': 'round' },
		paint: {
			'line-color': SELECTION_EDGE,
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

export function buildTargetOutlineLayer(
	countryId: string | null,
): LineLayerSpecification {
	return {
		id: TARGET_OUTLINE_LAYER_ID,
		type: 'line',
		source: SOURCE_ID,
		'source-layer': COUNTRY_LAYER,
		filter: countryFilter(countryId),
		layout: { 'line-join': 'round' },
		paint: {
			'line-color': SELECTION_EDGE,
			'line-width': 3,
		},
	}
}
