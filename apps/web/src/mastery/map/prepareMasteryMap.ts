import type { Map as MapLibreMap } from 'maplibre-gl'
import { LABELS_BOTTOM_LAYER_ID } from '@/shared/map/map-styles'
import { FADING_PATTERN_ID } from './masteryStyles'

const PATTERN_SIZE = 12
const STRIPE_WIDTH = 4

function fadingPattern() {
	const data = new Uint8Array(PATTERN_SIZE * PATTERN_SIZE * 4)
	for (let y = 0; y < PATTERN_SIZE; y++) {
		for (let x = 0; x < PATTERN_SIZE; x++) {
			if ((x + y) % PATTERN_SIZE >= STRIPE_WIDTH) continue
			data.set([255, 255, 255, 170], (y * PATTERN_SIZE + x) * 4)
		}
	}
	return { width: PATTERN_SIZE, height: PATTERN_SIZE, data }
}

/** Hides the latitude lines and adds the fading hatch. */
export function prepareMasteryMap(map: MapLibreMap) {
	map.setLayoutProperty(LABELS_BOTTOM_LAYER_ID, 'visibility', 'none')
	if (!map.hasImage(FADING_PATTERN_ID)) {
		map.addImage(FADING_PATTERN_ID, fadingPattern(), { pixelRatio: 2 })
	}
}
