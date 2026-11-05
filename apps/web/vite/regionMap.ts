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

type Regions = FeatureCollection<MultiPolygon | Polygon, { continent: string }>

function shapeRegions(regions: Regions) {
	const projection = geoEqualEarth().rotate(ROTATION).fitWidth(WIDTH, regions)
	const toPath = geoPath(projection)
	const [[, y0], [, y1]] = toPath.bounds(regions)
	const [tx, ty] = projection.translate()
	projection.translate([tx, ty - y0])

	const paths = Object.fromEntries(
		regions.features.map(({ properties, geometry }) => {
			const polygons =
				geometry.type === 'Polygon'
					? [geometry.coordinates]
					: geometry.coordinates
			const visible: MultiPolygon = {
				type: 'MultiPolygon',
				coordinates: polygons.filter(
					coordinates =>
						toPath.area({ type: 'Polygon', coordinates }) >= MIN_AREA_PX,
				),
			}
			const path = (toPath(visible) ?? '').replace(/-?\d+\.\d+/g, n =>
				String(Math.round(Number(n) * 10) / 10),
			)
			return [properties.continent, path]
		}),
	)

	return { viewBox: `0 0 ${WIDTH} ${Math.ceil(y1 - y0)}`, paths }
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
			const { viewBox, paths } = shapeRegions(
				JSON.parse(fs.readFileSync(source, 'utf8')),
			)
			return [
				`export const REGION_MAP_VIEWBOX = ${JSON.stringify(viewBox)}`,
				`export const REGION_PATHS = ${JSON.stringify(paths)}`,
			].join('\n')
		},
	}
}
