import { Layer } from 'react-map-gl/maplibre'
import { LABELS_BOTTOM_LAYER_ID } from '@/shared/map/map-styles'
import { BEAD_LEVELS, levelFilter, levelMinZoom } from './routeBeads'
import { BEAD_SHADOW_PAINT, BEAD_SORT, beadPaint } from './routeLineStyle'

export const LINE_BEADS_ID = 'route-beads'
/** The line's lowest bead layer, which the tour's trail goes under. */
export const LINE_BEADS_BOTTOM_ID = `${LINE_BEADS_ID}-shadow-0`

/**
 * One layer per bead level, each shown from its zoom; shadows come first so
 * none falls on a bead of another level. `id` is also the beads' source, named
 * on each layer because `Source` only fills it in on its direct children.
 */
export function BeadLayers({
	id,
	rim,
	grow,
	shadows,
}: {
	id: string
	rim: string
	grow?: number
	shadows: boolean
}) {
	return (
		<>
			{shadows &&
				BEAD_LEVELS.map(level => (
					<Layer
						key={`shadow-${level}`}
						id={`${id}-shadow-${level}`}
						type='circle'
						source={id}
						filter={levelFilter(level)}
						minzoom={levelMinZoom(level)}
						beforeId={LABELS_BOTTOM_LAYER_ID}
						paint={BEAD_SHADOW_PAINT}
					/>
				))}
			{BEAD_LEVELS.map(level => (
				<Layer
					key={level}
					id={`${id}-${level}`}
					type='circle'
					source={id}
					filter={levelFilter(level)}
					minzoom={levelMinZoom(level)}
					beforeId={LABELS_BOTTOM_LAYER_ID}
					layout={{ 'circle-sort-key': BEAD_SORT }}
					paint={beadPaint(rim, grow)}
				/>
			))}
		</>
	)
}
