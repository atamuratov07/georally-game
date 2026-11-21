import {
	distancesFrom,
	easiestShortestPathRank,
	type BorderGraph,
} from '../../borders'
import type { CountryPool } from '../../catalog/types'
import type { SessionPreparationError } from '../../shared/errors'
import { pickRandomIds, type RandomNumberGenerator } from '../../shared/random'
import { err, ok, type Result } from '../../shared/result'
import type { CountryId, GameContinent } from '../../shared/types'
import {
	parFits,
	ratingRank,
	ROUTE_SCOPE_CONTINENTS,
	routeLevels,
} from './difficulty'
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

function byRegionPair(
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
	const continents = ROUTE_SCOPE_CONTINENTS[config.scope]
	const ids = Object.entries(pool.countriesById)
		.filter(
			([id, country]) =>
				graph[id] !== undefined &&
				(continents === null || continents.includes(country.continent)),
		)
		.map(([id]) => id)
		.sort()

	const pairs: [CountryId, CountryId][] = []
	for (const a of ids) for (const b of ids) if (a !== b) pairs.push([a, b])

	const rank = ratingRank(pool)
	const fromStart = new Map<CountryId, ReadonlyMap<CountryId, number>>()

	const candidates =
		config.difficulty === 'hard'
			? byRegionPair(pairs, pool, rng)
			: pickRandomIds(pairs, pairs.length, rng)
	for (const [startId, targetId] of candidates) {
		let distances = fromStart.get(startId)
		if (!distances) {
			distances = distancesFrom(graph, startId)
			fromStart.set(startId, distances)
		}

		const steps = distances.get(targetId)
		if (steps === undefined || steps < 2) continue
		const par = steps - 1
		if (!parFits(config.difficulty, par)) continue

		const best = easiestShortestPathRank(graph, startId, targetId, rank)
		if (best !== null && routeLevels(par, best).includes(config.difficulty)) {
			return ok({ config, startId, targetId })
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
