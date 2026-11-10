import { useCallback, useEffect, useRef, type RefObject } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { MapRef } from 'react-map-gl/maplibre'
import { FLIGHT, fitCamera, type Bounds, type Insets } from './framing'

const SETTLE_FALLBACK_MS = 4000
const REFRAME_EASE_MS = 250

export interface FitTarget {
	key: string
	bounds: Bounds
}

interface FitCameraOptions {
	mapRef: RefObject<MapRef | null>
	isLoaded: boolean
	target: FitTarget | null
	insets: Insets
	onSettled: (key: string) => void
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

		const camera = fitCamera(map, current.bounds, currentInsets)
		if (camera) {
			map.easeTo({
				...camera,
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
		const camera = fitCamera(map, target.bounds, flightInsets)

		let settled = false
		const settle = () => {
			if (settled) {
				return
			}
			settled = true
			flightInsetsRef.current = null
			map.off('moveend', settle)
			onSettledRef.current(target.key)

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
			map.jumpTo(camera)
		} else {
			map.flyTo({ ...camera, ...FLIGHT, essential: true })
		}

		return () => {
			clearTimeout(fallbackTimer)
			flightInsetsRef.current = null
			map.off('moveend', settle)
		}
	}, [isLoaded, mapRef, reframe, target])
}
