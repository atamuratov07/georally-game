import { useCallback, useEffect, useState, type RefObject } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import type { MapRevealTarget } from '../types'

const REVEAL_ZOOM = 3.4
const REVEAL_EASE_MS = 900
const REVEAL_OFFSET: [number, number] = [0, 120]

interface RevealCameraOptions {
	mapRef: RefObject<MapRef | null>
	isLoaded: boolean
	target: MapRevealTarget | null
}

export function useRevealCamera({
	mapRef,
	isLoaded,
	target,
}: RevealCameraOptions) {
	const [settledTarget, setSettledTarget] = useState<MapRevealTarget | null>(
		null,
	)

	useEffect(() => {
		const map = mapRef.current?.getMap()
		if (!map || !isLoaded || !target) {
			return
		}

		let settled = false
		const settle = () => {
			if (settled) {
				return
			}
			settled = true
			setSettledTarget(target)
		}

		const handleMoveEnd = () => {
			settle()
			map.off('moveend', handleMoveEnd)
		}

		map.on('moveend', handleMoveEnd)
		const settleTimer = setTimeout(() => {
			settle()
			map.off('moveend', handleMoveEnd)
		}, REVEAL_EASE_MS + 120)

		map.easeTo({
			essential: true,
			center: [target.longitude, target.latitude],
			zoom: Math.max(map.getZoom(), REVEAL_ZOOM),
			offset: REVEAL_OFFSET,
			duration: REVEAL_EASE_MS,
			easing: t => 1 - (1 - t) ** 3,
		})

		return () => {
			clearTimeout(settleTimer)
			map.off('moveend', handleMoveEnd)
		}
	}, [isLoaded, mapRef, target])

	const unsettle = useCallback(() => setSettledTarget(null), [])

	return {
		isSettled: isLoaded && target !== null && settledTarget === target,
		unsettle,
	}
}
