import { countryCatalog } from '@georally/country-catalog'
import { normalizeGameRegions } from '@georally/game-domain'
import {
	skillLayer,
	splitCardId,
	type CardId,
	type MasteryView,
} from '@georally/mastery'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import { BaseMap } from '@/shared/map/BaseMap'
import { regionsView } from '@/shared/map/continent-view'
import { cn } from '@/shared/utils'
import { prepareMasteryMap } from './prepareMasteryMap'
import { MasteryLayers } from './MasteryLayers'
import { useShownWhenStyled } from './useShownWhenStyled'

const FIT_PADDING = 12
const TODAY_OUTLINE = '#1077b0'

const WORLD_BOUNDS: [[number, number], [number, number]] = [
	[-168, -56],
	[192, 76],
]

interface MasteryMapProps {
	views: ReadonlyMap<CardId, MasteryView>
	todayIds: readonly CardId[]
	overlay?: ReactNode
	className?: string
}

export function MasteryMap({
	views,
	todayIds,
	overlay,
	className,
}: MasteryMapProps) {
	const mapRef = useRef<MapRef | null>(null)
	const [loaded, setLoaded] = useState(false)
	const fade = useShownWhenStyled(mapRef, loaded)
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
		return {
			bounds: view?.focusBounds ?? WORLD_BOUNDS,
			fitBoundsOptions: { padding: FIT_PADDING },
		}
	}, [todayCountries])

	return (
		<BaseMap
			mapRef={mapRef}
			projection='flat'
			initialViewState={initialViewState}
			onLoad={onLoad}
			navigationTop={null}
			overlays={overlay}
			className={cn(fade, className)}
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
