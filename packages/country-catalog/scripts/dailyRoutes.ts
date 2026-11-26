import {
	GAME_DIFFICULTIES,
	pickRandomIds,
	seededRandom,
	type CountryId,
	type CountryPool,
	type GameDifficulty,
} from '@georally/game-domain'
import {
	detour,
	distancesFrom,
	fromEdges,
	routeDistances,
	type BorderGraph,
} from '@georally/game-domain/borders'
import {
	byRegionPair,
	dailyDay,
	dailyLevel,
	fitsLevel,
	ratingRank,
	routeRegionOf,
	type DailyRouteEntry,
	type RouteEnds,
} from '@georally/game-domain/singleplayer/routes'
import type { DailyRoutesPayload } from '../src/types'

const ENDPOINT_WINDOW = 30
const WEEK = 7
const REGION_CAP = 3

type Pair = [CountryId, CountryId]
type Candidate = RouteEnds & { par: number }

export const pairKey = (a: CountryId, b: CountryId) => [a, b].sort().join('-')

export function surprisingOnly(
	graph: BorderGraph,
	surprising: ReadonlySet<string>,
): (entry: Candidate) => boolean {
	const ordinary = fromEdges(
		Object.entries(graph).flatMap(([a, neighbours]) =>
			neighbours
				.filter(b => a < b && !surprising.has(pairKey(a, b)))
				.map(b => [a, b] as Pair),
		),
	)
	const fromStart = new Map<CountryId, ReadonlyMap<CountryId, number>>()
	return ({ startId, targetId, par }) => {
		let distances = fromStart.get(startId)
		if (!distances) {
			distances = distancesFrom(ordinary, startId)
			fromStart.set(startId, distances)
		}
		return distances.get(targetId) !== par + 1
	}
}

export function extendDailyRoutes(
	graph: BorderGraph,
	pool: CountryPool,
	{ launch, puzzles }: DailyRoutesPayload,
	options: {
		count: number
		seed: number
		excluded: ReadonlySet<string>
		surprising: ReadonlySet<string>
	},
): DailyRouteEntry[] {
	const rank = ratingRank(pool)
	const ids = Object.keys(graph).sort()
	const needsSurprise = surprisingOnly(graph, options.surprising)

	const pairsByLevel = new Map<GameDifficulty, Pair[]>(
		GAME_DIFFICULTIES.map(level => [level, []]),
	)
	const parOf = new Map<string, number>()
	for (const startId of ids) {
		const distances = distancesFrom(graph, startId)
		for (const targetId of ids) {
			const steps = distances.get(targetId)
			if (steps === undefined || steps < 2) continue
			parOf.set(`${startId}>${targetId}`, steps - 1)
			for (const level of GAME_DIFFICULTIES) {
				if (
					fitsLevel(graph, rank, { startId, targetId }, steps - 1, level)
				) {
					pairsByLevel.get(level)!.push([startId, targetId])
				}
			}
		}
	}

	const countriesByPair = new Map<string, CountryId[]>()
	const countriesOf = ({ startId, targetId }: RouteEnds) => {
		const key = `${startId}>${targetId}`
		let countries = countriesByPair.get(key)
		if (!countries) {
			const distances = routeDistances(graph, startId, targetId)!
			countries = ids.filter(id => detour(distances, id) === 0)
			countriesByPair.set(key, countries)
		}
		return countries
	}

	const regionOf = (id: CountryId) =>
		routeRegionOf(pool.countriesById[id].continent)
	const homeRegion = ({ startId, targetId }: RouteEnds) => {
		const region = regionOf(startId)
		return region !== null && region === regionOf(targetId) ? region : null
	}

	const list = [...puzzles]
	for (let n = puzzles.length + 1; n <= puzzles.length + options.count; n++) {
		const level = dailyLevel(dailyDay(launch, n))
		const pairs = pairsByLevel.get(level)!
		const random = seededRandom(options.seed + n)
		const order =
			level === 'hard'
				? byRegionPair(pairs, pool, random)
				: pickRandomIds(pairs, pairs.length, random)

		const before = (size: number) => list.slice(Math.max(0, n - 1 - size))
		const usedEnds = new Set(
			before(ENDPOINT_WINDOW).flatMap(entry => [
				entry.startId,
				entry.targetId,
			]),
		)
		const lastWeek = before(WEEK - 1)
		const usedCountries = new Set(lastWeek.flatMap(countriesOf))
		const homeRegions = lastWeek.map(homeRegion)

		const allowed: Candidate[] = order
			.map(([startId, targetId]) => ({
				startId,
				targetId,
				par: parOf.get(`${startId}>${targetId}`)!,
			}))
			.filter(
				({ startId, targetId }) =>
					!options.excluded.has(pairKey(startId, targetId)) &&
					!usedEnds.has(startId) &&
					!usedEnds.has(targetId),
			)
		const fresh = (ends: RouteEnds) =>
			countriesOf(ends).every(id => !usedCountries.has(id))
		const balanced = (ends: RouteEnds) => {
			const region = homeRegion(ends)
			return (
				region === null ||
				homeRegions.filter(other => other === region).length < REGION_CAP
			)
		}

		const fair = (entry: Candidate) =>
			level === 'hard' || !needsSurprise(entry)
		const preferences = [
			(entry: Candidate) => fair(entry) && fresh(entry) && balanced(entry),
			(entry: Candidate) => fair(entry) && balanced(entry),
			fair,
			balanced,
		]
		let pick = allowed[0]
		for (const preferred of preferences) {
			const found = allowed.find(preferred)
			if (found) {
				pick = found
				break
			}
		}
		if (!pick) {
			throw new Error(`No ${level} puzzle fits #${n}.`)
		}
		list.push({ ...pick, level })
	}

	return list.slice(puzzles.length)
}
