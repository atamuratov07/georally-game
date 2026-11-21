import type { FeatureCollection, LineString } from 'geojson'
import type { ExpressionSpecification, FilterSpecification } from 'maplibre-gl'
import { ROUTE_END_FILL } from '@/shared/map/map-styles'
import type { Point } from './routeGeometry'

export interface LineDraft {
	path: readonly Point[]
	main: boolean
}

export function lineData(
	lines: readonly LineDraft[],
): FeatureCollection<LineString> {
	return {
		type: 'FeatureCollection',
		features: lines.map(({ path, main }) => ({
			type: 'Feature',
			properties: { main },
			geometry: { type: 'LineString', coordinates: path.map(p => [...p]) },
		})),
	}
}

export const ON_WAY: FilterSpecification = ['get', 'main']
export const OFF_WAY: FilterSpecification = ['!', ['get', 'main']]

export const NAVY = '#17224a'
export const TOURED_CORD = '#ffd23f'
export const TOURED_RIM = '#f5a400'
const COUNTRY_FILL = '#ffd23f'

const SHADOW_TRANSLATE: [number, number] = [0, 2.5]
const isMain: ExpressionSpecification = ['get', 'main']
const kind: ExpressionSpecification = ['get', 'kind']

const byZoom = (
	low: ExpressionSpecification | number,
	high: ExpressionSpecification | number,
): ExpressionSpecification => [
	'interpolate',
	['linear'],
	['zoom'],
	3,
	low,
	6,
	high,
]

export const ROUTE_CORD_WIDTH = byZoom(3.4, 4.5)
export const BRANCH_CORD_WIDTH = byZoom(1.75, 2.5)
export const TOURED_CORD_WIDTH = byZoom(4, 5.1)

const bySize = (
	end: number,
	wayLink: number,
	wayCountry: number,
	branch: number,
): ExpressionSpecification => [
	'match',
	kind,
	'end',
	end,
	['case', isMain, ['match', kind, 'link', wayLink, wayCountry], branch],
]

const BEAD_RIM = byZoom(bySize(2.15, 1.9, 2.15, 1.7), bySize(2.6, 2.2, 2.6, 2))

export const BEAD_SORT: ExpressionSpecification = [
	'+',
	['case', isMain, 1, 0],
	['match', kind, 'link', 0, 2],
]

/** `grow` lets a bead drawn over another hide its rim entirely. */
export const beadPaint = (rim: string, grow = 0) => ({
	'circle-color': [
		'match',
		kind,
		'country',
		COUNTRY_FILL,
		'end',
		ROUTE_END_FILL,
		'#ffffff',
	] as ExpressionSpecification,
	'circle-radius': byZoom(
		bySize(5 + grow, 3.1 + grow, 3.6 + grow, 2.6 + grow),
		bySize(6.8 + grow, 4.1 + grow, 4.8 + grow, 3.4 + grow),
	),
	'circle-stroke-color': [
		'match',
		kind,
		'end',
		'#ffffff',
		rim,
	] as ExpressionSpecification,
	'circle-stroke-width': BEAD_RIM,
})

export const BEAD_SHADOW_PAINT = {
	'circle-color': NAVY,
	'circle-opacity': 0.3,
	'circle-radius': byZoom(
		bySize(7.15, 5, 5.75, 4.3),
		bySize(9.4, 6.3, 7.4, 5.4),
	),
	'circle-translate': SHADOW_TRANSLATE,
}
