import { geoStitch } from 'd3-geo-projection'
import fs from 'node:fs'
import path from 'node:path'
import shp from 'shpjs'
import { merge } from 'topojson-client'
import { topology } from 'topojson-server'
import { canonicalizeContinent, GAME_CONTINENTS } from './lib/continent.mjs'
import {
	ensureDir,
	parseOutDir,
	resolvePackagePath,
} from './lib/output-paths.mjs'

const NE_COUNTRIES_ZIP = resolvePackagePath(
	'upstream',
	'ne_110m_admin_0_countries.zip',
)
const COUNTRIES_JSON = resolvePackagePath('build', 'countries.json')

const outDir = parseOutDir()

if (!fs.existsSync(COUNTRIES_JSON)) {
	throw new Error(`Missing ${COUNTRIES_JSON}. Run build:data first.`)
}

const continentByA3 = new Map(
	JSON.parse(fs.readFileSync(COUNTRIES_JSON, 'utf8')).map(country => [
		country.a3,
		country.continent,
	]),
)

const parsed = await shp(fs.readFileSync(NE_COUNTRIES_ZIP))
const shapes = Array.isArray(parsed)
	? parsed.find(collection => collection.type === 'FeatureCollection')
	: parsed

const features = shapes.features
	.map(feature => {
		const { ADM0_A3: a3, CONTINENT, REGION_UN } = feature.properties
		const continent =
			continentByA3.get(a3) ?? canonicalizeContinent(CONTINENT || REGION_UN, a3)
		return { ...feature, properties: { continent } }
	})
	.filter(feature => GAME_CONTINENTS.has(feature.properties.continent))

const world = topology({
	countries: geoStitch({ type: 'FeatureCollection', features }),
})

const regions = {
	type: 'FeatureCollection',
	features: [...GAME_CONTINENTS].sort().map(continent => ({
		type: 'Feature',
		properties: { continent },
		geometry: merge(
			world,
			world.objects.countries.geometries.filter(
				geometry => geometry.properties.continent === continent,
			),
		),
	})),
}

ensureDir(outDir)
const outFile = path.join(outDir, 'regions.geojson')
fs.writeFileSync(outFile, `${JSON.stringify(regions)}\n`)
console.log(`Wrote ${outFile} with ${regions.features.length} regions`)
