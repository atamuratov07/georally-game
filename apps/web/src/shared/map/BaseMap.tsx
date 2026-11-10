import { setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type CSSProperties,
	type ReactNode,
	type RefObject,
} from 'react'
import { useTranslation } from 'react-i18next'
import Map, {
	NavigationControl,
	type ErrorEvent,
	type MapEvent,
	type MapProps,
	type MapRef,
	type ProjectionSpecification,
} from 'react-map-gl/maplibre'
import { cn } from '../utils'
import { WORLD_VIEW } from './continent-view'
import type { ProjectionKind } from './ProjectionToggle'

setWorkerUrl(workerUrl)

const MAP_STYLE_URL = '/map/style.json'
const MAP_STYLE = { width: '100%', height: '100%' }
const FAILURE_NOTICE_MS = 4000
const DEFAULT_NAVIGATION_TOP = '7.5rem'

const INITIAL_VIEW_STATE = {
	longitude: WORLD_VIEW.center[0],
	latitude: WORLD_VIEW.center[1],
	zoom: WORLD_VIEW.zoom,
}

const PROJECTIONS: Record<ProjectionKind, ProjectionSpecification> = {
	flat: { type: 'mercator' },
	globe: { type: 'vertical-perspective' },
}

function transformRequest(url: string) {
	const absoluteUrl = url.startsWith('/')
		? new URL(url, window.location.origin).toString()
		: url
	return { url: absoluteUrl }
}

export type MapPointerProps = Pick<
	MapProps,
	'interactiveLayerIds' | 'onClick' | 'onMouseMove' | 'onMouseLeave'
>

export type MapInteractionProps = Pick<
	MapProps,
	| 'minZoom'
	| 'maxZoom'
	| 'dragPan'
	| 'dragRotate'
	| 'touchPitch'
	| 'touchZoomRotate'
	| 'scrollZoom'
	| 'doubleClickZoom'
	| 'keyboard'
>

interface BaseMapProps extends MapPointerProps, MapInteractionProps {
	mapRef: RefObject<MapRef | null>
	initialViewState?: MapProps['initialViewState']
	projection: ProjectionKind
	maxBounds?: [number, number, number, number]
	onLoad: () => void
	navigationTop?: string | null
	overlays?: ReactNode
	className?: string
	children?: ReactNode
}

export function BaseMap({
	mapRef,
	initialViewState = INITIAL_VIEW_STATE,
	projection,
	maxBounds,
	onLoad,
	navigationTop = DEFAULT_NAVIGATION_TOP,
	overlays,
	className,
	children,
	...mapProps
}: BaseMapProps) {
	const { t } = useTranslation()
	const [hasFailure, setHasFailure] = useState(false)

	const handleLoad = useCallback(
		(event: MapEvent) => {
			onLoad()
			// MapLibre opens compact attribution expanded until the first move; start
			// it collapsed so it does not sit under the bottom action button.
			event.target
				.getContainer()
				.querySelector('.maplibregl-ctrl-attrib')
				?.classList.remove('maplibregl-compact-show')
		},
		[onLoad],
	)

	const failureTimerRef = useRef<number | null>(null)

	useEffect(
		() => () => {
			if (failureTimerRef.current !== null) {
				clearTimeout(failureTimerRef.current)
			}
		},
		[],
	)

	const handleError = useCallback((event: ErrorEvent) => {
		console.error('Maplibre error:', event.error)
		if (failureTimerRef.current !== null) {
			clearTimeout(failureTimerRef.current)
		}
		setTimeout(() => setHasFailure(true), 0)
		failureTimerRef.current = window.setTimeout(() => {
			setHasFailure(false)
			failureTimerRef.current = null
		}, FAILURE_NOTICE_MS)
	}, [])

	return (
		<div
			className={cn(
				'relative h-full w-full overflow-hidden',
				projection === 'globe' && 'bg-ocean-900',
				className,
			)}
			style={
				navigationTop
					? ({ '--map-navigation-top': navigationTop } as CSSProperties)
					: undefined
			}
		>
			<Map
				ref={mapRef}
				attributionControl={{ compact: true }}
				initialViewState={initialViewState}
				mapStyle={MAP_STYLE_URL}
				style={MAP_STYLE}
				maxBounds={maxBounds}
				projection={PROJECTIONS[projection]}
				onLoad={handleLoad}
				transformRequest={transformRequest}
				onError={handleError}
				{...mapProps}
			>
				{navigationTop ? (
					<NavigationControl showCompass={false} position='top-left' />
				) : null}
				{children}
			</Map>

			{overlays}

			{hasFailure ? (
				<div
					role='alert'
					className='absolute top-3 left-1/2 z-11 -translate-x-1/2 rounded-full border-2 border-coral-600 bg-coral-500 px-4 py-1.5 text-sm font-extrabold text-white'
				>
					{t('map.error')}
				</div>
			) : null}
		</div>
	)
}
