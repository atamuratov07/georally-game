import fs from 'node:fs'
import path from 'node:path'
import {
	ensureDir,
	parseOutDir,
	resolvePackagePath,
} from './lib/output-paths.mjs'

const COUNTRIES_JSON = resolvePackagePath('build', 'countries.json')
const FLAGS_JSON = resolvePackagePath('build', 'flags.json')

const outDir = parseOutDir()

if (!fs.existsSync(COUNTRIES_JSON)) {
	throw new Error(`Missing ${COUNTRIES_JSON}. Run build:data first.`)
}

if (!fs.existsSync(FLAGS_JSON)) {
	throw new Error(`Missing ${FLAGS_JSON}. Run build:flags first.`)
}

const countries = JSON.parse(fs.readFileSync(COUNTRIES_JSON, 'utf8'))
const flagUrls = JSON.parse(fs.readFileSync(FLAGS_JSON, 'utf8'))

function flagUrl(country) {
	const url = flagUrls[country.id]
	if (!url) {
		throw new Error(`No flag for ${country.a3} in ${FLAGS_JSON}. Run build:flags again.`)
	}
	return url
}

ensureDir(outDir)
fs.writeFileSync(
	path.join(outDir, 'countries.json'),
	JSON.stringify(
		{
			version: 2,
			generated_at: new Date().toISOString(),
			country_count: countries.length,
			countries: countries.map(country => ({
				id: country.id,
				name: country.name,
				capital: country.capital.name,
				currency: country.currency,
				continent: country.continent,
				difficulty: country.difficulty,
				population: country.population,
				centroidLng: country.centroid[0],
				centroidLat: country.centroid[1],
				bounds: country.bounds,
				flagUrl: flagUrl(country),
				independent: country.independent,
				unMember: country.unMember,
			})),
		},
		null,
		2,
	),
	'utf8',
)

console.log(`Wrote ${countries.length} countries to ${outDir}`)
