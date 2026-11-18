/* Builds outlines for countries spread over many small islands: every island in
 * the base geometry (stage 02) is buffered by the country's `archipelagos`
 * distance in data/playable_states_195.json, the buffers are merged, holes are
 * dropped, and so are parts around a single island.
 */
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import buffer from '@turf/buffer'
import { featureCollection, multiPolygon, polygon } from '@turf/helpers'
import union from '@turf/union'
import fs from 'node:fs'
import path from 'node:path'
import { readCountries } from './lib/countries.mjs'
import {
	ensureDir,
	parseOutDir,
	resolvePackagePath,
} from './lib/output-paths.mjs'

const BASE_GEOJSON = resolvePackagePath('build', 'base_countries.geojson')
const outDir = parseOutDir()
const OUT_FILE = path.join(outDir, 'archipelagos.geojson')
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'))

const { all, archipelagos } = readJson(
	resolvePackagePath('data', 'playable_states_195.json'),
)
const idByA3 = new Map(readCountries().map(country => [country.a3, country.id]))
for (const a3 of Object.keys(archipelagos)) {
	if (!all.includes(a3))
		throw new Error(`archipelagos contains ${a3} which is not in all`)
}

const geometryByA3 = new Map(
	readJson(BASE_GEOJSON).features.map(({ properties, geometry }) => [
		properties.ADM0_A3,
		geometry,
	]),
)
const islandsByA3 = new Map(
	Object.keys(archipelagos).map(a3 => {
		const geometry = geometryByA3.get(a3)
		if (!geometry) throw new Error(`${a3}: missing from ${BASE_GEOJSON}`)
		return [
			a3,
			geometry.type === 'Polygon'
				? [geometry.coordinates]
				: geometry.coordinates,
		]
	}),
)

const COORD_DECIMALS = 4
const LANDMASS_MERGE_KM = 2

const shiftLng = (polygons, offset) =>
	polygons.map(rings =>
		rings.map(ring =>
			ring.map(([lng, lat]) => [
				Number((lng + offset).toFixed(COORD_DECIMALS)),
				lat,
			]),
		),
	)

/**
 * Centres a country on longitude 0, so turf's buffers neither wrap at the
 * antimeridian (Kiribati, Tuvalu) nor fold back into -180..180.
 */
function centreOnZero(islands) {
	const lngs = islands.flat(2).map(([lng]) => lng)
	const unwrapped =
		Math.max(...lngs) - Math.min(...lngs) > 180
			? islands.map(rings =>
					rings.map(ring =>
						ring.map(([lng, lat]) => [lng < 0 ? lng + 360 : lng, lat]),
					),
				)
			: islands
	const eastLngs = unwrapped.flat(2).map(([lng]) => lng)
	const centreLng = (Math.min(...eastLngs) + Math.max(...eastLngs)) / 2
	return { centred: shiftLng(unwrapped, -centreLng), centreLng }
}

/** Buffers every polygon and merges the result; returns outer rings only. */
function bufferAndMerge(polygons, km) {
	const buffers = polygons.map(rings =>
		buffer(polygon(rings), km, { units: 'kilometers' }),
	)
	const merged =
		buffers.length > 1 ? union(featureCollection(buffers)) : buffers[0]
	const parts =
		merged.geometry.type === 'Polygon'
			? [merged.geometry.coordinates]
			: merged.geometry.coordinates
	return parts.map(([outer]) => [outer])
}

const features = Object.entries(archipelagos)
	.sort()
	.map(([a3, bufferKm]) => {
		const { centred, centreLng } = centreOnZero(islandsByA3.get(a3))
		// Islets right next to an island count as one landmass with it.
		const landmasses = bufferAndMerge(centred, LANDMASS_MERGE_KM)
		const outlines = bufferAndMerge(centred, bufferKm).filter(
			part =>
				landmasses.filter(([ring]) =>
					booleanPointInPolygon(ring[0], polygon(part)),
				).length >= 2,
		)
		return multiPolygon(shiftLng(outlines, centreLng), {
			iso_n3: idByA3.get(a3),
		})
	})

ensureDir(outDir)
fs.writeFileSync(OUT_FILE, `${JSON.stringify(featureCollection(features))}\n`)
console.log(`Wrote ${OUT_FILE} with ${features.length} outlines`)
