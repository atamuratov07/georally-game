import {
	memo,
	useCallback,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from 'react'
import { Layer, type MapRef } from 'react-map-gl/maplibre'
import { BaseMap } from '@/shared/map/BaseMap'
import { loosenCameraConstraint } from '@/shared/map/camera/framing'
import { useFitCamera, type FitTarget } from '@/shared/map/camera/useFitCamera'
import { CountryLayers } from '@/shared/map/layers/CountryLayers'
import { LabelLayers } from '@/shared/map/layers/LabelLayers'
import { MapMarkers } from '@/shared/map/MapMarkers'
import {
	buildTargetOutlineLayer,
	LABELS_BOTTOM_LAYER_ID,
} from '@/shared/map/map-styles'
import type { ProjectionKind } from '@/shared/map/ProjectionToggle'
import { RevealPopup } from '@/shared/map/RevealPopup'
import type {
	MapHighlight,
	MapMarker,
	MapRevealTarget,
} from '@/shared/map/types'

const MIN_ZOOM = 0
const MAX_ZOOM = 7
const DIM_OPACITY = 0.55
const NO_COUNTRIES: ReadonlySet<string> = new Set()
const ZOOM_AROUND_CENTER = { around: 'center' } as const

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

	const outlineLayer = useMemo(
		() => buildTargetOutlineLayer(outlined ? targetId : null),
		[outlined, targetId],
	)

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
				interactiveIds={NO_COUNTRIES}
				highlights={highlights}
				dimOpacity={DIM_OPACITY}
			/>
			<Layer {...outlineLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
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
