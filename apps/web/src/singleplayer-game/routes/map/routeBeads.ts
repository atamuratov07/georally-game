import type { FeatureCollection, Point as PointGeometry } from 'geojson'
import { MercatorCoordinate, type FilterSpecification } from 'maplibre-gl'
import { segmentKm, type Point } from './routeGeometry'

const TILE_PX = 512
const FIRST_ZOOM = 1
const LEVEL_ZOOMS = 1.2
const LEVELS = 5

export const WAY_GAP_PX = 30
export const BRANCH_GAP_PX = 16

export interface Bead {
	point: Point
	/** Share of the path's length before the bead. */
	at: number
	level: number
}

const trailingZeros = (n: number) => 31 - Math.clz32(n & -n)

const shownFrom = (level: number) => FIRST_ZOOM + level * LEVEL_ZOOMS

// A bead's level comes from how many times 2 divides its index, so each level
// keeps the beads of the coarser ones and beads never move on zoom. Beads are
// laid out from the same end whichever way the path runs, so the tour's land
// on the line's.
export function beadsAlong(path: readonly Point[], gapPx: number): Bead[] {
	if (path.length < 2) {
		return []
	}
	const [[ax, ay], [bx, by]] = [path[0], path[path.length - 1]]
	const flipped = ax > bx || (ax === bx && ay > by)
	const points = flipped ? [...path].reverse() : path
	const projected = points.map(point => {
		const { x, y } = MercatorCoordinate.fromLngLat([...point])
		return [x, y]
	})
	const lengths = projected
		.slice(1)
		.map(([x, y], i) => Math.hypot(x - projected[i][0], y - projected[i][1]))
	const total = lengths.reduce((sum, length) => sum + length, 0)
	const finest = gapPx / (TILE_PX * 2 ** (FIRST_ZOOM + LEVELS - 1))
	const count = Math.round(total / finest)
	const km = segmentKm(points)
	const totalKm = km.reduce((sum, length) => sum + length, 0)

	const beads: Bead[] = []
	let segment = 0
	let before = 0
	let kmBefore = 0
	for (let j = 1; j < count; j++) {
		const at = (total * j) / count
		while (before + lengths[segment] < at && segment < lengths.length - 1) {
			before += lengths[segment]
			kmBefore += km[segment]
			segment++
		}
		const t = lengths[segment] === 0 ? 0 : (at - before) / lengths[segment]
		const [px, py] = points[segment]
		const [qx, qy] = points[segment + 1]
		// A bead shows only at levels whose gap is at most twice its distance to
		// the far end, where the leftover of the even gaps can be tiny.
		const fromEnd = 31 - Math.clz32(2 * (count - j))
		const share = totalKm === 0 ? 0 : (kmBefore + km[segment] * t) / totalKm
		beads.push({
			point: [px + (qx - px) * t, py + (qy - py) * t],
			at: flipped ? 1 - share : share,
			level: LEVELS - 1 - Math.min(trailingZeros(j), fromEnd, LEVELS - 1),
		})
	}
	return beads
}

export type BeadKind = 'country' | 'end' | 'link'

export interface PlacedBead {
	bead: Bead
	main: boolean
	kind: BeadKind
}

export const countryBead = (point: Point, at: number): Bead => ({
	point,
	at,
	level: 0,
})

export function beadData(
	beads: readonly PlacedBead[],
): FeatureCollection<PointGeometry> {
	return {
		type: 'FeatureCollection',
		features: beads.map(({ bead, main, kind }) => ({
			type: 'Feature',
			properties: { main, kind, level: bead.level },
			geometry: { type: 'Point', coordinates: [...bead.point] },
		})),
	}
}

export const BEAD_LEVELS = Array.from({ length: LEVELS }, (_, level) => level)

export const levelFilter = (level: number): FilterSpecification => [
	'==',
	['get', 'level'],
	level,
]

export const levelMinZoom = (level: number) =>
	level === 0 ? 0 : shownFrom(level)
