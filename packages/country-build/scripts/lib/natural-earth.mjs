import fs from 'node:fs'
import shp from 'shpjs'
import { resolvePackagePath } from './output-paths.mjs'

/** Reads a Natural Earth shapefile zip from upstream/ as one FeatureCollection. */
export async function readNaturalEarth(name) {
	const file = resolvePackagePath('upstream', `${name}.zip`)
	if (!fs.existsSync(file)) {
		throw new Error(`Missing ${file}. Run scripts/01_get_sources.sh first.`)
	}
	const parsed = await shp(fs.readFileSync(file))
	if (parsed?.type !== 'FeatureCollection') {
		throw new Error(`${file} must hold exactly one shapefile`)
	}
	return parsed
}
