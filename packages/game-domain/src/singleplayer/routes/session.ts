import { distancesFrom, type BorderGraph } from '../../borders'
import type { CountryPool } from '../../catalog/types'
import type { SessionPreparationError } from '../../shared/errors'
import { pickRandomIds, type RandomNumberGenerator } from '../../shared/random'
import { err, ok, type Result } from '../../shared/result'
import type { CountryId, GameContinent } from '../../shared/types'
import { fitsLevel, ratingRank, routeRegionOf } from './difficulty'
import type {
	DailyRouteEntry,
	RoutePracticeConfig,
	RouteSession,
} from './types'

const regionOf = (continent: GameContinent) =>
	continent === 'north-america' || continent === 'south-america'
		? 'americas'
		: continent === 'oceania'
			? 'asia'
			: continent

export function byRegionPair(
	pairs: readonly [CountryId, CountryId][],
	pool: CountryPool,
	rng: RandomNumberGenerator,
): [CountryId, CountryId][] {
	const groups = new Map<string, [CountryId, CountryId][]>()
	for (const pair of pairs) {
		const [x, y] = pair
			.map(id => regionOf(pool.countriesById[id].continent))
			.sort()
		const key =
			x !== y && (x === 'americas' || y === 'americas')
				? 'americas-world'
				: `${x}-${y}`
		const group = groups.get(key)
		if (group) group.push(pair)
		else groups.set(key, [pair])
	}
	return pickRandomIds([...groups.values()], groups.size, rng).flatMap(group =>
		pickRandomIds(group, group.length, rng),
	)
}

export function prepareRouteSession(
	graph: BorderGraph,
	pool: CountryPool,
	config: RoutePracticeConfig,
	rng: RandomNumberGenerator = Math.random,
): Result<RouteSession, SessionPreparationError> {
	const regionOfId = (id: CountryId) =>
		routeRegionOf(pool.countriesById[id].continent)
	const ids = Object.keys(pool.countriesById)
		.filter(id => {
			if (graph[id] === undefined) return false
			const region = regionOfId(id)
			return (
				config.regions.length === 0 ||
				(region !== null && config.regions.includes(region))
			)
		})
		.sort()

	const pairs: [CountryId, CountryId][] = []
	for (const a of ids) for (const b of ids) if (a !== b) pairs.push([a, b])

	const rank = ratingRank(pool)
	const fromStart = new Map<CountryId, ReadonlyMap<CountryId, number>>()

	const shuffled =
		config.difficulty === 'hard'
			? byRegionPair(pairs, pool, rng)
			: pickRandomIds(pairs, pairs.length, rng)
	const crosses = ([a, b]: [CountryId, CountryId]) =>
		regionOfId(a) !== regionOfId(b)
	const candidates =
		config.regions.length > 1
			? [
					...shuffled.filter(crosses),
					...shuffled.filter(pair => !crosses(pair)),
				]
			: shuffled
	for (const [startId, targetId] of candidates) {
		let distances = fromStart.get(startId)
		if (!distances) {
			distances = distancesFrom(graph, startId)
			fromStart.set(startId, distances)
		}

		const steps = distances.get(targetId)
		if (steps === undefined || steps < 2) continue
		const ends = { startId, targetId }
		if (fitsLevel(graph, rank, ends, steps - 1, config.difficulty)) {
			return ok({ config, ...ends })
		}
	}

	return err({ code: 'no_eligible_countries' })
}

export function dailyRouteSession(
	list: readonly DailyRouteEntry[],
	number: number,
): RouteSession | null {
	const entry = Number.isInteger(number) ? list[number - 1] : undefined
	if (!entry) return null
	return {
		config: { kind: 'daily', number },
		startId: entry.startId,
		targetId: entry.targetId,
	}
}
