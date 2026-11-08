import { normalizeCountryId } from '@georally/country-catalog'
import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react'
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/maplibre'
import type { MapPointerProps } from '../BaseMap'
import {
	ARCHIPELAGO_FILL_LAYER_ID,
	ARCHIPELAGO_SOURCE_ID,
	BASE_STYLE_LAYER_ID,
	SOURCE_ID,
	SOURCE_LAYER_ID,
} from '../map-styles'
import type { MapHighlight } from '../types'

const PICKABLE_LAYER_IDS = [BASE_STYLE_LAYER_ID, ARCHIPELAGO_FILL_LAYER_ID]

interface CountryPickingOptions {
	mapRef: RefObject<MapRef | null>
	isLoaded: boolean
	disabled: boolean
	interactiveIds: ReadonlySet<string>
	highlights: readonly MapHighlight[]
	onPick: (countryId: string) => void
}

function featureCountryId(event: MapLayerMouseEvent): string | null {
	const rawId = event.features?.[0]?.id
	return rawId === null || rawId === undefined
		? null
		: normalizeCountryId(rawId)
}

function isWrong(countryId: string, highlights: readonly MapHighlight[]) {
	return highlights.some(
		highlight =>
			highlight.countryId === countryId && highlight.tone === 'wrong',
	)
}

export function useCountryPicking({
	mapRef,
	isLoaded,
	disabled,
	interactiveIds,
	highlights,
	onPick,
}: CountryPickingOptions) {
	const hoveredIdRef = useRef<string | null>(null)

	const setHoverState = useCallback(
		(countryId: string, hover: boolean) => {
			const map = mapRef.current?.getMap()
			if (!map) {
				return
			}

			try {
				map.setFeatureState(
					{
						source: SOURCE_ID,
						sourceLayer: SOURCE_LAYER_ID,
						id: countryId,
					},
					{ hover },
				)
				map.setFeatureState(
					{ source: ARCHIPELAGO_SOURCE_ID, id: countryId },
					{ hover },
				)
			} catch (error) {
				console.warn('Failed to update hover state:', error)
			}
		},
		[mapRef],
	)

	const clearHover = useCallback(() => {
		const previousId = hoveredIdRef.current
		if (!previousId) {
			return
		}

		setHoverState(previousId, false)
		hoveredIdRef.current = null
	}, [setHoverState])

	useEffect(() => {
		if (disabled) {
			clearHover()
		}
	}, [clearHover, disabled])

	useEffect(() => clearHover, [clearHover])

	const onClick = useCallback(
		(event: MapLayerMouseEvent) => {
			if (disabled || !isLoaded) {
				return
			}

			const pickedId = featureCountryId(event)
			clearHover()
			if (
				!pickedId ||
				!interactiveIds.has(pickedId) ||
				isWrong(pickedId, highlights)
			) {
				return
			}

			onPick(pickedId)
		},
		[clearHover, disabled, highlights, interactiveIds, isLoaded, onPick],
	)

	const onMouseMove = useCallback(
		(event: MapLayerMouseEvent) => {
			const hoveredId = featureCountryId(event)
			const previousId = hoveredIdRef.current
			if (previousId === hoveredId) {
				return
			}

			if (previousId) {
				setHoverState(previousId, false)
				hoveredIdRef.current = null
			}

			if (
				!disabled &&
				hoveredId &&
				interactiveIds.has(hoveredId) &&
				!isWrong(hoveredId, highlights)
			) {
				setHoverState(hoveredId, true)
				hoveredIdRef.current = hoveredId
			}
		},
		[disabled, highlights, interactiveIds, setHoverState],
	)

	const pointerProps = useMemo<MapPointerProps>(
		() => ({
			interactiveLayerIds: PICKABLE_LAYER_IDS,
			onClick,
			onMouseMove,
			onMouseLeave: clearHover,
		}),
		[clearHover, onClick, onMouseMove],
	)

	return { pointerProps, clearHover }
}
