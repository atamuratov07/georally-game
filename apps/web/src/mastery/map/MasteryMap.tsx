import { countryCatalog } from '@georally/country-catalog'
import { normalizeGameRegions } from '@georally/game-domain'
import {
	skillLayer,
	splitCardId,
	type CardId,
	type MasteryView,
} from '@georally/mastery'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import { BaseMap } from '@/shared/map/BaseMap'
import { regionsView } from '@/shared/map/continent-view'
import { prepareMasteryMap } from './prepareMasteryMap'
import { MasteryLayers } from './MasteryLayers'

const FIT_PADDING = 12
// The coastline blue: white would vanish among the white borders at this zoom.
const TODAY_OUTLINE = '#1077b0'

interface MasteryMapProps {
	views: ReadonlyMap<CardId, MasteryView>
	todayIds: readonly CardId[]
	className?: string
}

export function MasteryMap({ views, todayIds, className }: MasteryMapProps) {
	const mapRef = useRef<MapRef | null>(null)
	const [loaded, setLoaded] = useState(false)
	const onLoad = useCallback(() => {
		const map = mapRef.current?.getMap()
		if (map) prepareMasteryMap(map)
		setLoaded(true)
	}, [])

	const layer = useMemo(() => skillLayer(views, 'locate'), [views])
	const todayCountries = useMemo(
		() => [...new Set(todayIds.map(id => splitCardId(id).countryId))],
		[todayIds],
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
				layer={layer}
				outlinedIds={todayCountries}
				outlineColor={TODAY_OUTLINE}
			/>
		</BaseMap>
	)
}
