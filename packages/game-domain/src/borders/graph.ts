import type { CountryId } from '../shared/types'
import type { BorderGraph, RouteDistances } from './types'

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

export function bestCompletion(
	graph: BorderGraph,
	free: ReadonlySet<CountryId>,
	from: CountryId,
	to: CountryId,
): CountryId[] | null {
	const cost = new Map<CountryId, number>([[from, 0]])
	const parent = new Map<CountryId, CountryId>()
	let layer = [from]

	for (let c = 0; layer.length > 0; c++) {
		const next: CountryId[] = []
		for (let i = 0; i < layer.length; i++) {
			const node = layer[i]
			if (cost.get(node) !== c) continue
			if (node === to) return trace(parent, from, to)

			for (const neighbour of graph[node] ?? []) {
				const step = neighbour === to || free.has(neighbour) ? 0 : 1
				const known = cost.get(neighbour)
				if (known !== undefined && known <= c + step) continue
				cost.set(neighbour, c + step)
				parent.set(neighbour, node)
				;(step === 0 ? layer : next).push(neighbour)
			}
		}
		layer = next
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
