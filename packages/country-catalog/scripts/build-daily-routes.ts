import fs from 'node:fs'
import { parseArgs } from 'node:util'
import type { CountryId } from '@georally/game-domain'
import {
	dailyDay,
	type DailyRouteEntry,
} from '@georally/game-domain/singleplayer/routes'
import bordersJson from '../generated/borders.json'
import { borderGraph } from '../src/borders'
import { countryCatalog, playableCountryPool } from '../src/catalog'
import type { BordersPayload, DailyRoutesPayload } from '../src/types'
import { extendDailyRoutes, pairKey, surprisingOnly } from './dailyRoutes'

const LIST = new URL('../generated/routes-daily.json', import.meta.url)
const DATA = new URL('../data/daily_routes.json', import.meta.url)
const SEED = 20261128

interface PairNote {
	a: CountryId
	b: CountryId
	reason: string
}

interface DailyRoutesData {
	excluded: PairNote[]
	surprising: PairNote[]
}

function fail(message: string): never {
	console.error(message)
	process.exit(1)
}

const { values } = parseArgs({
	options: {
		launch: { type: 'string' },
		count: { type: 'string', default: '1000' },
	},
})

const existing = fs.existsSync(LIST)
	? (JSON.parse(fs.readFileSync(LIST, 'utf8')) as DailyRoutesPayload)
	: null
const launch = existing?.launch ?? values.launch
if (!launch || !/^\d{4}-\d{2}-\d{2}$/.test(launch)) {
	fail('Give the first puzzle’s date as --launch YYYY-MM-DD.')
}
if (existing && values.launch !== undefined && values.launch !== launch) {
	fail(`The list launched on ${launch}, and that date can’t change.`)
}
const count = Number(values.count)
if (!Number.isInteger(count) || count < 1) {
	fail('--count must be a positive whole number.')
}

const data = JSON.parse(fs.readFileSync(DATA, 'utf8')) as DailyRoutesData
const edges = (bordersJson as BordersPayload).edges
const borderKeys = new Set(edges.map(([a, b]) => pairKey(a, b)))
const surprisingKeys = new Set(data.surprising.map(({ a, b }) => pairKey(a, b)))
const stale = [
	...data.surprising.filter(({ a, b }) => !borderKeys.has(pairKey(a, b))),
	...data.excluded.filter(({ a, b }) => !borderGraph[a] || !borderGraph[b]),
]
if (stale.length > 0) {
	fail(
		`Stale entries in daily_routes.json: ${stale.map(note => note.reason).join(', ')}.`,
	)
}

const puzzles = existing?.puzzles ?? []
const added = extendDailyRoutes(
	borderGraph,
	playableCountryPool,
	{ launch, puzzles },
	{
		count,
		seed: SEED,
		excluded: new Set(data.excluded.map(({ a, b }) => pairKey(a, b))),
		surprising: surprisingKeys,
	},
)
const all = [...puzzles, ...added]

const line = (entry: DailyRouteEntry) =>
	`\t\t{ "startId": "${entry.startId}", "targetId": "${entry.targetId}", "par": ${entry.par}, "level": "${entry.level}" }`
fs.writeFileSync(
	LIST,
	`{\n\t"launch": "${launch}",\n\t"puzzles": [\n${all.map(line).join(',\n')}\n\t]\n}\n`,
)

const needsSurprise = surprisingOnly(borderGraph, surprisingKeys)
const name = (id: CountryId) => countryCatalog.countriesById.get(id)?.name.en
const review = added.flatMap((entry, i) => {
	if (!needsSurprise(entry)) return []
	const n = puzzles.length + i + 1
	return [
		`  #${n} ${dailyDay(launch, n)} ${entry.level}: ${name(entry.startId)} → ${name(entry.targetId)}, par ${entry.par}`,
	]
})

console.log(
	`Added #${puzzles.length + 1}–#${all.length}; the list runs to ${dailyDay(launch, all.length)}.`,
)
if (review.length > 0) {
	console.log(
		`Every shortest path of these crosses a surprising border:\n${review.join('\n')}`,
	)
}
