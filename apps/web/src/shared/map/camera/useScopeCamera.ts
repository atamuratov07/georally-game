import type { GameScope } from '@georally/game-domain'
import { useCallback, useEffect, useRef, type RefObject } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import { CONTINENT_VIEW_PRESETS, WORLD_VIEW } from '../continent-view'

const PRESET_EASE_MS = 800
const RESET_EASE_MS = 650

interface ScopeCameraOptions {
	mapRef: RefObject<MapRef | null>
	isLoaded: boolean
	scope: GameScope
	resetViewKey: string | number | null
	onReset: () => void
}

export function useScopeCamera({
	mapRef,
	isLoaded,
	scope,
	resetViewKey,
	onReset,
}: ScopeCameraOptions) {
	const preset = scope === 'all' ? null : CONTINENT_VIEW_PRESETS[scope]

	useEffect(() => {
		const map = mapRef.current?.getMap()
		if (!map || !isLoaded || !preset) {
			return
		}

		const camera = map.cameraForBounds(preset.focusBounds, {
			padding: preset.padding,
		})
		if (!camera) {
			return
		}

		map.easeTo({
			center: camera.center,
			zoom: camera.zoom,
			duration: PRESET_EASE_MS,
			essential: true,
		})
		map.setMinZoom(camera.zoom)
	}, [isLoaded, mapRef, preset])

	const resetView = useCallback(() => {
		const map = mapRef.current?.getMap()
		if (!map || !isLoaded) {
			return
		}

		onReset()

		const reset = {
			essential: true,
			bearing: 0,
			pitch: 0,
			offset: [0, 0] as [number, number],
			duration: RESET_EASE_MS,
		}
		if (!preset) {
			map.easeTo({
				...reset,
				center: WORLD_VIEW.center,
				zoom: WORLD_VIEW.zoom,
			})
			return
		}

		const camera = map.cameraForBounds(preset.focusBounds, {
			padding: preset.padding,
		})
		if (!camera) {
			return
		}

		map.easeTo({ ...reset, center: camera.center, zoom: camera.zoom })
		map.setMinZoom(camera.zoom)
	}, [isLoaded, mapRef, onReset, preset])

	const previousResetViewKeyRef = useRef(resetViewKey)

	useEffect(() => {
		if (
			!isLoaded ||
			resetViewKey === null ||
			resetViewKey === previousResetViewKeyRef.current
		) {
			return
		}

		previousResetViewKeyRef.current = resetViewKey
		const resetTimer = setTimeout(resetView, 0)
		return () => clearTimeout(resetTimer)
	}, [isLoaded, resetViewKey, resetView])

	return { allowGlobe: preset === null, maxBounds: preset?.maxBounds }
}
