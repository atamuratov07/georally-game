import { countryCatalog } from '@georally/country-catalog'
import { useEffect, useMemo, useRef } from 'react'
import { Layer, useMap } from 'react-map-gl/maplibre'
import { HitRing } from '@/shared/map/HitRing'
import { LabelLayers } from '@/shared/map/layers/LabelLayers'
import { TinyCountryRings } from '@/shared/map/layers/TinyCountryRings'
import { MapMarkers } from '@/shared/map/MapMarkers'
import {
	ARCHIPELAGO_SOURCE_ID,
	archipelagoFillLayer,
	archipelagoOutlineLayer,
	BASE_STYLE_LAYER_ID,
	buildRevealDimLayer,
	COUNTRY_LAYER,
	LABELS_BOTTOM_LAYER_ID,
	REGION_STATE,
	REVEALED_STATE,
	SHOWN_STATE,
	SOURCE_ID,
} from '@/shared/map/map-styles'
import type { MapMarker } from '@/shared/map/types'
import { flagsFor, useFeatureState } from '@/shared/map/useFeatureState'

const DIM = {
	region: { color: '#d3d8de', opacity: 0.9 },
	outside: { color: '#eef0f2', opacity: 0.94 },
}
const FOUND_RING = '#f5b800'
const WORLD = { source: SOURCE_ID, sourceLayer: COUNTRY_LAYER }
const ISLANDS = { source: ARCHIPELAGO_SOURCE_ID }
const DIM_LAYER = buildRevealDimLayer(DIM)

export interface Hit {
	key: string
	countryId: string
}

interface RevealLayersProps {
	loaded: boolean
	regionIds: ReadonlySet<string>
	revealedIds: readonly string[]
	ringIds: readonly string[]
	labelIds: readonly string[]
	hits: readonly Hit[]
}

function centroidOf(countryId: string): [number, number] | null {
	const info = countryCatalog.countriesById.get(countryId)
	return info ? [info.centroidLng, info.centroidLat] : null
}

export function RevealLayers({
	loaded,
	regionIds,
	revealedIds,
	ringIds,
	labelIds,
	hits,
}: RevealLayersProps) {
	const map = useMap().current?.getMap()
	const appliedRef = useRef<ReadonlySet<string>>(new Set())

	useEffect(() => {
		if (!map || !loaded) {
			return
		}
		const newIds = revealedIds.filter(id => !appliedRef.current.has(id))
		for (const id of newIds) {
			map.setFeatureState(
				{ source: SOURCE_ID, sourceLayer: COUNTRY_LAYER, id },
				{ [REVEALED_STATE]: true },
			)
		}
		appliedRef.current = new Set([...appliedRef.current, ...newIds])
	}, [loaded, map, revealedIds])

	const region = useMemo(() => flagsFor(regionIds), [regionIds])
	useFeatureState(loaded, WORLD, REGION_STATE, region)
	useFeatureState(loaded, ISLANDS, SHOWN_STATE, region)

	const ringColors = useMemo(
		() => Object.fromEntries(revealedIds.map(id => [id, FOUND_RING])),
		[revealedIds],
	)

	const markers = useMemo<MapMarker[]>(
		() =>
			hits.flatMap(({ key, countryId }) => {
				const centroid = centroidOf(countryId)
				return centroid
					? [
							{
								id: key,
								longitude: centroid[0],
								latitude: centroid[1],
								anchor: 'center' as const,
								element: <HitRing />,
							},
						]
					: []
			}),
		[hits],
	)

	return (
		<>
			<Layer {...archipelagoFillLayer} beforeId={BASE_STYLE_LAYER_ID} />
			<Layer {...archipelagoOutlineLayer} beforeId={BASE_STYLE_LAYER_ID} />
			<Layer {...DIM_LAYER} beforeId={LABELS_BOTTOM_LAYER_ID} />
			<TinyCountryRings countryIds={ringIds} colors={ringColors} />
			<LabelLayers countryIds={labelIds} />
			<MapMarkers markers={markers} />
		</>
	)
}
