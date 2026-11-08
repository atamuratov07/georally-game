import { useCallback, useEffect, useRef, type RefObject } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { MapRef } from 'react-map-gl/maplibre'

const FLIGHT_CURVE = 1.42
const FLIGHT_SPEED = 1.4
const SETTLE_FALLBACK_MS = 4000
const REFRAME_EASE_MS = 250
const MAX_FIT_ZOOM = 5.5
const TINY_TARGET_PX = 14
const FREE_SPACE_MARGIN = 0.2
const MIN_FREE_PX = 40

type Bounds = readonly [
	west: number,
	south: number,
	east: number,
	north: number,
]

export interface FitTarget {
	key: string
	bounds: Bounds
}

interface Insets {
	top: number
	bottom: number
}

interface FitCameraOptions {
	mapRef: RefObject<MapRef | null>
	isLoaded: boolean
	target: FitTarget | null
	insets: Insets
	onSettled: (key: string, isTiny: boolean) => void
}

function corners(bounds: Bounds): [[number, number], [number, number]] {
	const [west, south, east, north] = bounds
	return [
		[west, south],
		[east, north],
	]
}

function frameTarget(
	map: MapLibreMap,
	bounds: Bounds,
	{ top, bottom }: Insets,
) {
	const container = map.getContainer()
	const width = container.clientWidth
	const height = container.clientHeight
	const coveredBottom = Math.min(
		bottom,
		Math.max(height - top - MIN_FREE_PX, 0),
	)
	const freeHeight = Math.max(height - top - coveredBottom, MIN_FREE_PX)
	const side = Math.round(width * FREE_SPACE_MARGIN)
	const vertical = Math.round(freeHeight * FREE_SPACE_MARGIN)

	map.setPadding({ top, bottom: coveredBottom, left: 0, right: 0 })
	return map.cameraForBounds(corners(bounds), {
		padding: { left: side, right: side, top: vertical, bottom: vertical },
		maxZoom: MAX_FIT_ZOOM,
	})
}

function prefersReducedMotion(): boolean {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useFitCamera({
	mapRef,
	isLoaded,
	target,
	insets,
	onSettled,
}: FitCameraOptions): void {
	const { top, bottom } = insets
	const onSettledRef = useRef(onSettled)
	const latestRef = useRef({ target, insets })
	const flightInsetsRef = useRef<Insets | null>(null)

	useEffect(() => {
		onSettledRef.current = onSettled
		latestRef.current = { target, insets }
	})

	const reframe = useCallback((map: MapLibreMap) => {
		const { target: current, insets: currentInsets } = latestRef.current
		if (!current || flightInsetsRef.current) {
			return
		}

		const camera = frameTarget(map, current.bounds, currentInsets)
		if (camera) {
			map.easeTo({
				center: camera.center,
				zoom: camera.zoom,
				duration: prefersReducedMotion() ? 0 : REFRAME_EASE_MS,
			})
		}
	}, [])

	useEffect(() => {
		const map = mapRef.current?.getMap()
		if (!map || !isLoaded) {
			return
		}

		const handleResize = () => reframe(map)
		map.on('resize', handleResize)
		return () => {
			map.off('resize', handleResize)
		}
	}, [isLoaded, mapRef, reframe])

	useEffect(() => {
		const map = mapRef.current?.getMap()
		if (map && isLoaded) {
			reframe(map)
		}
	}, [bottom, isLoaded, mapRef, reframe, top])

	useEffect(() => {
		const map = mapRef.current?.getMap()
		if (!map || !isLoaded || !target) {
			return
		}

		const flightInsets = latestRef.current.insets
		const camera = frameTarget(map, target.bounds, flightInsets)
		const [southWestCorner, northEastCorner] = corners(target.bounds)

		let settled = false
		const settle = () => {
			if (settled) {
				return
			}
			settled = true
			flightInsetsRef.current = null
			map.off('moveend', settle)
			const southWest = map.project(southWestCorner)
			const northEast = map.project(northEastCorner)
			const size = Math.max(
				Math.abs(northEast.x - southWest.x),
				Math.abs(southWest.y - northEast.y),
			)
			onSettledRef.current(target.key, size < TINY_TARGET_PX)

			const { top: nowTop, bottom: nowBottom } = latestRef.current.insets
			if (nowTop !== flightInsets.top || nowBottom !== flightInsets.bottom) {
				reframe(map)
			}
		}

		if (!camera) {
			settle()
			return
		}

		flightInsetsRef.current = flightInsets
		map.on('moveend', settle)
		const fallbackTimer = setTimeout(settle, SETTLE_FALLBACK_MS)

		if (prefersReducedMotion()) {
			map.jumpTo({ center: camera.center, zoom: camera.zoom })
		} else {
			map.flyTo({
				center: camera.center,
				zoom: camera.zoom,
				curve: FLIGHT_CURVE,
				speed: FLIGHT_SPEED,
				essential: true,
			})
		}

		return () => {
			clearTimeout(fallbackTimer)
			flightInsetsRef.current = null
			map.off('moveend', settle)
		}
	}, [isLoaded, mapRef, reframe, target])
}
