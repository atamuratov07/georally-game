import type { Map as MapLibreMap } from 'maplibre-gl'
import { addHatchPattern } from '@/shared/map/hatchPattern'
import { LABELS_BOTTOM_LAYER_ID } from '@/shared/map/map-styles'
import { FADING_HATCH, FADING_PATTERN_ID } from './masteryStyles'

/** Hides the latitude lines and adds the fading hatch. */
export function prepareMasteryMap(map: MapLibreMap) {
	map.setLayoutProperty(LABELS_BOTTOM_LAYER_ID, 'visibility', 'none')
	addHatchPattern(map, FADING_PATTERN_ID, FADING_HATCH)
}
