import { countryCatalog } from '@georally/country-catalog'
import type { FeatureCollection, Point } from 'geojson'
import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { isTinyAt } from '../camera/framing'
import { LABELS_BOTTOM_LAYER_ID } from '../map-styles'

export const TINY_RINGS_LAYER_ID = 'tiny-country-rings'
const TINY_REFERENCE_ZOOM = 3
const NEUTRAL_RING = '#3a9cff'

const TINY_CENTROIDS = new Map(
	[...countryCatalog.countriesById.values()]
		.filter(info => isTinyAt(info.bounds, TINY_REFERENCE_ZOOM))
		.map(info => [info.id, [info.centroidLng, info.centroidLat]] as const),
)

interface TinyCountryRingsProps {
	countryIds: Iterable<string>
	colors?: Readonly<Record<string, string>>
}

export function TinyCountryRings({
	countryIds,
	colors,
}: TinyCountryRingsProps) {
	const rings = useMemo<FeatureCollection<Point>>(
		() => ({
			type: 'FeatureCollection',
			features: [...countryIds].flatMap(countryId => {
				const centroid = TINY_CENTROIDS.get(countryId)
				return centroid
					? [
							{
								type: 'Feature' as const,
								properties: {
									iso_n3: countryId,
									color: colors?.[countryId] ?? NEUTRAL_RING,
								},
								geometry: {
									type: 'Point' as const,
									coordinates: [...centroid],
								},
							},
						]
					: []
			}),
		}),
		[colors, countryIds],
	)

	return (
		<Source
			id={TINY_RINGS_LAYER_ID}
			type='geojson'
			data={rings}
			promoteId='iso_n3'
		>
			<Layer
				id={TINY_RINGS_LAYER_ID}
				type='circle'
				beforeId={LABELS_BOTTOM_LAYER_ID}
				paint={{
					'circle-radius': [
						'interpolate',
						['exponential', 1.6],
						['zoom'],
						2,
						3,
						3,
						4.5,
						4,
						8,
						5,
						13,
						6,
						16,
					],
					'circle-color': 'rgba(0, 0, 0, 0)',
					'circle-stroke-width': [
						'interpolate',
						['linear'],
						['zoom'],
						2,
						1.5,
						4,
						2.5,
						6,
						4,
					],
					'circle-stroke-color': ['get', 'color'],
				}}
			/>
		</Source>
	)
}
