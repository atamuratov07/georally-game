import { countryCatalog, playableCountryPool } from '@georally/country-catalog'
import type { CountryId, GameScope } from '@georally/game-domain'
import {
	isPlanned,
	toCardId,
	type CardId,
	type IntroPlan,
	type MasteryLayer,
	type MasteryView,
	type SkillId,
} from '@georally/mastery'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	Layer,
	type MapLayerMouseEvent,
	type MapRef,
} from 'react-map-gl/maplibre'
import { BaseMap } from '@/shared/map/BaseMap'
import { CONTINENT_VIEW_PRESETS, WORLD_VIEW } from '@/shared/map/continent-view'
import { useCountryPicking } from '@/shared/map/interaction/useCountryPicking'
import { hoverLayer, LABELS_BOTTOM_LAYER_ID } from '@/shared/map/map-styles'
import { RevealPopup } from '@/shared/map/RevealPopup'
import { cn } from '@/shared/utils'
import { MasteryCountryCard } from './MasteryCountryCard'
import { prepareMasteryMap } from './prepareMasteryMap'
import { MasteryLayers } from './MasteryLayers'
import { useShownWhenStyled } from './useShownWhenStyled'

const PICKABLE_IDS: ReadonlySet<CountryId> = new Set(
	Object.keys(playableCountryPool.countriesById),
)
const FOCUS_PADDING = { top: 130, right: 20, bottom: 190, left: 20 }
const SELECTED_OUTLINE = '#ffffff'
const FLIGHT_MS = 900

export function ExploreMap({
	layer,
	views,
	skills,
	plan,
	now,
	focus,
}: {
	layer: MasteryLayer
	views: ReadonlyMap<CardId, MasteryView>
	skills: readonly SkillId[]
	plan: IntroPlan | null
	now: number
	focus: GameScope
}) {
	const mapRef = useRef<MapRef | null>(null)
	const [loaded, setLoaded] = useState(false)
	const fade = useShownWhenStyled(mapRef, loaded)
	const [selectedId, setSelectedId] = useState<CountryId | null>(null)
	const onLoad = useCallback(() => {
		const map = mapRef.current?.getMap()
		if (map) prepareMasteryMap(map)
		setLoaded(true)
	}, [])

	const { pointerProps } = useCountryPicking({
		mapRef,
		isLoaded: loaded,
		disabled: false,
		interactiveIds: PICKABLE_IDS,
		highlights: [],
		onPick: setSelectedId,
	})
	const pickOnClick = pointerProps.onClick
	const onClick = useCallback(
		(event: MapLayerMouseEvent) => {
			setSelectedId(null)
			pickOnClick?.(event)
		},
		[pickOnClick],
	)

	const shownFocus = useRef<GameScope>('all')
	useEffect(() => {
		const map = mapRef.current?.getMap()
		if (!loaded || !map || shownFocus.current === focus) return
		shownFocus.current = focus
		if (focus === 'all') {
			map.flyTo({ ...WORLD_VIEW, duration: FLIGHT_MS })
		} else {
			map.fitBounds(CONTINENT_VIEW_PRESETS[focus].focusBounds, {
				padding: FOCUS_PADDING,
				duration: FLIGHT_MS,
			})
		}
	}, [focus, loaded])

	const selected = selectedId
		? countryCatalog.countriesById.get(selectedId)
		: undefined
	const selectedIds = useMemo(
		() => (selectedId ? [selectedId] : []),
		[selectedId],
	)

	return (
		<BaseMap
			mapRef={mapRef}
			projection='flat'
			onLoad={onLoad}
			// The continent row covers the bottom corners.
			className={cn(
				'absolute inset-0 [&_.maplibregl-ctrl-bottom-right]:top-0 [&_.maplibregl-ctrl-bottom-right]:bottom-auto',
				fade,
			)}
			{...pointerProps}
			onClick={onClick}
		>
			<MasteryLayers
				loaded={loaded}
				layer={layer}
				outlinedIds={selectedIds}
				outlineColor={SELECTED_OUTLINE}
			/>
			<Layer {...hoverLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
			{selected ? (
				<RevealPopup
					target={{
						countryId: selected.id,
						longitude: selected.centroidLng,
						latitude: selected.centroidLat,
					}}
					hidden={false}
				>
					<MasteryCountryCard
						key={selected.id}
						info={selected}
						lines={skills.map(skill => {
							const cardId = toCardId(selected.id, skill)
							return {
								skill,
								view: views.get(cardId),
								planned: isPlanned(plan, cardId, selected.continent),
							}
						})}
						now={now}
					/>
				</RevealPopup>
			) : null}
		</BaseMap>
	)
}
