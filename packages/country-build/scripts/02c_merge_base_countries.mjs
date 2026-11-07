import union from '@turf/union'
import { featureCollection } from '@turf/helpers'
import fs from 'node:fs'
import path from 'node:path'

const DIR = 'build/tmp_base_country_tiles'
const OUT = 'build/base_countries.geojson'

if (!fs.existsSync(DIR)) {
	throw new Error(
		`Missing ${DIR}. Run scripts/02b_dump_base_country_tiles.sh first.`,
	)
}

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.geojson'))
const byA3 = new Map()

function readFeatures(raw) {
	const text = raw.trim()
	if (!text) return []

	// First try regular GeoJSON payloads.
	try {
		const parsed = JSON.parse(text)
		if (
			parsed?.type === 'FeatureCollection' &&
			Array.isArray(parsed.features)
		) {
			return parsed.features
		}
		if (parsed?.type === 'Feature') return [parsed]
		if (Array.isArray(parsed)) {
			return parsed.filter(f => f?.type === 'Feature')
		}
	} catch {
		// Fall through to NDJSON parsing below.
	}

	// tippecanoe-decode -c emits one Feature JSON object per line.
	const features = []
	for (const line of text.split(/\r?\n/)) {
		const trimmed = line.trim()
		if (!trimmed) continue
		try {
			const parsed = JSON.parse(trimmed)
			if (parsed?.type === 'Feature') features.push(parsed)
		} catch {
			// Ignore malformed lines; continue processing the file.
		}
	}
	return features
}

for (const file of files) {
	const full = path.join(DIR, file)
	let features
	try {
		const raw = fs.readFileSync(full, 'utf8')
		features = readFeatures(raw)
	} catch {
		continue
	}

	for (const feat of features) {
		const a3 = feat?.properties?.ADM0_A3 ?? feat?.properties?.adm0_a3
		if (!a3 || !/Polygon$/.test(feat?.geometry?.type ?? '')) continue
		if (!byA3.has(a3)) byA3.set(a3, [])
		byA3.get(a3).push(feat)
	}
}

function mergeFragments(fragments) {
	if (fragments.length === 1) return fragments[0]
	const merged = union(featureCollection(fragments))
	return { ...merged, properties: fragments[0].properties }
}

const out = {
	type: 'FeatureCollection',
	features: [...byA3.values()].map(mergeFragments),
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8')
console.log(`Wrote ${OUT} with ${out.features.length} unique countries`)
