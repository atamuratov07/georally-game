import { countryCatalog } from '@georally/country-catalog'
import type { GameRegions } from '@georally/game-domain'
import type { MapMouseEvent } from 'maplibre-gl'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Layer, useMap } from 'react-map-gl/maplibre'
import { FLIGHT, fitCamera, type Overlays } from '@/shared/map/camera/framing'
import {
	ARCHIPELAGO_FILL_LAYER_ID,
	ARCHIPELAGO_SOURCE_ID,
	BASE_STYLE_LAYER_ID,
	COUNTRY_LAYER,
	isPickableFeature,
	LABELS_BOTTOM_LAYER_ID,
	LIFTED_STATE,
	SOURCE_ID,
} from '@/shared/map/map-styles'
import { RevealPopup } from '@/shared/map/RevealPopup'
import { flagsFor, useFeatureState } from '@/shared/map/useFeatureState'
import { CountryInfoCard } from '@/shared/widgets/CountryInfoCard'
import { liftedLayers } from './liftedLayers'
import { RING_LAYER_ID } from './RevealLayers'
import { boundsOf, REGION_MARGIN, regionBounds } from './sprintRegion'
import { prefersReducedMotion } from './useOverlayCamera'

const PICKABLE_LAYERS = [
	RING_LAYER_ID,
	ARCHIPELAGO_FILL_LAYER_ID,
	BASE_STYLE_LAYER_ID,
]
const WORLD = { source: SOURCE_ID, sourceLayer: COUNTRY_LAYER }
const ISLANDS = { source: ARCHIPELAGO_SOURCE_ID }

interface ReviewLayersProps {
	regions: GameRegions
	regionIds: ReadonlySet<string>
	activeId: string | null
	onSelect: (countryId: string | null) => void
	overlaysRef: RefObject<Overlays>
	holdRef: RefObject<boolean>
	takenOverRef: RefObject<boolean>
}

export function ReviewLayers({
	regions,
	regionIds,
	activeId,
	onSelect,
	overlaysRef,
	holdRef,
	takenOverRef,
}: ReviewLayersProps) {
	const map = useMap().current?.getMap()
	const [landedId, setLandedId] = useState<string | null>(null)
	const activeIdRef = useRef(activeId)
	const onSelectRef = useRef(onSelect)
	const enteredRef = useRef(false)

	useEffect(() => {
		activeIdRef.current = activeId
		onSelectRef.current = onSelect
	})

	useEffect(() => {
		if (!map) {
			return
		}
		const handleClick = (event: MapMouseEvent) => {
			const layers = PICKABLE_LAYERS.filter(id => map.getLayer(id))
			const feature = map
				.queryRenderedFeatures(event.point, { layers })
				.find(isPickableFeature)
			const countryId = feature?.properties?.iso_n3 as string | undefined
			onSelectRef.current(
				countryId &&
					regionIds.has(countryId) &&
					countryId !== activeIdRef.current
					? countryId
					: null,
			)
		}
		map.on('click', handleClick)
		return () => {
			map.off('click', handleClick)
		}
	}, [map, regionIds])

	useEffect(() => {
		if (!map) {
			return
		}
		holdRef.current = activeId !== null
		const entering = !enteredRef.current
		enteredRef.current = true
		if (entering && takenOverRef.current) {
			return
		}

		const bounds = activeId ? boundsOf([activeId]) : regionBounds(regions)
		const camera =
			bounds &&
			fitCamera(map, bounds, overlaysRef.current.padding, {
				margin: activeId ? undefined : REGION_MARGIN,
			})
		if (!camera) {
			return
		}
		map.once('moveend', () => setLandedId(activeId))
		if (prefersReducedMotion()) {
			map.jumpTo(camera)
		} else {
			map.flyTo({ ...camera, ...FLIGHT, essential: true })
		}
	}, [activeId, holdRef, map, overlaysRef, regions, takenOverRef])

	const lifted = useMemo(() => flagsFor([activeId]), [activeId])
	useFeatureState(true, WORLD, LIFTED_STATE, lifted)
	useFeatureState(true, ISLANDS, LIFTED_STATE, lifted)
	const info =
		activeId && landedId === activeId
			? countryCatalog.countriesById.get(activeId)
			: undefined

	return (
		<>
			{liftedLayers.map(layer => (
				<Layer
					key={layer.id}
					{...layer}
					beforeId={LABELS_BOTTOM_LAYER_ID}
				/>
			))}
			{info ? (
				<RevealPopup
					target={{
						countryId: info.id,
						longitude: info.centroidLng,
						latitude: info.centroidLat,
					}}
					hidden={false}
				>
					<CountryInfoCard info={info} />
				</RevealPopup>
			) : null}
		</>
	)
}
