import fs from 'node:fs'
import path from 'node:path'
import {
	ensureDir,
	parseOutDir,
	resolvePackagePath,
} from './lib/output-paths.mjs'

const COUNTRIES_JSON = resolvePackagePath('build', 'countries.json')

const outDir = parseOutDir()

if (!fs.existsSync(COUNTRIES_JSON)) {
	throw new Error(`Missing ${COUNTRIES_JSON}. Run build:data first.`)
}

const countries = JSON.parse(fs.readFileSync(COUNTRIES_JSON, 'utf8'))

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
				flagUrl: country.flagUrl,
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
