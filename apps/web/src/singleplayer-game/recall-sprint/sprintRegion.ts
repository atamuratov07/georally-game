import { countryCatalog, playableCountryPool } from '@georally/country-catalog'
import { selectEligibleCountryIds, type GameScope } from '@georally/game-domain'
import type { MapProps } from 'react-map-gl/maplibre'
import {
	viewPadding,
	type Bounds,
	type Insets,
} from '@/shared/map/camera/framing'
import { CONTINENT_VIEW_PRESETS } from '@/shared/map/continent-view'

export const REGION_MARGIN = 0.06
const WORLD_BOUNDS: Bounds = [-168, -56, 180, 76]

export function regionCountryIds(scope: GameScope): string[] {
	return selectEligibleCountryIds(playableCountryPool, {
		scope,
		difficulty: 'hard',
	})
}

export function regionBounds(scope: GameScope): Bounds {
	if (scope === 'all') {
		return WORLD_BOUNDS
	}
	const [[west, south], [east, north]] =
		CONTINENT_VIEW_PRESETS[scope].focusBounds
	return [west, south, east, north]
}

export function regionViewState(
	scope: GameScope,
	insets: Insets,
): MapProps['initialViewState'] {
	const [west, south, east, north] = regionBounds(scope)
	return {
		bounds: [west, south, east, north],
		fitBoundsOptions: {
			padding: viewPadding(
				window.innerWidth,
				window.innerHeight,
				insets,
				REGION_MARGIN,
			),
		},
	}
}

export function boundsOf(countryIds: readonly string[]): Bounds | null {
	const all = countryIds.flatMap(countryId => {
		const bounds = countryCatalog.countriesById.get(countryId)?.bounds
		return bounds ? [bounds] : []
	})
	if (all.length === 0) {
		return null
	}
	return [
		Math.min(...all.map(bounds => bounds[0])),
		Math.min(...all.map(bounds => bounds[1])),
		Math.max(...all.map(bounds => bounds[2])),
		Math.max(...all.map(bounds => bounds[3])),
	]
}
