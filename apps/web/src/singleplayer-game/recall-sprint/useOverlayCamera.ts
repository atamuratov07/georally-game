import type { GameScope } from '@georally/game-domain'
import type { MapLibreEvent } from 'maplibre-gl'
import { useEffect, useRef, type RefObject } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import {
	fitCamera,
	keepVisibleAreaOnMap,
	overlayPadding,
	type Overlays,
} from '@/shared/map/camera/framing'
import { REGION_MARGIN, regionBounds } from './sprintRegion'

const REFRAME_EASE_MS = 250

interface OverlayCameraOptions {
	mapRef: RefObject<MapRef | null>
	isLoaded: boolean
	scope: GameScope
	overlays: Overlays
	holdRef: RefObject<boolean>
}

export function prefersReducedMotion(): boolean {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useOverlayCamera({
	mapRef,
	isLoaded,
	scope,
	overlays,
	holdRef,
}: OverlayCameraOptions) {
	const overlaysRef = useRef(overlays)
	const takenOverRef = useRef(false)
	const followPendingRef = useRef(false)
	const followedRef = useRef(false)

	useEffect(() => {
		overlaysRef.current = overlays
	})

	useEffect(() => {
		const map = mapRef.current?.getMap()
		if (!map || !isLoaded) {
			return
		}

		keepVisibleAreaOnMap(map, () => overlaysRef.current)

		const handleMoveStart = (event: MapLibreEvent) => {
			if (event.originalEvent) {
				takenOverRef.current = true
			}
		}
		map.on('movestart', handleMoveStart)
		return () => {
			map.off('movestart', handleMoveStart)
		}
	}, [isLoaded, mapRef])

	useEffect(() => {
		const map = mapRef.current?.getMap()
		if (!map || !isLoaded) {
			return
		}

		const followOverlays = () => {
			if (map.isMoving()) {
				if (!followPendingRef.current) {
					followPendingRef.current = true
					map.once('moveend', () => {
						followPendingRef.current = false
						followOverlays()
					})
				}
				return
			}

			const regionCamera =
				!takenOverRef.current &&
				!holdRef.current &&
				fitCamera(map, regionBounds(scope), overlaysRef.current.padding, {
					margin: REGION_MARGIN,
				})
			map.easeTo({
				...(regionCamera || {
					padding: overlayPadding(map, overlaysRef.current.padding),
				}),
				duration:
					followedRef.current && !prefersReducedMotion()
						? REFRAME_EASE_MS
						: 0,
			})
			followedRef.current = true
		}

		followOverlays()
		map.on('resize', followOverlays)
		return () => {
			map.off('resize', followOverlays)
		}
	}, [overlays, holdRef, isLoaded, mapRef, scope])

	return { overlaysRef, takenOverRef }
}
