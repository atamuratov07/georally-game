import type { CountryInfo } from '@georally/country-catalog'
import { countryCatalog } from '@georally/country-catalog'
import type { DataDrivenPropertyValueSpecification } from 'maplibre-gl'
import type {
	CircleLayerSpecification,
	FillLayerSpecification,
	SymbolLayerSpecification,
} from 'react-map-gl/maplibre'
import { getCountryCapital, getCountryName, type AppLanguage } from '../i18n'
import type { MapHighlight } from './types'

export const SOURCE_ID = 'world'
export const SOURCE_LAYER_ID = 'countries'
export const COUNTRY_LAYER = 'countries'
export const CENTROIDS_LAYER = 'centroids'
export const CAPITALS_LAYER = 'capitals'
export const GEOLINES_LAYER = 'geolines'

export const BASE_STYLE_LAYER_ID = 'countries-fill'
export const HOVER_LAYER_ID = 'countries-hovered'
export const HIGHLIGHT_LAYER_ID = 'countries-highlighted'
export const DIM_LAYER_ID = 'countries-dimmed'
export const COUNTRY_LABEL_LAYER_ID = 'countries-label'
export const CAPITAL_LABEL_LAYER_ID = 'capitals-label'
export const CAPITAL_DOT_LAYER_ID = 'capitals-dot'
export const GEOLINES_LABEL_LAYER_ID = 'geolines-label'
export const LABELS_BOTTOM_LAYER_ID = 'geolines'

export const WRONG_FILL = '#fb5f4c'
export const REVEALED_FILL = '#3fa625'
export const SELECTED_FILL = '#8148f0'

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

function localizedTextField(
	language: AppLanguage,
	fields: { en: string; ru: string; uzLatn: string },
): TextFieldLayoutValue {
	const preferredFields = {
		'uz-Latn': [fields.uzLatn, fields.ru, fields.en],
		en: [fields.en, fields.ru, fields.uzLatn],
		ru: [fields.ru, fields.en, fields.uzLatn],
	}[language]

	return [
		'coalesce',
		...preferredFields.map(field => ['get', field]),
	] as TextFieldLayoutValue
}

function buildCatalogTextField(
	resolveText: (country: CountryInfo) => string,
	fallback: TextFieldLayoutValue,
): TextFieldLayoutValue {
	const cases: string[] = []
	for (const id of countryCatalog.countryIds) {
		const country = countryCatalog.countriesById.get(id)
		const text = country ? resolveText(country).trim() : ''
		if (text) {
			cases.push(id, text)
		}
	}

	if (cases.length === 0) {
		return fallback
	}

	return [
		'match',
		['to-string', ['get', 'ISO_N3']],
		...cases,
		fallback,
	] as TextFieldLayoutValue
}

export function buildHighlightLayer(
	markers: readonly MapHighlight[],
): FillLayerSpecification {
	const cases: string[] = []
	for (const marker of markers) {
		cases.push(
			marker.countryId,
			{ correct: REVEALED_FILL, wrong: WRONG_FILL, selected: SELECTED_FILL }[
				marker.tone
			],
		)
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
							['to-string', ['get', 'ISO_N3']],
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
): FillLayerSpecification {
	const fillOpacity: FillOpacityExpression = !enabled
		? 0
		: interactiveIds.size === 0
			? 0.75
			: ([
					'match',
					['to-string', ['get', 'ISO_N3']],
					[...interactiveIds],
					0,
					0.75,
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
	const countryTextField = buildCatalogTextField(
		country => getCountryName(country, language),
		localizedTextField(language, {
			en: 'NAME',
			ru: 'NAME_RU',
			uzLatn: 'NAME_UZ_LATN',
		}),
	)

	return {
		id: COUNTRY_LABEL_LAYER_ID,
		type: 'symbol',
		source: SOURCE_ID,
		'source-layer': CENTROIDS_LAYER,
		filter: ['all'],
		minzoom: 2,
		maxzoom: 24,
		layout: {
			'text-field': countryTextField,
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
	const capitalTextField = buildCatalogTextField(
		country => getCountryCapital(country, language),
		localizedTextField(language, {
			en: 'CAPITAL',
			ru: 'CAPITAL_RU',
			uzLatn: 'CAPITAL_UZ_LATN',
		}),
	)

	return {
		id: CAPITAL_LABEL_LAYER_ID,
		type: 'symbol',
		source: SOURCE_ID,
		'source-layer': CAPITALS_LAYER,
		minzoom: 3,
		layout: {
			'text-field': capitalTextField,
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
	const geolinesTextField = localizedTextField(language, {
		en: 'name',
		ru: 'name_ru',
		uzLatn: 'name_uz_latn',
	})

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
			'text-field': geolinesTextField,
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
