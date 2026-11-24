import { countryCatalog } from '@georally/country-catalog'
import { normalizeGameRegions, type CountryId } from '@georally/game-domain'
import {
	skillLayer,
	splitCardId,
	type CardId,
	type MasteryLevel,
	type MasteryView,
} from '@georally/mastery'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Layer, type MapRef } from 'react-map-gl/maplibre'
import { BaseMap } from '@/shared/map/BaseMap'
import { regionsView } from '@/shared/map/continent-view'
import { TinyCountryRings } from '@/shared/map/layers/TinyCountryRings'
import {
	COUNTRY_LAYER,
	LABELS_BOTTOM_LAYER_ID,
	MASTERY_STATE,
	masteryFillLayer,
	masteryTodayLayer,
	SOURCE_ID,
	TODAY_STATE,
} from '@/shared/map/map-styles'
import { flagsFor, useFeatureState } from '@/shared/map/useFeatureState'

const WORLD = { source: SOURCE_ID, sourceLayer: COUNTRY_LAYER }
const FIT_PADDING = 12

const RING_COLORS: Readonly<Record<MasteryLevel, string>> = {
	learning: '#82d95c',
	familiar: '#3fa625',
	mastered: '#266917',
}

function MasteryLayers({
	loaded,
	levels,
	todayIds,
}: {
	loaded: boolean
	levels: ReadonlyMap<CountryId, MasteryLevel>
	todayIds: readonly CountryId[]
}) {
	const today = useMemo(() => flagsFor(todayIds), [todayIds])
	useFeatureState(loaded, WORLD, MASTERY_STATE, levels)
	useFeatureState(loaded, WORLD, TODAY_STATE, today)

	return (
		<>
			<Layer {...masteryFillLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
			<Layer {...masteryTodayLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
		</>
	)
}

interface MasteryMapProps {
	views: ReadonlyMap<CardId, MasteryView>
	todayIds: readonly CardId[]
	className?: string
}

export function MasteryMap({ views, todayIds, className }: MasteryMapProps) {
	const mapRef = useRef<MapRef | null>(null)
	const [loaded, setLoaded] = useState(false)
	const onLoad = useCallback(() => {
		mapRef.current
			?.getMap()
			.setLayoutProperty(LABELS_BOTTOM_LAYER_ID, 'visibility', 'none')
		setLoaded(true)
	}, [])

	const levels = useMemo(
		() =>
			new Map(
				[...skillLayer(views, 'locate')].map(([countryId, view]) => [
					countryId,
					view.level,
				]),
			),
		[views],
	)

	const todayCountries = useMemo(
		() => [...new Set(todayIds.map(id => splitCardId(id).countryId))],
		[todayIds],
	)

	const ringColors = useMemo(
		() =>
			Object.fromEntries(
				[...levels].map(([countryId, level]) => [
					countryId,
					RING_COLORS[level],
				]),
			),
		[levels],
	)

	const initialViewState = useMemo(() => {
		const continents = todayCountries.flatMap(
			id => countryCatalog.countriesById.get(id)?.continent ?? [],
		)
		const view = regionsView(normalizeGameRegions(continents))
		return view
			? {
					bounds: view.focusBounds,
					fitBoundsOptions: { padding: FIT_PADDING },
				}
			: undefined
	}, [todayCountries])

	return (
		<BaseMap
			mapRef={mapRef}
			projection='flat'
			initialViewState={initialViewState}
			onLoad={onLoad}
			navigationTop={null}
			className={className}
			dragPan={false}
			dragRotate={false}
			touchPitch={false}
			touchZoomRotate={false}
			scrollZoom={false}
			doubleClickZoom={false}
			keyboard={false}
		>
			<MasteryLayers
				loaded={loaded}
				levels={levels}
				todayIds={todayCountries}
			/>
			<TinyCountryRings countryIds={levels.keys()} colors={ringColors} />
		</BaseMap>
	)
}
