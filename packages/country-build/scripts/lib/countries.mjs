import fs from 'node:fs'
import { resolvePackagePath } from './output-paths.mjs'

const COUNTRIES_JSON = resolvePackagePath('build', 'countries.json')

/** The playable country records written by stage 03. */
export function readCountries() {
	if (!fs.existsSync(COUNTRIES_JSON)) {
		throw new Error(`Missing ${COUNTRIES_JSON}. Run build:data first.`)
	}
	return JSON.parse(fs.readFileSync(COUNTRIES_JSON, 'utf8'))
}
