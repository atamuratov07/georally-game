import { geoArea, geoCentroid, geoMercator, geoPath } from 'd3-geo'
import type {
	Feature,
	FeatureCollection,
	Geometry,
	MultiPolygon,
	Polygon,
} from 'geojson'
import { feature, mesh, neighbors } from 'topojson-client'
import type { GeometryCollection } from 'topojson-specification'
import world from 'world-atlas/countries-110m.json'
import { DEMO_SIZE } from './demoSize'

const PALETTE = [
	'#BEA8FA',
	'#F6C15B',
	'#B1EE6C',
	'#F3EF60',
	'#6EE47D',
	'#5DCCF6',
	'#8D9CF9',
	'#F79B5F',
]

const objects = world.objects.countries as GeometryCollection
const countries = (feature(world, objects) as FeatureCollection<Geometry>)
	.features
const projection = geoMercator()
	.scale(DEMO_SIZE.width / (2 * Math.PI))
	.translate([DEMO_SIZE.width / 2, DEMO_SIZE.width / 2])
	.precision(0.2)
const path = geoPath(projection)

export interface DemoCountry {
	key: number
	id: string
	d: string
	fill: string
}

const colours = colourByBorders()

export const DEMO_COUNTRIES: DemoCountry[] = countries
	.map((country, index) => ({
		key: index,
		id: String(country.id),
		d: path(country) ?? '',
		fill: PALETTE[colours[index]],
	}))
	.filter(country => country.id !== '010')

function colourByBorders(): number[] {
	const touching = neighbors(objects.geometries)
	const order = touching
		.map((_, index) => index)
		.sort((a, b) => touching[b].length - touching[a].length)
	const colours: number[] = []
	const uses = PALETTE.map(() => 0)
	for (const index of order) {
		const taken = new Set(touching[index].map(other => colours[other]))
		const colour = uses
			.map((count, candidate) => ({ count, candidate }))
			.filter(({ candidate }) => !taken.has(candidate))
			.sort((a, b) => a.count - b.count)[0].candidate
		colours[index] = colour
		uses[colour] += 1
	}
	return colours
}

export const DEMO_COAST =
	path(mesh(world, objects, (a, b) => a === b && a.id !== '010')) ?? ''

const byId = new Map(countries.map(country => [String(country.id), country]))

export interface Camera {
	x: number
	y: number
	k: number
}

export interface Insets {
	top: number
	bottom: number
	side: number
}

export function cameraFor(
	area: [west: number, south: number, east: number, north: number] | string,
	insets: Insets,
	maxZoom = 8,
): Camera {
	const [[x0, y0], [x1, y1]] =
		typeof area === 'string'
			? path.bounds(byId.get(area) as Feature<Geometry>)
			: [
					projection([area[0], area[3]]) ?? [0, 0],
					projection([area[2], area[1]]) ?? [0, 0],
				]
	const width = DEMO_SIZE.width - insets.side * 2
	const height = DEMO_SIZE.height - insets.top - insets.bottom
	const k = Math.min(width / (x1 - x0), height / (y1 - y0), maxZoom)
	return {
		k,
		x: insets.side + width / 2 - (k * (x0 + x1)) / 2,
		y: insets.top + height / 2 - (k * (y0 + y1)) / 2,
	}
}

export function labelPoint(id: string): [number, number] {
	return projection(geoCentroid(mainland(id))) ?? [0, 0]
}

export function onScreen([x, y]: [number, number], camera: Camera) {
	return [camera.x + camera.k * x, camera.y + camera.k * y] as const
}

function mainland(id: string): Feature<Geometry> {
	const country = byId.get(id)
	if (!country || country.geometry.type !== 'MultiPolygon') {
		return country as Feature<Geometry>
	}
	const parts = (country.geometry as MultiPolygon).coordinates.map(
		coordinates =>
			({
				type: 'Feature',
				properties: {},
				geometry: { type: 'Polygon', coordinates },
			}) as Feature<Polygon>,
	)
	return parts.reduce((largest, part) =>
		geoArea(part) > geoArea(largest) ? part : largest,
	)
}
