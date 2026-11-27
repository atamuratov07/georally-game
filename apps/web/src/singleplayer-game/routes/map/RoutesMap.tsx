import type {
	RouteBoard,
	RouteLink,
	RouteMove,
} from '@georally/game-domain/singleplayer/routes'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import { addHatchPattern } from '@/shared/map/hatchPattern'
import { BaseMap } from '@/shared/map/BaseMap'
import {
	ROUTE_REVEALED_HATCH,
	ROUTE_REVEALED_PATTERN_ID,
} from '@/shared/map/map-styles'
import {
	keepVisibleAreaOnMap,
	viewPadding,
	type Insets,
	type Overlays,
} from '@/shared/map/camera/framing'
import { FinishCamera, FollowCamera } from './routeCameras'
import { RouteLayers } from './RouteLayers'
import { routeFrame } from './routeFrame'
import { RouteTour } from './RouteTour'
import type { ProjectionKind } from '@/shared/map/ProjectionToggle'

const MAX_ZOOM = 7
const FIT_MARGIN = 0.12
const ZOOM_AROUND_CENTER = { around: 'center' } as const
const NO_COVER: Insets = { top: 0, bottom: 0 }

interface RoutesMapProps {
	board: RouteBoard
	countryIds: readonly string[]
	links: readonly RouteLink[]
	knownIds: readonly string[]
	revealedIds: readonly string[]
	chain: readonly string[] | null
	move: RouteMove | null
	padding: Insets
	finishPadding: Insets
	navigationTop: string | null
	projection: ProjectionKind
	pulseEnds: boolean
	finish: 'tour' | 'flight' | null
	onReady: () => void
	onLineSettled: (links: readonly RouteLink[]) => void
	onFinishMoved: () => void
}

function initialView(ids: readonly string[], padding: Insets) {
	const bounds = routeFrame(ids)
	if (!bounds) {
		return undefined
	}
	const [west, south, east, north] = bounds
	return {
		bounds: [west, south, east, north] as [number, number, number, number],
		fitBoundsOptions: {
			padding: viewPadding(
				window.innerWidth,
				window.innerHeight,
				padding,
				FIT_MARGIN,
			),
		},
	}
}

function RoutesMapInner({
	board,
	countryIds,
	links,
	knownIds,
	revealedIds,
	chain,
	move,
	padding,
	finishPadding,
	navigationTop,
	projection,
	pulseEnds,
	finish,
	onReady,
	onLineSettled,
	onFinishMoved,
}: RoutesMapProps) {
	const mapRef = useRef<MapRef | null>(null)
	const [isLoaded, setIsLoaded] = useState(false)
	const overlays = useRef<Overlays>({ padding, cover: NO_COVER })
	const [initialViewState] = useState(() =>
		chain
			? initialView(chain, finishPadding)
			: initialView([board.startId, board.targetId, ...knownIds], padding),
	)
	useEffect(() => {
		overlays.current = {
			padding: chain ? finishPadding : padding,
			cover: NO_COVER,
		}
	})
	const handleLoad = useCallback(() => {
		const map = mapRef.current?.getMap()
		if (map) {
			addHatchPattern(map, ROUTE_REVEALED_PATTERN_ID, ROUTE_REVEALED_HATCH)
			keepVisibleAreaOnMap(map, () => overlays.current)
			map.touchZoomRotate.disableRotation()
			map.getCanvas().removeAttribute('tabindex')
		}
		setIsLoaded(true)
		onReady()
	}, [onReady])

	return (
		<BaseMap
			mapRef={mapRef}
			initialViewState={initialViewState}
			projection={projection}
			onLoad={handleLoad}
			navigationTop={navigationTop}
			maxZoom={MAX_ZOOM}
			dragRotate={false}
			touchPitch={false}
			keyboard={false}
			scrollZoom={ZOOM_AROUND_CENTER}
			touchZoomRotate={ZOOM_AROUND_CENTER}
		>
			<RouteLayers
				loaded={isLoaded}
				board={board}
				countryIds={countryIds}
				links={links}
				revealedIds={revealedIds}
				move={move}
				pulseEnds={pulseEnds}
				onLineSettled={onLineSettled}
			/>
			{isLoaded && finish === null ? (
				<FollowCamera
					board={board}
					knownIds={knownIds}
					move={move}
					padding={padding}
				/>
			) : null}
			{isLoaded && chain && finish === 'flight' ? (
				<FinishCamera
					chain={chain}
					padding={finishPadding}
					onDone={onFinishMoved}
				/>
			) : null}
			{isLoaded && chain && finish === 'tour' ? (
				<RouteTour
					chain={chain}
					padding={finishPadding}
					onDone={onFinishMoved}
				/>
			) : null}
		</BaseMap>
	)
}

export const RoutesMap = memo(RoutesMapInner)
