/* Builds the land border graph from the geometry the map draws (stage 02):
 * two countries are neighbours when they share a stretch of boundary, then
 * data/border_overrides.json is applied.
 */
import fs from 'node:fs'
import path from 'node:path'
import { mesh, neighbors } from 'topojson-client'
import { topology } from 'topojson-server'
import { readCountries } from './lib/countries.mjs'
import {
	ensureDir,
	parseOutDir,
	parsePathOption,
	resolvePackagePath,
} from './lib/output-paths.mjs'
import { exitOnProblems } from './lib/problems.mjs'

const BASE_GEOJSON = resolvePackagePath('build', 'base_countries.geojson')
const OVERRIDES_JSON = resolvePackagePath('data', 'border_overrides.json')
const REPORT_JSON = resolvePackagePath('build', 'borders_report.json')

const outDir = parseOutDir()
const crossingsOutDir = parsePathOption('--crossings-out', outDir)

const REPORT_SHORT_KM = 20
const COORD_DECIMALS = 4

for (const file of [BASE_GEOJSON, OVERRIDES_JSON]) {
	if (!fs.existsSync(file)) throw new Error(`Missing ${file}.`)
}

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const countries = readCountries()
const overrides = readJson(OVERRIDES_JSON)
const base = readJson(BASE_GEOJSON)
const idByA3 = new Map(countries.map(country => [country.a3, country.id]))

const baseA3 = new Set(base.features.map(feature => feature.properties.ADM0_A3))
exitOnProblems(
	[...idByA3.keys()]
		.filter(a3 => !baseA3.has(a3))
		.map(a3 => `${a3}: playable but missing from the base geometry`),
)

// Without quantization the topology keeps the coordinates exactly, so two
// countries share an arc wherever their outlines coincide.
const world = topology({ countries: base })
const geometries = world.objects.countries.geometries
const a3Of = index => geometries[index].properties.ADM0_A3
const isPlayable = index => idByA3.has(a3Of(index))
const nameOf = index => geometries[index].properties.NAME

const pairKey = (a, b) => [a, b].sort().join('|')

/** Every pair of features that shares an arc, as [a, b] with a < b. */
const touching = neighbors(geometries).flatMap((others, a) =>
	others.filter(b => a < b).map(b => [a, b]),
)

/** Pairs of features whose outlines meet only at a point. */
function pointTouches() {
	const featuresByArc = new Map()
	geometries.forEach((geometry, index) => {
		for (const arc of geometry.arcs.flat(2)) {
			const arcIndex = arc < 0 ? ~arc : arc
			if (!featuresByArc.has(arcIndex))
				featuresByArc.set(arcIndex, new Set())
			featuresByArc.get(arcIndex).add(index)
		}
	})
	const featuresByEnd = new Map()
	world.arcs.forEach((arc, arcIndex) => {
		for (const end of [arc[0], arc.at(-1)]) {
			const key = end.join()
			if (!featuresByEnd.has(key)) featuresByEnd.set(key, new Set())
			for (const index of featuresByArc.get(arcIndex) ?? []) {
				featuresByEnd.get(key).add(index)
			}
		}
	})
	const sharesArc = new Set(touching.map(pair => pair.join('|')))
	const pairs = new Set()
	for (const owners of featuresByEnd.values()) {
		const sorted = [...owners].sort((x, y) => x - y)
		sorted.forEach((a, i) => {
			for (const b of sorted.slice(i + 1)) {
				if (!sharesArc.has(`${a}|${b}`)) pairs.add(`${a}|${b}`)
			}
		})
	}
	return [...pairs].map(key => key.split('|').map(Number))
}

const toRadians = degrees => (degrees * Math.PI) / 180

function haversineKm([lng1, lat1], [lng2, lat2]) {
	const h =
		Math.sin(toRadians(lat2 - lat1) / 2) ** 2 +
		Math.cos(toRadians(lat1)) *
			Math.cos(toRadians(lat2)) *
			Math.sin(toRadians(lng2 - lng1) / 2) ** 2
	return 2 * 6371 * Math.asin(Math.sqrt(h))
}

const lineKm = line =>
	line
		.slice(1)
		.reduce((km, point, index) => km + haversineKm(line[index], point), 0)

/** The point halfway along a line, by length. */
function midpoint(line) {
	let remaining = lineKm(line) / 2
	for (let index = 1; index < line.length; index += 1) {
		const a = line[index - 1]
		const b = line[index]
		const km = haversineKm(a, b)
		if (km >= remaining) {
			const t = km === 0 ? 0 : remaining / km
			return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
		}
		remaining -= km
	}
	return line.at(-1)
}

/** The boundary two features share, stitched into lines. */
const sharedLines = (a, b) =>
	mesh(
		world,
		{
			type: 'GeometryCollection',
			geometries: [geometries[a], geometries[b]],
		},
		(x, y) => x !== y,
	).coordinates

const measured = touching.map(([a, b]) => {
	const lines = sharedLines(a, b)
	return { a, b, lines, km: lines.reduce((km, line) => km + lineKm(line), 0) }
})

const borders = new Map()
for (const pair of measured) {
	if (isPlayable(pair.a) && isPlayable(pair.b)) {
		borders.set(pairKey(a3Of(pair.a), a3Of(pair.b)), pair)
	}
}

const overrideProblems = []
for (const kind of Object.keys(overrides)) {
	if (kind !== 'add' && kind !== 'remove') {
		overrideProblems.push(`border_overrides: unknown key "${kind}"`)
	}
}
const overridden = new Set()
for (const kind of ['add', 'remove']) {
	if (!Array.isArray(overrides[kind])) {
		overrideProblems.push(`border_overrides: "${kind}" must be a list`)
		continue
	}
	for (const { a, b, reason, crossing } of overrides[kind]) {
		const label = `border_overrides ${kind} ${a}-${b}`
		if (!idByA3.has(a) || !idByA3.has(b) || a === b) {
			overrideProblems.push(
				`${label}: needs two different playable countries`,
			)
			continue
		}
		if (!reason?.trim()) overrideProblems.push(`${label}: missing reason`)
		const key = pairKey(a, b)
		if (overridden.has(key)) {
			overrideProblems.push(`${label}: pair is overridden twice`)
		}
		overridden.add(key)
		if (kind === 'add') {
			if (borders.has(key)) {
				overrideProblems.push(
					`${label}: the geometry already has this border`,
				)
			} else borders.set(key, crossing ? { crossing } : null)
		} else if (!borders.delete(key)) {
			overrideProblems.push(`${label}: the geometry has no such border`)
		}
	}
}
exitOnProblems(overrideProblems)

const idPair = key =>
	key
		.split('|')
		.map(a3 => idByA3.get(a3))
		.sort()
const keysById = [...borders.keys()].sort((x, y) =>
	idPair(x).join().localeCompare(idPair(y).join()),
)
const edges = keysById.map(idPair)

const round = value => Number(value.toFixed(COORD_DECIMALS))
const roundPoint = ([lng, lat]) => [round(lng), round(lat)]

const crossings = Object.fromEntries(
	keysById
		.filter(key => borders.get(key))
		.map(key => {
			const { lines, crossing } = borders.get(key)
			if (crossing) return [idPair(key).join('-'), roundPoint(crossing)]
			const longest = lines.reduce((best, line) =>
				lineKm(line) > lineKm(best) ? line : best,
			)
			return [idPair(key).join('-'), roundPoint(midpoint(longest))]
		}),
)

const describe = (a, b) => `${a3Of(a)}-${a3Of(b)} (${nameOf(a)} / ${nameOf(b)})`
const bothPlayable = ([a, b]) => isPlayable(a) && isPlayable(b)
const report = {
	short_borders: measured
		.filter(({ a, b }) => bothPlayable([a, b]))
		.filter(pair => pair.km < REPORT_SHORT_KM)
		.sort((x, y) => x.km - y.km)
		.map(pair => ({
			pair: describe(pair.a, pair.b),
			km: Number(pair.km.toFixed(2)),
		})),
	point_touches: pointTouches()
		.filter(bothPlayable)
		.map(([a, b]) => describe(a, b))
		.sort(),
	non_playable_between: geometries
		.map((_, index) => index)
		.filter(index => !isPlayable(index))
		.map(index => ({
			feature: `${a3Of(index)} (${nameOf(index)})`,
			touches: measured
				.filter(({ a, b }) => a === index || b === index)
				.map(({ a, b }) => (a === index ? b : a))
				.filter(isPlayable)
				.map(a3Of)
				.sort(),
		}))
		.filter(entry => entry.touches.length >= 2),
}

const writeJson = (file, value, space) =>
	fs.writeFileSync(file, `${JSON.stringify(value, null, space)}\n`)

ensureDir(outDir)
ensureDir(crossingsOutDir)
writeJson(
	path.join(outDir, 'borders.json'),
	{ version: 1, generated_at: new Date().toISOString(), edges },
	2,
)
fs.writeFileSync(
	path.join(crossingsOutDir, 'border-crossings.json'),
	`{\n${Object.entries(crossings)
		.map(([id, point]) => `\t${JSON.stringify(id)}: ${JSON.stringify(point)}`)
		.join(',\n')}\n}\n`,
)
writeJson(REPORT_JSON, report, 2)

const connected = new Set(edges.flat()).size
console.log(
	`Wrote ${edges.length} borders among ${connected} countries (${countries.length - connected} without a land border), ${Object.keys(crossings).length} crossings`,
)
console.log(`Review ${REPORT_JSON}`)
