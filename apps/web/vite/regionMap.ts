import { geoEqualEarth, geoPath } from 'd3-geo'
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import type { Plugin } from 'vite'

const MODULE_ID = 'virtual:region-map'
const RESOLVED_ID = `\0${MODULE_ID}`

const WIDTH = 800
const ROTATION: [number, number] = [-11, 0]
const MIN_AREA_PX = 3
// A continent drawn on its own leaves out islands smaller than this share of
// its largest landmass, so outliers such as the Aleutians don't set its frame.
const LONE_SHAPE_MIN_SHARE = 0.004
const SHAPE_MARGIN = 2

type Regions = FeatureCollection<MultiPolygon | Polygon, { continent: string }>

function shapeRegions(regions: Regions) {
	const projection = geoEqualEarth().rotate(ROTATION).fitWidth(WIDTH, regions)
	const toPath = geoPath(projection)
	const [[, y0], [, y1]] = toPath.bounds(regions)
	const [tx, ty] = projection.translate()
	projection.translate([tx, ty - y0])

	const roundedPath = (shape: MultiPolygon) =>
		(toPath(shape) ?? '').replace(/-?\d+\.\d+/g, n =>
			String(Math.round(Number(n) * 10) / 10),
		)
	const keep = (polygons: MultiPolygon['coordinates'], minArea: number) => ({
		type: 'MultiPolygon' as const,
		coordinates: polygons.filter(
			coordinates =>
				toPath.area({ type: 'Polygon', coordinates }) >= minArea,
		),
	})

	const paths: Record<string, string> = {}
	const shapes: Record<string, { viewBox: string; path: string }> = {}
	for (const { properties, geometry } of regions.features) {
		const polygons =
			geometry.type === 'Polygon'
				? [geometry.coordinates]
				: geometry.coordinates
		paths[properties.continent] = roundedPath(keep(polygons, MIN_AREA_PX))

		const largest = Math.max(
			...polygons.map(coordinates =>
				toPath.area({ type: 'Polygon', coordinates }),
			),
		)
		const lone = keep(polygons, largest * LONE_SHAPE_MIN_SHARE)
		const [[left, top], [right, bottom]] = toPath.bounds(lone)
		shapes[properties.continent] = {
			viewBox: [
				Math.floor(left - SHAPE_MARGIN),
				Math.floor(top - SHAPE_MARGIN),
				Math.ceil(right - left + 2 * SHAPE_MARGIN),
				Math.ceil(bottom - top + 2 * SHAPE_MARGIN),
			].join(' '),
			path: roundedPath(lone),
		}
	}

	return { viewBox: `0 0 ${WIDTH} ${Math.ceil(y1 - y0)}`, paths, shapes }
}

export function regionMap(): Plugin {
	const source = createRequire(import.meta.url).resolve(
		'@georally/country-catalog/regions.geojson',
	)

	return {
		name: 'region-map',
		resolveId(id) {
			return id === MODULE_ID ? RESOLVED_ID : undefined
		},
		load(id) {
			if (id !== RESOLVED_ID) return undefined

			this.addWatchFile(source)
			const { viewBox, paths, shapes } = shapeRegions(
				JSON.parse(fs.readFileSync(source, 'utf8')),
			)
			return [
				`export const REGION_MAP_VIEWBOX = ${JSON.stringify(viewBox)}`,
				`export const REGION_PATHS = ${JSON.stringify(paths)}`,
				`export const REGION_SHAPES = ${JSON.stringify(shapes)}`,
			].join('\n')
		},
	}
}
