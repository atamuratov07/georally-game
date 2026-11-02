/* Builds outlines for countries spread over many small islands: every island in
 * the zoom-6 tile dump (stage 02b) is buffered by the country's `archipelagos`
 * distance in data/playable_states_195.json, the buffers are merged, holes are
 * dropped, and so are parts around a single island.
 */
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import buffer from '@turf/buffer'
import { featureCollection, multiPolygon, polygon } from '@turf/helpers'
import union from '@turf/union'
import fs from 'node:fs'
import path from 'node:path'
import { resolvePackagePath } from './lib/output-paths.mjs'

const DUMP_DIR = resolvePackagePath('build', 'tmp_base_country_tiles')
const OUT_FILE = resolvePackagePath(
	'..',
	'..',
	'apps',
	'web',
	'public',
	'map',
	'archipelagos.geojson',
)
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'))

const { all, archipelagos } = readJson(
	resolvePackagePath('data', 'playable_states_195.json'),
)
const seedByA3 = new Map(
	readJson(resolvePackagePath('build', 'country_seed.json')).map(row => [
		row.ADM0_A3,
		row,
	]),
)
for (const a3 of Object.keys(archipelagos)) {
	if (!all.includes(a3))
		throw new Error(`archipelagos contains ${a3} which is not in all`)
}

// tippecanoe-decode -c emits one Feature JSON object per line.
const islandsByA3 = new Map(Object.keys(archipelagos).map(a3 => [a3, []]))
for (const file of fs.readdirSync(DUMP_DIR)) {
	const text = fs.readFileSync(path.join(DUMP_DIR, file), 'utf8')
	for (const line of text.split('\n')) {
		if (!line.trim()) continue
		const { properties, geometry } = JSON.parse(line)
		const islands = islandsByA3.get(properties.ADM0_A3)
		if (!islands) continue
		islands.push(
			...(geometry.type === 'Polygon'
				? [geometry.coordinates]
				: geometry.coordinates),
		)
	}
}

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
		// Tile pieces of one island and islets right next to it count as one landmass.
		const landmasses = bufferAndMerge(centred, LANDMASS_MERGE_KM)
		const outlines = bufferAndMerge(centred, bufferKm).filter(
			part =>
				landmasses.filter(([ring]) =>
					booleanPointInPolygon(ring[0], polygon(part)),
				).length >= 2,
		)
		return multiPolygon(shiftLng(outlines, centreLng), {
			ISO_N3: seedByA3.get(a3).ISO_N3,
			ADM0_A3: a3,
		})
	})

fs.writeFileSync(OUT_FILE, `${JSON.stringify(featureCollection(features))}\n`)
console.log(`Wrote ${OUT_FILE} with ${features.length} outlines`)
