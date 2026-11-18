/* Reads the Natural Earth 10m layers in upstream/ into the GeoJSON the later
 * stages use: the countries the map draws (the variant with boundary lakes cut
 * out), the geographic lines and one label point per sea.
 */
import area from '@turf/area'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import fs from 'node:fs'
import polylabel from 'polylabel'
import { readNaturalEarth } from './lib/natural-earth.mjs'
import { ensureDir, resolvePackagePath } from './lib/output-paths.mjs'
import { exitOnProblems } from './lib/problems.mjs'

const MAX_ZOOM = 6
const LABEL_PRECISION_DEGREES = 0.01

const COUNTRY_FIELDS = [
	'ADM0_A3',
	'NAME',
	'CONTINENT',
	'REGION_UN',
	'SUBREGION',
	'ISO_N3',
	'UN_A3',
	'ADM0_A3_UN',
	'LABEL_X',
	'LABEL_Y',
	'LABELRANK',
]

const pick = (properties, fields) =>
	Object.fromEntries(fields.map(field => [field, properties[field]]))
const feature = (properties, geometry) => ({
	type: 'Feature',
	properties,
	geometry,
})
const writeCollection = (name, features) => {
	const file = resolvePackagePath('build', name)
	fs.writeFileSync(
		file,
		JSON.stringify({ type: 'FeatureCollection', features }),
	)
	console.log(`Wrote ${file} with ${features.length} features`)
}
const isPolygon = geometry =>
	geometry?.type === 'Polygon' || geometry?.type === 'MultiPolygon'
const isLine = geometry =>
	geometry?.type === 'LineString' || geometry?.type === 'MultiLineString'

const problems = []

const countries = (await readNaturalEarth('ne_10m_admin_0_countries_lakes'))
	.features
const seenA3 = new Set()
for (const { properties, geometry } of countries) {
	const a3 = properties.ADM0_A3
	if (!a3) problems.push(`country "${properties.NAME}": no ADM0_A3`)
	else if (seenA3.has(a3)) problems.push(`${a3}: two country features`)
	seenA3.add(a3)
	if (!isPolygon(geometry))
		problems.push(`${a3}: geometry is ${geometry?.type}`)
	if (![properties.LABEL_X, properties.LABEL_Y].every(Number.isFinite))
		problems.push(`${a3}: no label point`)
}

const geolines = (
	await readNaturalEarth('ne_10m_geographic_lines')
).features.filter(({ properties }) => properties.featurecla !== 'Date line')
for (const { properties, geometry } of geolines) {
	if (!properties.name) problems.push('geographic line without a name')
	if (!isLine(geometry)) problems.push(`${properties.name}: not a line`)
}

const seas = (
	await readNaturalEarth('ne_10m_geography_marine_polys')
).features.filter(
	({ properties }) => Math.floor(properties.min_label) <= MAX_ZOOM,
)
for (const { properties, geometry } of seas) {
	if (!isPolygon(geometry))
		problems.push(`sea ${properties.name}: not a polygon`)
	if (!(properties.name_en || properties.name))
		problems.push(`sea ${properties.ne_id}: no name`)
}

exitOnProblems(problems)

const partsOf = geometry =>
	geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
const poleOf = rings => {
	const [lng, lat] = polylabel(rings, LABEL_PRECISION_DEGREES)
	return [lng, lat]
}

/** The pole of inaccessibility of the largest part by area. */
function seaLabelPoint(geometry) {
	const size = rings => area({ type: 'Polygon', coordinates: rings })
	return poleOf(
		partsOf(geometry).reduce((best, part) =>
			size(part) > size(best) ? part : best,
		),
	)
}

/** Distance in degrees of latitude from a point to the nearest vertex of a part. */
function distanceToPart([lng, lat], [outer]) {
	const scale = Math.cos((lat * Math.PI) / 180)
	return Math.min(
		...outer.map(([x, y]) =>
			Math.hypot((((((x - lng) % 360) + 540) % 360) - 180) * scale, y - lat),
		),
	)
}

/**
 * Natural Earth's label point, or the pole of inaccessibility of the nearest
 * part when that point lies in the sea, so a marker on it lands on the country.
 */
function countryLabelPoint({ LABEL_X, LABEL_Y }, geometry) {
	const point = [LABEL_X, LABEL_Y]
	if (booleanPointInPolygon(point, geometry)) return point
	return poleOf(
		partsOf(geometry).reduce((best, part) =>
			distanceToPart(point, part) < distanceToPart(point, best)
				? part
				: best,
		),
	)
}

ensureDir(resolvePackagePath('build'))
const moved = []
writeCollection(
	'base_countries.geojson',
	countries.map(({ properties, geometry }) => {
		const [LABEL_X, LABEL_Y] = countryLabelPoint(properties, geometry)
		if (LABEL_X !== properties.LABEL_X) moved.push(properties.ADM0_A3)
		return feature(
			{ ...pick(properties, COUNTRY_FIELDS), LABEL_X, LABEL_Y },
			geometry,
		)
	}),
)
console.log(`Moved label points from the sea onto land: ${moved.join(', ')}`)
writeCollection(
	'geolines.geojson',
	geolines.map(({ properties, geometry }) =>
		feature({ name: properties.name }, geometry),
	),
)
writeCollection(
	'seas.geojson',
	seas.map(({ properties, geometry }) =>
		feature(
			{
				ne_id: properties.ne_id,
				kind: properties.featurecla,
				min_label: properties.min_label,
				scalerank: properties.scalerank,
				name_en: properties.name_en || properties.name,
				name_ru: properties.name_ru,
				wikidata: properties.wikidataid,
			},
			{ type: 'Point', coordinates: seaLabelPoint(geometry) },
		),
	),
)
