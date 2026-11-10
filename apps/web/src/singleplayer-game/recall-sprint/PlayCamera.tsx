import type { Attempt } from '@georally/game-domain/singleplayer/recall-sprint'
import type { LngLat, Map as MapLibreMap, MapLibreEvent } from 'maplibre-gl'
import { useEffect, useRef, type RefObject } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import {
	FLIGHT,
	fitCamera,
	overlayPadding,
	type Overlays,
} from '@/shared/map/camera/framing'
import { boundsOf } from './sprintRegion'
import { prefersReducedMotion } from './useOverlayCamera'

const STAY_MS = 2000
const SPRINT_FLIGHT = { ...FLIGHT, speed: 2.4 }

interface Stay {
	home: { center: LngLat; zoom: number }
}

interface PlayCameraProps {
	attempt: Attempt | null
	overlaysRef: RefObject<Overlays>
	holdRef: RefObject<boolean>
	onLanded: (attemptAt: number) => void
}

export function PlayCamera({
	attempt,
	overlaysRef,
	holdRef,
	onLanded,
}: PlayCameraProps) {
	const map = useMap().current?.getMap()
	const onLandedRef = useRef(onLanded)
	const stayRef = useRef<Stay | null>(null)
	const returnTimerRef = useRef<number | null>(null)

	useEffect(() => {
		onLandedRef.current = onLanded
	})

	useEffect(() => {
		if (!map) {
			return
		}

		const clearStay = () => {
			stayRef.current = null
			holdRef.current = false
			if (returnTimerRef.current !== null) {
				clearTimeout(returnTimerRef.current)
				returnTimerRef.current = null
			}
		}
		const handleMoveStart = (event: MapLibreEvent) => {
			if (event.originalEvent) {
				clearStay()
			}
		}

		map.on('movestart', handleMoveStart)
		return () => {
			map.off('movestart', handleMoveStart)
			clearStay()
		}
	}, [holdRef, map])

	useEffect(() => {
		if (!map || !attempt || attempt.foundIds.length === 0) {
			return
		}

		const land = () => onLandedRef.current(attempt.at)
		const bounds = boundsOf(attempt.foundIds)
		const camera =
			!isPlayerMovingMap(map) &&
			!prefersReducedMotion() &&
			bounds &&
			fitCamera(map, bounds, overlaysRef.current.padding)
		if (!camera) {
			land()
			return
		}

		const stay: Stay = {
			home: stayRef.current?.home ?? {
				center: map.getCenter(),
				zoom: map.getZoom(),
			},
		}
		stayRef.current = stay
		holdRef.current = true
		map.flyTo({ ...camera, ...SPRINT_FLIGHT, essential: true })
		map.once('moveend', land)

		if (returnTimerRef.current !== null) {
			clearTimeout(returnTimerRef.current)
		}
		returnTimerRef.current = window.setTimeout(() => {
			returnTimerRef.current = null
			map.flyTo({
				...stay.home,
				padding: overlayPadding(map, overlaysRef.current.padding),
				...SPRINT_FLIGHT,
				essential: true,
			})
			map.once('moveend', () => {
				if (stayRef.current === stay) {
					stayRef.current = null
					holdRef.current = false
				}
			})
		}, STAY_MS)
	}, [attempt, holdRef, map, overlaysRef])

	return null
}

function isPlayerMovingMap(map: MapLibreMap): boolean {
	return (
		map.dragPan.isActive() ||
		map.scrollZoom.isActive() ||
		map.touchZoomRotate.isActive() ||
		map.doubleClickZoom.isActive() ||
		map.boxZoom.isActive()
	)
}
