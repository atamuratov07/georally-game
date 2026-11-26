import {
	memo,
	useCallback,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from 'react'
import { Layer, type MapRef } from 'react-map-gl/maplibre'
import { BaseMap } from './BaseMap'
import { loosenCameraConstraint } from './camera/framing'
import { useFitCamera, type FitTarget } from './camera/useFitCamera'
import { CountryLayers } from './layers/CountryLayers'
import { LabelLayers } from './layers/LabelLayers'
import {
	COUNTRY_LAYER,
	LABELS_BOTTOM_LAYER_ID,
	OUTLINED_STATE,
	SOURCE_ID,
	targetOutlineLayer,
} from './map-styles'
import { MapMarkers } from './MapMarkers'
import type { ProjectionKind } from './ProjectionToggle'
import { RevealPopup } from './RevealPopup'
import type { MapHighlight, MapMarker, MapRevealTarget } from './types'
import { flagsFor, useFeatureState } from './useFeatureState'

const MIN_ZOOM = 0
const MAX_ZOOM = 7
const DIM_OPACITY = 0.55
const NO_COUNTRIES: ReadonlySet<string> = new Set()
const ZOOM_AROUND_CENTER = { around: 'center' } as const
const WORLD = { source: SOURCE_ID, sourceLayer: COUNTRY_LAYER }

interface NameItMapProps {
	projection: ProjectionKind
	focus: FitTarget | null
	targetId: string | null
	outlined: boolean
	highlights: readonly MapHighlight[]
	labelIds: readonly string[]
	markers: readonly MapMarker[]
	reveal: MapRevealTarget | null
	popup: ReactNode
	insets: { top: number; bottom: number }
	cardHidden: boolean
	navigationTop: string | null
	onFocusSettled: (key: string) => void
}

function TargetOutline({
	loaded,
	countryId,
}: {
	loaded: boolean
	countryId: string | null
}) {
	const outlinedIds = useMemo(() => flagsFor([countryId]), [countryId])
	useFeatureState(loaded, WORLD, OUTLINED_STATE, outlinedIds)

	return <Layer {...targetOutlineLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
}

function NameItMapInner({
	projection,
	focus,
	targetId,
	outlined,
	highlights,
	labelIds,
	markers,
	reveal,
	popup,
	insets,
	cardHidden,
	navigationTop,
	onFocusSettled,
}: NameItMapProps) {
	const mapRef = useRef<MapRef | null>(null)
	const [isLoaded, setIsLoaded] = useState(false)

	useFitCamera({
		mapRef,
		isLoaded,
		target: focus,
		insets,
		onSettled: onFocusSettled,
	})

	const handleLoad = useCallback(() => {
		const map = mapRef.current?.getMap()
		map?.touchZoomRotate.disableRotation()
		if (map) {
			loosenCameraConstraint(map)
		}
		map?.getCanvas().removeAttribute('tabindex')
		setIsLoaded(true)
	}, [])

	return (
		<BaseMap
			mapRef={mapRef}
			projection={projection}
			onLoad={handleLoad}
			navigationTop={navigationTop}
			minZoom={MIN_ZOOM}
			maxZoom={MAX_ZOOM}
			dragPan={false}
			dragRotate={false}
			touchPitch={false}
			doubleClickZoom={false}
			keyboard={false}
			scrollZoom={ZOOM_AROUND_CENTER}
			touchZoomRotate={ZOOM_AROUND_CENTER}
		>
			<CountryLayers
				loaded={isLoaded}
				interactiveIds={NO_COUNTRIES}
				highlights={highlights}
				dimOpacity={DIM_OPACITY}
			/>
			<TargetOutline
				loaded={isLoaded}
				countryId={outlined ? targetId : null}
			/>
			<LabelLayers countryIds={labelIds} />
			<MapMarkers markers={markers} />
			{reveal && popup ? (
				<RevealPopup target={reveal} hidden={cardHidden}>
					{popup}
				</RevealPopup>
			) : null}
		</BaseMap>
	)
}

export const NameItMap = memo(NameItMapInner)
