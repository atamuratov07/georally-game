import {
	bestCompletion,
	detour,
	routeDistances,
	shortestPath,
	type BorderGraph,
} from '../../borders'
import type { CountryId } from '../../shared/types'
import type { RouteEnds, RouteVerdict } from './types'

export interface RouteBoard extends RouteEnds {
	par: number
	verdict(id: CountryId): RouteVerdict
	isSolved(known: ReadonlySet<CountryId>): boolean
	completion(known: ReadonlySet<CountryId>): CountryId[] | null
	nextHint(known: ReadonlySet<CountryId>): CountryId | null
	chainWithin(known: ReadonlySet<CountryId>): CountryId[] | null
}

export function createRouteBoard(
	graph: BorderGraph,
	{ startId, targetId }: RouteEnds,
): RouteBoard | null {
	if (startId === targetId) return null
	const distances = routeDistances(graph, startId, targetId)
	if (!distances || distances.shortest < 2) return null

	const isEnd = (id: CountryId) => id === startId || id === targetId
	const chainWithin = (known: ReadonlySet<CountryId>) =>
		shortestPath(graph, startId, targetId, id => isEnd(id) || known.has(id))
	const completion = (known: ReadonlySet<CountryId>) =>
		bestCompletion(graph, known, startId, targetId)

	return {
		startId,
		targetId,
		par: distances.shortest - 1,
		verdict(id) {
			const extra = detour(distances, id)
			return extra === 0 ? 'route' : extra === 1 ? 'near' : 'off'
		},
		isSolved: known => chainWithin(known) !== null,
		completion,
		nextHint: known =>
			completion(known)?.find(id => !isEnd(id) && !known.has(id)) ?? null,
		chainWithin,
	}
}
