import pointOnFeature from '@turf/point-on-feature'
import fs from 'node:fs'
import path from 'node:path'
import { canonicalizeContinent, isGameContinent } from './lib/continent.mjs'
import {
	ensureDir,
	parseRegistryOutputOptions,
	resolvePackagePath,
} from './lib/output-paths.mjs'
import {
	firstUzLatnLabel,
	transliterateCyrillicToUzLatn,
} from './lib/uz-latn.mjs'
import { cleanWdLabel, fetchWdqsJson } from './lib/wdqs.mjs'
import {
	fetchRestcountriesJson,
	pickPrimaryCurrency,
} from './lib/restcountries.mjs'

const SEED_JSON = resolvePackagePath('build', 'country_seed.json')
const OVERRIDES_JSON = resolvePackagePath('data', 'manual_overrides.json')
const CENTROIDS_GEOJSON = resolvePackagePath('build', 'centroids.geojson')
const BASE_COUNTRIES_GEOJSON = resolvePackagePath(
	'build',
	'base_countries.geojson',
)
const SUPPLEMENTAL_COUNTRIES_GEOJSON = resolvePackagePath(
	'build',
	'supplemental_countries.geojson',
)
const VALIDATOR_FAILURES_CSV = resolvePackagePath(
	'build',
	'validator_registry_failures.csv',
)
const BUILD_REPORT_JSON = resolvePackagePath(
	'build',
	'registry_build_report.json',
)

ensureDir(resolvePackagePath('build'))
const { outDir } = parseRegistryOutputOptions()
ensureDir(outDir)

function readJson(path) {
	return JSON.parse(fs.readFileSync(path, 'utf8'))
}

function writeJson(path, value) {
	fs.writeFileSync(path, JSON.stringify(value, null, 2), 'utf8')
}

function csvEscape(v) {
	if (v === null || v === undefined) return ''
	const s = String(v)
	return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}

function writeCsv(path, header, rows) {
	const lines = [header.join(',')]
	for (const row of rows) lines.push(row.map(csvEscape).join(','))
	fs.writeFileSync(path, lines.join('\n'), 'utf8')
}

function firstNonEmpty(...vals) {
	for (const v of vals) {
		if (v === undefined || v === null) continue
		if (typeof v === 'string' && v.trim() === '') continue
		return v
	}
	return ''
}

function isBlank(v) {
	return v === undefined || v === null || String(v).trim() === ''
}

function normalizeIsoN3(v) {
	const s = String(v ?? '').trim()
	if (!s || s === '-99') return ''
	return s
}

function normalizeIsoA3(v) {
	return String(v ?? '')
		.trim()
		.toUpperCase()
}

function extractPointCoords(feature) {
	const coords = feature?.geometry?.coordinates
	if (
		feature?.geometry?.type !== 'Point' ||
		!Array.isArray(coords) ||
		coords.length !== 2
	) {
		return null
	}

	const lng = Number(coords[0])
	const lat = Number(coords[1])
	if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null

	return [lng, lat]
}

function indexGeometryByA3(geometryByA3, featureCollection) {
	for (const feature of featureCollection?.features ?? []) {
		const a3 = String(feature?.properties?.ADM0_A3 ?? '').trim()
		if (!a3 || !feature?.geometry || geometryByA3.has(a3)) continue
		geometryByA3.set(a3, feature.geometry)
	}
}

function fallbackCentroidFromGeometry(a3, geometryByA3) {
	const geometry = geometryByA3.get(a3)
	if (!geometry) return null

	try {
		const fallbackPoint = pointOnFeature({
			type: 'Feature',
			properties: { ADM0_A3: a3 },
			geometry,
		})
		return extractPointCoords(fallbackPoint)
	} catch {
		return null
	}
}

const seed = readJson(SEED_JSON)
const overrides = readJson(OVERRIDES_JSON)
if (!fs.existsSync(CENTROIDS_GEOJSON)) {
	throw new Error(
		`Missing ${CENTROIDS_GEOJSON}. Run your build_data step first.`,
	)
}
if (!fs.existsSync(BASE_COUNTRIES_GEOJSON)) {
	throw new Error(
		`Missing ${BASE_COUNTRIES_GEOJSON}. Run your build_data step first.`,
	)
}
const centroids = readJson(CENTROIDS_GEOJSON)
const baseCountries = readJson(BASE_COUNTRIES_GEOJSON)
const supplementalCountries = fs.existsSync(SUPPLEMENTAL_COUNTRIES_GEOJSON)
	? readJson(SUPPLEMENTAL_COUNTRIES_GEOJSON)
	: { type: 'FeatureCollection', features: [] }

if (!Array.isArray(seed)) {
	throw new Error('build/country_seed.json must be an array')
}

const centroidByA3 = new Map()
for (const feature of centroids.features ?? []) {
	const a3 = String(feature?.properties?.ADM0_A3 ?? '').trim()
	const coords = extractPointCoords(feature)
	if (!a3 || !coords || centroidByA3.has(a3)) continue
	centroidByA3.set(a3, coords)
}

const geometryByA3 = new Map()
indexGeometryByA3(geometryByA3, baseCountries)
indexGeometryByA3(geometryByA3, supplementalCountries)

const centroidSourceStats = {
	from_centroids_geojson: 0,
	from_geometry_fallback: 0,
	missing: 0,
}

/**
 * Fetch only the extra fields the registry needs.
 * This is intentionally separate from build_data.
 */
const restMeta = await fetchRestcountriesJson({
	cacheKey: 'rc-registry-data',
	fields: [
		'codes.alpha_3,codes.ccn3',
		'flag.url_svg,flag.url_png',
		'classification.sovereign,classification.un_member',
		'population',
		'currencies',
	],
})

const restByA3 = new Map()
for (const row of restMeta) {
	if (!row?.codes?.alpha_3) continue
	restByA3.set(row.codes.alpha_3, row)
}

const restByN3 = new Map()
for (const row of restMeta) {
	const n3 = normalizeIsoN3(row?.codes?.ccn3)
	if (!n3 || restByN3.has(n3)) continue
	restByN3.set(n3, row)
}

/**
 * Russian and Uzbek Latin currency labels keyed by ISO 4217 code.
 */
const wdCurrencies = await fetchWdqsJson({
	cacheKey: 'wdqs-currency-labels-v2',
	query: `
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX bd: <http://www.bigdata.com/rdf#>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?code ?currency ?isCurrency ?currencyRuLabel ?currencyUzLabel ?currencyEnLabel WHERE {
  ?currency wdt:P498 ?code .
  BIND(EXISTS { ?currency wdt:P31 wd:Q8142 } AS ?isCurrency)
  OPTIONAL { ?currency rdfs:label ?currencyRuLabel FILTER(LANG(?currencyRuLabel) = "ru") }
  OPTIONAL { ?currency rdfs:label ?currencyUzLabel FILTER(LANG(?currencyUzLabel) = "uz") }
  OPTIONAL { ?currency rdfs:label ?currencyEnLabel FILTER(LANG(?currencyEnLabel) = "en") }
}
`,
})

function wikidataItemNumber(row) {
	const match = /Q(\d+)$/.exec(row.currency?.value ?? '')
	return match ? Number(match[1]) : Number.POSITIVE_INFINITY
}

function isPreferredCurrencyRow(candidate, current) {
	const candidateIsCurrency = candidate.isCurrency?.value === 'true'
	const currentIsCurrency = current.isCurrency?.value === 'true'
	if (candidateIsCurrency !== currentIsCurrency) {
		return candidateIsCurrency
	}
	return wikidataItemNumber(candidate) < wikidataItemNumber(current)
}

const currencyRowByCode = new Map()
for (const row of wdCurrencies.results.bindings ?? []) {
	const code = row.code?.value?.trim()
	if (!code) continue
	const current = currencyRowByCode.get(code)
	if (!current || isPreferredCurrencyRow(row, current)) {
		currencyRowByCode.set(code, row)
	}
}

const currencyRuByCode = new Map()
const currencyUzLatnByCode = new Map()
for (const [code, row] of currencyRowByCode) {
	currencyRuByCode.set(code, cleanWdLabel(row.currencyRuLabel?.value))
	currencyUzLatnByCode.set(
		code,
		firstUzLatnLabel(
			cleanWdLabel(row.currencyUzLabel?.value),
			cleanWdLabel(row.currencyEnLabel?.value),
		),
	)
}

const registry = []
const validatorFailures = []
const seenA3 = new Set()
const seenIds = new Map()

for (const baseRow of seed) {
	const a3 = String(baseRow.ADM0_A3 ?? '').trim()
	const ov = overrides.countries?.[a3] ?? {}
	const seedIsoN3 = normalizeIsoN3(baseRow.ISO_N3)
	const overrideRestA3 = normalizeIsoA3(ov.REST_CCA3)
	const overrideRestN3 = normalizeIsoN3(ov.REST_CCN3)
	const rest =
		(seedIsoN3 ? restByN3.get(seedIsoN3) : null) ??
		(overrideRestN3 ? restByN3.get(overrideRestN3) : null) ??
		(overrideRestA3 ? restByA3.get(overrideRestA3) : null) ??
		restByA3.get(a3) ??
		null

	if (!a3) {
		validatorFailures.push({
			ADM0_A3: '',
			ID: '',
			NAME: String(baseRow.NAME ?? ''),
			MISSING: 'ADM0_A3',
		})
		continue
	}

	if (seenA3.has(a3)) {
		validatorFailures.push({
			ADM0_A3: a3,
			ID: String(baseRow.ISO_N3 ?? ''),
			NAME: String(baseRow.NAME ?? ''),
			MISSING: 'duplicate_ADM0_A3',
		})
		continue
	}
	seenA3.add(a3)

	const centroidFromCentroids = centroidByA3.get(a3) ?? null
	const centroid =
		centroidFromCentroids ?? fallbackCentroidFromGeometry(a3, geometryByA3)
	if (centroidFromCentroids) centroidSourceStats.from_centroids_geojson += 1
	else if (centroid) centroidSourceStats.from_geometry_fallback += 1
	else centroidSourceStats.missing += 1

	const primaryCurrency = pickPrimaryCurrency(rest?.currencies)

	const record = {
		id: String(
			firstNonEmpty(
				seedIsoN3,
				normalizeIsoN3(ov.ISO_N3),
				normalizeIsoN3(rest?.codes?.ccn3),
				baseRow.ISO_N3,
			),
		),
		name: String(firstNonEmpty(baseRow.NAME)),
		name_ru: String(firstNonEmpty(baseRow.NAME_RU)),
		name_uz_latn: String(
			firstUzLatnLabel(
				baseRow.NAME_UZ_LATN,
				transliterateCyrillicToUzLatn(baseRow.NAME_RU),
				baseRow.NAME,
			),
		),
		capital: String(firstNonEmpty(baseRow.CAPITAL)),
		capital_ru: String(firstNonEmpty(baseRow.CAPITAL_RU)),
		capital_uz_latn: String(
			firstUzLatnLabel(
				baseRow.CAPITAL_UZ_LATN,
				transliterateCyrillicToUzLatn(baseRow.CAPITAL_RU),
				baseRow.CAPITAL,
			),
		),
		continent: canonicalizeContinent(baseRow.CONTINENT, a3),
		population:
			typeof ov.POPULATION === 'number'
				? ov.POPULATION
				: typeof rest?.population === 'number'
					? rest.population
					: null,
		currency: String(firstNonEmpty(ov.CURRENCY, primaryCurrency?.name)),
		currency_ru: String(
			firstNonEmpty(
				ov.CURRENCY_RU,
				primaryCurrency?.code
					? currencyRuByCode.get(primaryCurrency.code)
					: '',
			),
		),
		currency_uz_latn: String(
			firstUzLatnLabel(
				ov.CURRENCY_UZ_LATN,
				primaryCurrency?.code
					? currencyUzLatnByCode.get(primaryCurrency.code)
					: '',
				primaryCurrency?.name,
			),
		),
		flag_url: String(
			firstNonEmpty(ov.FLAG_URL, rest?.flag?.url_svg, rest?.flag?.url_png),
		),
		centroid_lng: centroid ? centroid[0] : null,
		centroid_lat: centroid ? centroid[1] : null,
		playable: Number(baseRow.PLAYABLE) === 1,
		difficulty: String(firstNonEmpty(baseRow.DIFFICULTY)),
		independent:
			typeof ov.INDEPENDENT === 'boolean'
				? ov.INDEPENDENT
				: Boolean(rest?.classification?.sovereign),
		un_member:
			typeof ov.UN_MEMBER === 'boolean'
				? ov.UN_MEMBER
				: Boolean(rest?.classification?.un_member),
	}

	const missing = []

	for (const key of [
		'id',
		'name',
		'name_uz_latn',
		'name_ru',
		'capital',
		'capital_ru',
		'capital_uz_latn',
		'continent',
		'currency',
		'currency_ru',
		'currency_uz_latn',
		'flag_url',
		'difficulty',
	]) {
		if (isBlank(record[key])) missing.push(key)
	}

	if (record.population === null) {
		missing.push('population')
	}
	if (
		record.playable &&
		(typeof record.centroid_lng !== 'number' ||
			typeof record.centroid_lat !== 'number')
	) {
		missing.push('centroid')
	}
	if (record.playable && !isGameContinent(record.continent)) {
		missing.push(`unsupported_continent:${record.continent}`)
	}

	const canonicalId = normalizeIsoN3(record.id)
	if (canonicalId) {
		if (seenIds.has(canonicalId)) {
			missing.push(`duplicate_id:${record.id}`)
		} else {
			seenIds.set(canonicalId, a3)
		}
	}

	if (record.playable && missing.length) {
		validatorFailures.push({
			ADM0_A3: a3,
			ID: record.id,
			NAME: record.name,
			MISSING: missing.join('|'),
		})
	}

	registry.push(record)
}

registry.sort((a, b) =>
	String(a.id).localeCompare(String(b.id), undefined, { numeric: true }),
)
const playableRegistry = registry.filter(r => r.playable)

writeJson(path.join(outDir, 'countries.registry.json'), {
	version: 1,
	generated_at: new Date().toISOString(),
	country_count: registry.length,
	countries: registry,
})

writeJson(path.join(outDir, 'countries.playable.json'), {
	version: 1,
	generated_at: new Date().toISOString(),
	playable_count: playableRegistry.length,
	countries: playableRegistry,
})

writeCsv(
	VALIDATOR_FAILURES_CSV,
	['ADM0_A3', 'ID', 'NAME', 'MISSING'],
	validatorFailures.map(r => [r.ADM0_A3, r.ID, r.NAME, r.MISSING]),
)

writeJson(BUILD_REPORT_JSON, {
	seed_country_count: seed.length,
	final_registry_count: registry.length,
	playable_registry_count: playableRegistry.length,
	centroid_from_centroids_geojson: centroidSourceStats.from_centroids_geojson,
	centroid_from_geometry_fallback: centroidSourceStats.from_geometry_fallback,
	centroid_missing: centroidSourceStats.missing,
	validator_failure_count: validatorFailures.length,
})

if (validatorFailures.length > 0) {
	console.error('Registry build blocked.')
	console.error(`Inspect ${VALIDATOR_FAILURES_CSV} and ${BUILD_REPORT_JSON}`)
	process.exitCode = 1
} else {
	console.log('OK')
}

console.log(JSON.stringify(readJson(BUILD_REPORT_JSON), null, 2))
