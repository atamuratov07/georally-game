import type { Map as MapLibreMap } from 'maplibre-gl'

// Listens only after starting the move: starting it stops any move under
// way, and that stop's own moveend must not resolve this one.
export function moveCamera(map: MapLibreMap, move: () => void): Promise<void> {
	return new Promise(resolve => {
		move()
		map.once('moveend', () => resolve())
	})
}
