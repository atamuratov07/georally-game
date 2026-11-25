import type { MasteryLevel } from '@georally/mastery'
import type { ExpressionSpecification } from 'maplibre-gl'
import type {
	FillLayerSpecification,
	LineLayerSpecification,
} from 'react-map-gl/maplibre'
import {
	COUNTRY_LAYER,
	OUTLINED_STATE,
	SOURCE_ID,
	stateFlag,
} from '@/shared/map/map-styles'

export const MASTERY_STATE = 'mastery'
export const FADING_STATE = 'fading'
export const FADING_PATTERN_ID = 'mastery-fading'

export const MASTERY_FILL: Readonly<Record<MasteryLevel, string>> = {
	learning: '#d7f5c8',
	familiar: '#82d95c',
	mastered: '#3fa625',
}
const UNSEEN_FILL = '#e4e8ee'

export const RING_COLORS: Readonly<Record<MasteryLevel, string>> = {
	learning: '#82d95c',
	familiar: '#3fa625',
	mastered: '#266917',
}

export const masteryFillLayer: FillLayerSpecification = {
	id: 'countries-mastery',
	type: 'fill',
	source: SOURCE_ID,
	'source-layer': COUNTRY_LAYER,
	paint: {
		'fill-color': [
			'match',
			['to-string', ['feature-state', MASTERY_STATE]],
			...Object.entries(MASTERY_FILL).flat(),
			UNSEEN_FILL,
		] as ExpressionSpecification,
		'fill-outline-color': '#ffffff',
	},
}

export const masteryFadingLayer: FillLayerSpecification = {
	id: 'countries-mastery-fading',
	type: 'fill',
	source: SOURCE_ID,
	'source-layer': COUNTRY_LAYER,
	paint: {
		'fill-pattern': FADING_PATTERN_ID,
		'fill-opacity': ['case', stateFlag(FADING_STATE), 1, 0],
	},
}

export function masteryOutlineLayer(color: string): LineLayerSpecification {
	return {
		id: 'countries-mastery-outline',
		type: 'line',
		source: SOURCE_ID,
		'source-layer': COUNTRY_LAYER,
		layout: { 'line-join': 'round' },
		paint: {
			'line-color': color,
			'line-width': {
				type: 'exponential',
				stops: [
					[2, 1.5],
					[4, 2.5],
					[6, 3.5],
				],
			},
			'line-opacity': ['case', stateFlag(OUTLINED_STATE), 1, 0],
		},
	}
}
