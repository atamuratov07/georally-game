import { useEffect, useState, type RefObject } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import { cn } from '@/shared/utils'

const FADE =
	'bg-[#d8f2ff] [&_.maplibregl-canvas]:transition-opacity [&_.maplibregl-canvas]:duration-300'

export function useShownWhenStyled(
	mapRef: RefObject<MapRef | null>,
	loaded: boolean,
): string {
	const [shown, setShown] = useState(false)

	useEffect(() => {
		const map = mapRef.current?.getMap()
		if (!loaded || !map) return
		const show = () => setShown(true)
		map.once('idle', show)
		return () => {
			map.off('idle', show)
		}
	}, [loaded, mapRef])

	return cn(FADE, !shown && '[&_.maplibregl-canvas]:opacity-0')
}
