import type { CountryId } from '../shared/types'
import type { BorderGraph, BorderLink, RouteDistances } from './types'

type Allowed = (id: CountryId) => boolean

const anywhere: Allowed = () => true

export function fromEdges(
	edges: readonly (readonly [CountryId, CountryId])[],
): BorderGraph {
	const neighbours = new Map<CountryId, Set<CountryId>>()
	const link = (a: CountryId, b: CountryId) => {
		let set = neighbours.get(a)
		if (!set) neighbours.set(a, (set = new Set()))
		set.add(b)
	}
	for (const [a, b] of edges) {
		if (a === b) continue
		link(a, b)
		link(b, a)
	}

	const graph: Record<CountryId, CountryId[]> = {}
	for (const [id, set] of neighbours) graph[id] = [...set].sort()
	return graph
}

export function pathLinks(path: readonly CountryId[]): BorderLink[] {
	return path.slice(1).map((id, i) => [path[i], id] as const)
}

export function distancesFrom(
	graph: BorderGraph,
	from: CountryId,
): ReadonlyMap<CountryId, number> {
	const distance = new Map<CountryId, number>([[from, 0]])
	const queue = [from]
	for (let i = 0; i < queue.length; i++) {
		const node = queue[i]
		const next = distance.get(node)! + 1
		for (const neighbour of graph[node] ?? []) {
			if (distance.has(neighbour)) continue
			distance.set(neighbour, next)
			queue.push(neighbour)
		}
	}
	return distance
}

function trace(
	parent: ReadonlyMap<CountryId, CountryId>,
	from: CountryId,
	to: CountryId,
): CountryId[] {
	const path = [to]
	while (path[0] !== from) path.unshift(parent.get(path[0])!)
	return path
}

export function shortestPath(
	graph: BorderGraph,
	from: CountryId,
	to: CountryId,
	allowed: Allowed = anywhere,
): CountryId[] | null {
	if (!allowed(from) || !allowed(to)) return null

	const parent = new Map<CountryId, CountryId>()
	const seen = new Set([from])
	const queue = [from]
	for (let i = 0; i < queue.length; i++) {
		const node = queue[i]
		if (node === to) return trace(parent, from, to)
		for (const neighbour of graph[node] ?? []) {
			if (seen.has(neighbour) || !allowed(neighbour)) continue
			seen.add(neighbour)
			parent.set(neighbour, node)
			queue.push(neighbour)
		}
	}
	return null
}

export function routeDistances(
	graph: BorderGraph,
	start: CountryId,
	target: CountryId,
): RouteDistances | null {
	const fromStart = distancesFrom(graph, start)
	const shortest = fromStart.get(target)
	if (shortest === undefined) return null
	return { fromStart, toTarget: distancesFrom(graph, target), shortest }
}

export function detour(
	{ fromStart, toTarget, shortest }: RouteDistances,
	x: CountryId,
): number {
	const a = fromStart.get(x)
	const b = toTarget.get(x)
	return a === undefined || b === undefined ? Infinity : a + b - shortest
}

const UNKNOWN_COST = 1 << 16

export function bestCompletion(
	graph: BorderGraph,
	free: ReadonlySet<CountryId>,
	from: CountryId,
	to: CountryId,
): CountryId[] | null {
	const cost = new Map<CountryId, number>([[from, 0]])
	const parent = new Map<CountryId, CountryId>()
	const settled = new Set<CountryId>()
	const open = [from]

	while (open.length > 0) {
		let best = 0
		for (let i = 1; i < open.length; i++) {
			if (cost.get(open[i])! < cost.get(open[best])!) best = i
		}
		const [node] = open.splice(best, 1)
		if (node === to) return trace(parent, from, to)
		if (settled.has(node)) continue
		settled.add(node)

		for (const neighbour of graph[node] ?? []) {
			const step =
				neighbour === to || free.has(neighbour) ? 1 : 1 + UNKNOWN_COST
			const next = cost.get(node)! + step
			const known = cost.get(neighbour)
			if (known !== undefined && known <= next) continue
			cost.set(neighbour, next)
			parent.set(neighbour, node)
			open.push(neighbour)
		}
	}
	return null
}

export function easiestShortestPathRank(
	graph: BorderGraph,
	from: CountryId,
	to: CountryId,
	rank: (id: CountryId) => number,
): number | null {
	const best = shortestPath(graph, from, to)
	if (!best) return null

	const ceilings = [
		...new Set([from, to, ...Object.keys(graph)].map(rank)),
	].sort((a, b) => a - b)
	for (const ceiling of ceilings) {
		const path = shortestPath(graph, from, to, id => rank(id) <= ceiling)
		if (path?.length === best.length) return ceiling
	}
	return null
}
