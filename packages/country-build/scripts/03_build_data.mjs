import pointOnFeature from '@turf/point-on-feature'
import fs from 'node:fs'
import shp from 'shpjs'
import { canonicalizeContinent, isGameContinent } from './lib/continent.mjs'
import {
	extractCapitalCoords,
	fetchRestcountriesJson,
	pickPrimaryCapital,
	pickPrimaryCurrency,
} from './lib/restcountries.mjs'
import { normalizeUzLatn } from './lib/uz-latn.mjs'
import { cleanWdLabel, fetchWdqsJson } from './lib/wdqs.mjs'

const BASE_COUNTRIES = 'build/base_countries.geojson'
const BASE_CENTROIDS_NDJSON = 'build/base_centroids_z0.geojson'
const NE_COUNTRIES_ZIP = 'upstream/ne_110m_admin_0_countries.zip'
const PLAYABLE_JSON = 'data/playable_states_195.json'
const OVERRIDES_JSON = 'data/manual_overrides.json'

const LANGUAGES = ['en', 'ru', 'uz-Latn']
const WIKIDATA_LANGUAGES = { en: 'En', ru: 'Ru', 'uz-Latn': 'Uz' }

fs.mkdirSync('build', { recursive: true })

function readJson(path) {
	return JSON.parse(fs.readFileSync(path, 'utf8'))
}

function writeJson(path, value) {
	fs.writeFileSync(path, JSON.stringify(value, null, 2), 'utf8')
}

function firstNonEmpty(...vals) {
	for (const v of vals) {
		if (v === undefined || v === null) continue
		if (Array.isArray(v) && v.length === 0) continue
		if (typeof v === 'string' && v.trim() === '') continue
		return v
	}
	return ''
}

function normalizeIsoToken(v) {
	const s = String(v ?? '').trim()
	if (!s || s === '-99') return ''
	return s
}

function firstArrayValue(v) {
	return Array.isArray(v) && v.length ? v[0] : ''
}

function csvQuote(v) {
	const s = String(v ?? '')
	return s === '' ? '' : `"${s.replaceAll('"', '""')}"`
}

function writeCsv(path, header, rows) {
	const out = [header.join(',')]
	for (const row of rows) out.push(row.map(csvQuote).join(','))
	fs.writeFileSync(path, out.join('\n'), 'utf8')
}

function normalizeLabelKey(v) {
	if (typeof v !== 'string') return ''
	return v.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
}

function labelPairKey(name, abbrev) {
	return `${name}|${abbrev}`
}

function addToIndex(indexMap, key, value) {
	if (!key) return
	let set = indexMap.get(key)
	if (!set) {
		set = new Set()
		indexMap.set(key, set)
	}
	set.add(value)
}

function readTippecanoeNdjson(path) {
	if (!fs.existsSync(path)) return []
	const text = fs.readFileSync(path, 'utf8').trim()
	if (!text) return []

	const out = []
	for (const line of text.split(/\r?\n/)) {
		const trimmed = line.trim()
		if (!trimmed) continue
		try {
			const feat = JSON.parse(trimmed)
			const coords = feat?.geometry?.coordinates
			if (
				feat?.type === 'Feature' &&
				feat?.geometry?.type === 'Point' &&
				Array.isArray(coords) &&
				coords.length === 2
			) {
				out.push(feat)
			}
		} catch {
			// Keep parsing the rest even if one line is malformed.
		}
	}
	return out
}

async function loadZipAsFeatureCollection(zipPath) {
	const buf = fs.readFileSync(zipPath)
	const parsed = await shp(buf)
	if (parsed?.type === 'FeatureCollection') return parsed
	if (Array.isArray(parsed)) {
		const fc = parsed.find(x => x?.type === 'FeatureCollection')
		if (fc) return fc
	}
	throw new Error(`Could not parse ${zipPath}`)
}

function validatePlayable(playable) {
	const all = playable.all ?? []
	const easy = new Set(playable.easy ?? [])
	const medium = new Set(playable.medium ?? [])
	const allSet = new Set(all)

	if (all.length !== 195 || allSet.size !== 195) {
		throw new Error(
			'data/playable_states_195.json must contain exactly 195 unique ISO3 codes in `all`',
		)
	}

	for (const code of easy) {
		if (!allSet.has(code))
			throw new Error(`easy contains ${code} which is not in all`)
	}
	for (const code of medium) {
		if (!allSet.has(code))
			throw new Error(`medium contains ${code} which is not in all`)
		if (easy.has(code))
			throw new Error(`Code ${code} appears in both easy and medium`)
	}

	const difficultyByA3 = new Map()
	for (const code of all) {
		if (easy.has(code)) difficultyByA3.set(code, 'easy')
		else if (medium.has(code)) difficultyByA3.set(code, 'medium')
		else difficultyByA3.set(code, 'hard')
	}

	return {
		all,
		allSet,
		easyCount: easy.size,
		mediumCount: medium.size,
		hardCount: all.length - easy.size - medium.size,
		difficultyByA3,
	}
}

function pickNeA3(p) {
	return firstNonEmpty(
		p.ADM0_A3,
		p.ADM0_A3_US,
		p.ADM0_A3_UN,
		p.ISO_A3,
		p.ISO_A3_EH,
		p.SOV_A3,
		p.GU_A3,
		p.SU_A3,
		p.BRK_A3,
	)
}

function pickNeIsoN3(p) {
	return firstNonEmpty(
		normalizeIsoToken(p.ISO_N3),
		normalizeIsoToken(p.UN_A3),
		normalizeIsoToken(p.ADM0_A3_UN),
	)
}

function tileField(prefix, language) {
	return `${prefix}_${language.toLowerCase().replace('-', '_')}`
}

function localizedTileProps(prefix, texts) {
	return Object.fromEntries(
		LANGUAGES.map(language => [tileField(prefix, language), texts[language]]),
	)
}

function normalizeNameKey(v) {
	return String(v ?? '')
		.normalize('NFKD')
		.toLowerCase()
		.replace(/[^\p{Lu}\p{Ll}\p{Lt}\p{Lo}\p{N}]/gu, '')
}

function localize(language, text) {
	const trimmed = String(text ?? '').trim()
	return language === 'uz-Latn' ? normalizeUzLatn(trimmed) : trimmed
}

const playable = validatePlayable(readJson(PLAYABLE_JSON))
const overrides = readJson(OVERRIDES_JSON)
const baseCountries = readJson(BASE_COUNTRIES)
const neCountriesFc = await loadZipAsFeatureCollection(NE_COUNTRIES_ZIP)

const restCountries = await fetchRestcountriesJson({
	cacheKey: 'rc-countries',
	fields: [
		'codes.alpha_3,codes.ccn3',
		'names.common,names.translations',
		'capitals',
		'continents',
		'flag.url_svg,flag.url_png',
		'classification.sovereign,classification.un_member',
		'population',
		'currencies',
	],
})

const restByN3 = new Map()
const restByA3 = new Map()
for (const row of restCountries) {
	const n3 = normalizeIsoToken(row?.codes?.ccn3)
	if (n3 && !restByN3.has(n3)) restByN3.set(n3, row)
	const a3 = row?.codes?.alpha_3
	if (a3 && !restByA3.has(a3)) restByA3.set(a3, row)
}

const wikidata = await fetchWdqsJson({
	cacheKey: 'wdqs-country-capital-names',
	query: `
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?iso3 ?countryEn ?countryRu ?countryUz ?capital ?capitalEn ?capitalRu ?capitalUz WHERE {
  ?country wdt:P298 ?iso3 .
  OPTIONAL { ?country rdfs:label ?countryEn FILTER(LANG(?countryEn) = "en") }
  OPTIONAL { ?country rdfs:label ?countryRu FILTER(LANG(?countryRu) = "ru") }
  OPTIONAL { ?country rdfs:label ?countryUz FILTER(LANG(?countryUz) = "uz") }
  OPTIONAL {
    ?country wdt:P36 ?capital .
    OPTIONAL { ?capital rdfs:label ?capitalEn FILTER(LANG(?capitalEn) = "en") }
    OPTIONAL { ?capital rdfs:label ?capitalRu FILTER(LANG(?capitalRu) = "ru") }
    OPTIONAL { ?capital rdfs:label ?capitalUz FILTER(LANG(?capitalUz) = "uz") }
  }
}
`,
})

const wdByIsoA3 = new Map()
for (const row of wikidata.results.bindings ?? []) {
	const isoA3 = row.iso3?.value?.trim()
	if (!isoA3) continue
	if (!wdByIsoA3.has(isoA3)) {
		wdByIsoA3.set(isoA3, {
			names: Object.fromEntries(
				LANGUAGES.map(language => [language, new Set()]),
			),
			capitals: new Map(),
		})
	}

	const entry = wdByIsoA3.get(isoA3)
	for (const language of LANGUAGES) {
		const suffix = WIKIDATA_LANGUAGES[language]
		const name = cleanWdLabel(row[`country${suffix}`]?.value)
		if (name) entry.names[language].add(localize(language, name))
	}

	const capitalUri = row.capital?.value
	if (capitalUri && !entry.capitals.has(capitalUri)) {
		entry.capitals.set(
			capitalUri,
			Object.fromEntries(
				LANGUAGES.map(language => [
					language,
					localize(
						language,
						cleanWdLabel(
							row[`capital${WIKIDATA_LANGUAGES[language]}`]?.value,
						),
					),
				]),
			),
		)
	}
}

const currencyNames = Object.fromEntries(
	LANGUAGES.map(language => {
		const displayNames = new Intl.DisplayNames([language], {
			type: 'currency',
			fallback: 'none',
		})
		const resolved = displayNames.resolvedOptions().locale
		if (resolved.split('-')[0] !== language.split('-')[0]) {
			throw new Error(
				`Intl has no ${language} currency names (resolved to ${resolved}).`,
			)
		}
		return [language, displayNames]
	}),
)

function currencySymbol(code, language) {
	return new Intl.NumberFormat(language, {
		style: 'currency',
		currency: code,
		currencyDisplay: 'narrowSymbol',
	})
		.formatToParts(0)
		.find(part => part.type === 'currency').value
}

const neByA3 = new Map()
for (const feat of neCountriesFc.features ?? []) {
	const a3 = pickNeA3(feat.properties ?? {})
	if (a3 && !neByA3.has(a3)) neByA3.set(a3, feat)
}

const baseByA3 = new Map()
for (const feat of baseCountries.features ?? []) {
	const p = feat.properties ?? {}
	const a3 = p.ADM0_A3
	if (a3 && !baseByA3.has(a3)) baseByA3.set(a3, feat)
}

const baseCentroidFeatures = readTippecanoeNdjson(BASE_CENTROIDS_NDJSON)
if (baseCentroidFeatures.length === 0) {
	console.warn(
		`No original base centroids found at ${BASE_CENTROIDS_NDJSON}; falling back to pointOnFeature.`,
	)
}

const baseA3ByName = new Map()
const baseA3ByAbbrev = new Map()
const baseA3ByPair = new Map()
for (const [a3, feat] of baseByA3.entries()) {
	const nameKey = normalizeLabelKey(feat.properties?.NAME)
	const abbrevKey = normalizeLabelKey(feat.properties?.ABBREV)
	addToIndex(baseA3ByName, nameKey, a3)
	addToIndex(baseA3ByAbbrev, abbrevKey, a3)
	addToIndex(baseA3ByPair, labelPairKey(nameKey, abbrevKey), a3)
}

function pickSingleCandidate(set) {
	if (!set || set.size !== 1) return ''
	for (const value of set) return value
	return ''
}

const originalCentroidByA3 = new Map()
const centroidMatchStats = {
	source_point_count: baseCentroidFeatures.length,
	matched_source_points: 0,
	ambiguous_source_points: 0,
	unmatched_source_points: 0,
}

for (const feat of baseCentroidFeatures) {
	const p = feat.properties ?? {}
	const nameKey = normalizeLabelKey(p.NAME)
	const abbrevKey = normalizeLabelKey(p.ABBREV)
	const pairKey = labelPairKey(nameKey, abbrevKey)

	let a3 = pickSingleCandidate(baseA3ByPair.get(pairKey))
	if (!a3) a3 = pickSingleCandidate(baseA3ByName.get(nameKey))
	if (!a3) a3 = pickSingleCandidate(baseA3ByAbbrev.get(abbrevKey))

	if (a3) {
		if (!originalCentroidByA3.has(a3)) {
			originalCentroidByA3.set(a3, feat.geometry.coordinates)
		}
		centroidMatchStats.matched_source_points += 1
		continue
	}

	const pairSet = baseA3ByPair.get(pairKey)
	const nameSet = baseA3ByName.get(nameKey)
	const abbrevSet = baseA3ByAbbrev.get(abbrevKey)
	const isAmbiguous =
		(pairSet && pairSet.size > 1) ||
		(!pairSet &&
			((nameSet && nameSet.size > 1) || (abbrevSet && abbrevSet.size > 1)))

	if (isAmbiguous) centroidMatchStats.ambiguous_source_points += 1
	else centroidMatchStats.unmatched_source_points += 1
}

const centroidSourceStats = {
	from_original: 0,
	from_fallback_point_on_feature: 0,
}

function buildCentroidGeometry(a3, props, geometry) {
	const originalCoords = originalCentroidByA3.get(a3)
	if (Array.isArray(originalCoords) && originalCoords.length === 2) {
		centroidSourceStats.from_original += 1
		return {
			type: 'Point',
			coordinates: originalCoords,
		}
	}

	const centroidPoint = pointOnFeature({
		type: 'Feature',
		properties: props,
		geometry,
	})
	centroidSourceStats.from_fallback_point_on_feature += 1
	return centroidPoint.geometry
}

const errors = []

function requireText(a3, field, value) {
	if (typeof value !== 'string' || value.trim() === '') {
		errors.push(`${a3}: no ${field}`)
	}
	return value
}

function pickWikidataName(a3, wd, language) {
	const names = [...(wd?.names[language] ?? [])]
	if (names.length > 1) {
		errors.push(
			`${a3}: several Wikidata names (${language}): ${names.join(' | ')}`,
		)
		return ''
	}
	return names[0] ?? ''
}

function pickWikidataCapital(a3, wd, capitalName) {
	const capitals = [...(wd?.capitals.values() ?? [])]
	const key = normalizeNameKey(capitalName)
	const matching = capitals.filter(
		capital => normalizeNameKey(capital.en) === key,
	)
	if (matching.length === 1) return matching[0]

	errors.push(
		`${a3}: cannot match capital "${capitalName}" among Wikidata capitals: ${capitals.map(capital => capital.en).join(' | ') || 'none'}`,
	)
	return {}
}

function buildCapital(a3, ov, rest, wd) {
	const restCapital = pickPrimaryCapital(rest)
	const overridden = ov.capital?.name ?? {}
	const en = overridden.en || restCapital?.name
	const needsWikidata = LANGUAGES.some(
		language => language !== 'en' && !overridden[language],
	)
	const wdCapital = needsWikidata ? pickWikidataCapital(a3, wd, en) : {}

	return {
		name: {
			en: localize('en', en),
			ru: localize('ru', overridden.ru || wdCapital.ru),
			'uz-Latn': localize(
				'uz-Latn',
				overridden['uz-Latn'] || wdCapital['uz-Latn'],
			),
		},
		coordinates: ov.capital?.coordinates ?? extractCapitalCoords(restCapital),
	}
}

function buildCurrency(a3, ov, rest) {
	const code = firstNonEmpty(
		ov.currencyCode,
		pickPrimaryCurrency(rest?.currencies)?.code,
	)
	if (!code) {
		errors.push(`${a3}: no currency`)
		return null
	}

	return {
		code,
		name: Object.fromEntries(
			LANGUAGES.map(language => [
				language,
				localize(language, currencyNames[language].of(code)),
			]),
		),
		symbol: Object.fromEntries(
			LANGUAGES.map(language => [language, currencySymbol(code, language)]),
		),
	}
}

function buildCountry(a3, baseFeat, neFeat) {
	const base = baseFeat?.properties ?? {}
	const ne = neFeat?.properties ?? {}
	const ov = overrides.countries?.[a3] ?? {}

	const id = firstNonEmpty(
		normalizeIsoToken(ov.isoN3),
		pickNeIsoN3(ne),
		normalizeIsoToken(restByA3.get(a3)?.codes?.ccn3),
	)
	const rest = restByN3.get(id)
	if (!rest) {
		errors.push(`${a3}: no REST Countries entry for ISO_N3 "${id}"`)
		return null
	}
	const wd = wdByIsoA3.get(rest.codes.alpha_3)

	const name = {
		en: localize(
			'en',
			ov.name?.en || rest.names?.common || pickWikidataName(a3, wd, 'en'),
		),
		ru: localize(
			'ru',
			ov.name?.ru ||
				rest.names?.translations?.rus?.common ||
				pickWikidataName(a3, wd, 'ru'),
		),
		'uz-Latn': localize(
			'uz-Latn',
			ov.name?.['uz-Latn'] || pickWikidataName(a3, wd, 'uz-Latn'),
		),
	}
	const label = {
		en: localize('en', firstNonEmpty(ov.label?.en, base.NAME, name.en)),
		ru: localize('ru', firstNonEmpty(ov.label?.ru, name.ru)),
		'uz-Latn': localize(
			'uz-Latn',
			firstNonEmpty(ov.label?.['uz-Latn'], name['uz-Latn']),
		),
	}

	const continent = canonicalizeContinent(
		firstNonEmpty(
			base.CONTINENT,
			ne.CONTINENT,
			ne.REGION_UN,
			firstArrayValue(rest.continents),
		),
		a3,
	)
	if (!isGameContinent(continent)) {
		errors.push(`${a3}: unsupported continent "${continent}"`)
	}

	const capital = buildCapital(a3, ov, rest, wd)
	if (!capital.coordinates) errors.push(`${a3}: no capital coordinates`)

	const country = {
		a3,
		id,
		name,
		label,
		capital,
		currency: buildCurrency(a3, ov, rest),
		continent,
		difficulty: playable.difficultyByA3.get(a3),
		population: rest.population,
		flagUrl: firstNonEmpty(rest.flag?.url_svg, rest.flag?.url_png),
		independent: rest.classification?.sovereign,
		unMember: rest.classification?.un_member,
	}

	if (!/^\d{3}$/.test(id))
		errors.push(`${a3}: ISO_N3 "${id}" is not three digits`)
	for (const language of LANGUAGES) {
		requireText(a3, `name.${language}`, name[language])
		requireText(a3, `label.${language}`, label[language])
		requireText(a3, `capital.${language}`, capital.name[language])
		requireText(a3, `currency.${language}`, country.currency?.name[language])
	}
	requireText(a3, 'flag', country.flagUrl)
	if (typeof country.population !== 'number')
		errors.push(`${a3}: no population`)
	if (typeof country.independent !== 'boolean')
		errors.push(`${a3}: no sovereignty`)
	if (typeof country.unMember !== 'boolean')
		errors.push(`${a3}: no UN membership`)

	return country
}

const countries = []
const supplementalCountries = []
for (const a3 of playable.all) {
	const baseFeat = baseByA3.get(a3)
	const neFeat = neByA3.get(a3)
	const geometry = baseFeat?.geometry ?? neFeat?.geometry
	if (!geometry) {
		errors.push(`${a3}: no geometry`)
		continue
	}

	const country = buildCountry(a3, baseFeat, neFeat)
	if (!country) continue

	country.centroid = buildCentroidGeometry(
		a3,
		{ ADM0_A3: a3 },
		geometry,
	).coordinates
	countries.push(country)

	if (!baseFeat) {
		supplementalCountries.push({
			type: 'Feature',
			properties: { adm0_a3: a3, iso_n3: country.id },
			geometry,
		})
	}
}

const seenIds = new Map()
for (const country of countries) {
	const other = seenIds.get(country.id)
	if (other)
		errors.push(
			`${country.a3}: ISO_N3 ${country.id} is also used by ${other}`,
		)
	seenIds.set(country.id, country.a3)
}

const geolines = Object.entries(overrides.geolines ?? {}).map(
	([baseName, texts]) => {
		for (const language of LANGUAGES) {
			requireText(`geoline "${baseName}"`, language, texts[language])
		}
		return [baseName, ...LANGUAGES.map(language => texts[language])]
	},
)

if (errors.length > 0) {
	console.error(
		`Build blocked: ${errors.length} problem(s). Nothing was written.`,
	)
	for (const error of errors) console.error(`  ${error}`)
	process.exit(1)
}

countries.sort((a, b) => a.id.localeCompare(b.id))

writeJson('build/countries.json', countries)

const idByA3 = new Map(countries.map(country => [country.a3, country.id]))
writeCsv(
	'build/countries_join.csv',
	['ADM0_A3', 'adm0_a3', 'iso_n3'],
	[...baseByA3.keys()].sort().map(a3 => [a3, a3, idByA3.get(a3) ?? '']),
)

writeCsv(
	'build/geolines_join.csv',
	['name', ...LANGUAGES.map(language => tileField('label', language))],
	geolines,
)

writeJson('build/centroids.geojson', {
	type: 'FeatureCollection',
	features: countries.map(country => ({
		type: 'Feature',
		properties: {
			iso_n3: country.id,
			...localizedTileProps('label', country.label),
		},
		geometry: { type: 'Point', coordinates: country.centroid },
	})),
})

writeJson('build/capitals.geojson', {
	type: 'FeatureCollection',
	features: countries.map(country => ({
		type: 'Feature',
		properties: {
			iso_n3: country.id,
			...localizedTileProps('label', country.capital.name),
		},
		geometry: { type: 'Point', coordinates: country.capital.coordinates },
	})),
})

writeJson('build/supplemental_countries.geojson', {
	type: 'FeatureCollection',
	features: supplementalCountries,
})

const report = {
	country_count: countries.length,
	easy_count: playable.easyCount,
	medium_count: playable.mediumCount,
	hard_count: playable.hardCount,
	supplemental_country_count: supplementalCountries.length,
	...centroidMatchStats,
	...centroidSourceStats,
}
writeJson('build/build_data_report.json', report)

console.log('OK')
console.log(JSON.stringify(report, null, 2))
