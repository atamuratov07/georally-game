import fs from 'node:fs'
import path from 'node:path'
import {
	ensureDir,
	parseOutDir,
	readTilesUrlTemplate,
} from './lib/output-paths.mjs'

const tilesDir = parseOutDir('tiles')
const tilesUrlTemplate = readTilesUrlTemplate()

const metadataPath = path.join(tilesDir, 'metadata.json')
const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))

const tilejson = {
	tilejson: '2.0.0',
	name: 'world',
	type: 'baselayer',
	profile: 'mercator',
	version: '1',
	format: 'pbf',
	minzoom: 0,
	maxzoom: 6,
	bounds: [-180, -85.051129, 180, 85.05112900000002],
	attribution:
		'MapLibre demotiles base geometry; Natural Earth fallback; REST Countries; Wikidata',
	tiles: [tilesUrlTemplate],
	center: [0, 2.5444437451708134e-14, 1],
	vector_layers: JSON.parse(metadata.json).vector_layers.map(
		({ id, minzoom, maxzoom, fields }) => ({ id, minzoom, maxzoom, fields }),
	),
}

ensureDir(tilesDir)
const outputPath = path.join(tilesDir, 'tiles.json')
fs.writeFileSync(outputPath, JSON.stringify(tilejson, null, 2), 'utf8')
fs.rmSync(metadataPath)
console.log(`Wrote ${outputPath}`)
