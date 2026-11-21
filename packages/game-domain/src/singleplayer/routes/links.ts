import {
	distancesFrom,
	fromEdges,
	pathLinks,
	type BorderGraph,
	type BorderLink,
} from '../../borders'
import type { CountryId } from '../../shared/types'
import type { RouteBoard } from './board'
import { getMissingIds, getMoves } from './selectors'
import type { StartedRouteState } from './types'

export interface RouteLink {
	link: BorderLink
	onWay: boolean
}

type End = 'start' | 'target'

const linkKey = ([a, b]: BorderLink) => (a < b ? `${a}-${b}` : `${b}-${a}`)

function stepsOf(board: RouteBoard, state: StartedRouteState): CountryId[][] {
	const moves = getMoves(state).map(({ countryIds }) => [...countryIds])
	const missing = state.phase === 'finished' ? getMissingIds(board, state) : []
	return missing.length > 0 ? [...moves, missing] : moves
}

export function routeLinks(
	graph: BorderGraph,
	board: RouteBoard,
	state: StartedRouteState,
): RouteLink[] {
	const { startId, targetId } = board
	const onShortestWay = (id: CountryId) => board.verdict(id) === 'route'
	const isOff = (id: CountryId) => board.verdict(id) === 'off'
	const links: BorderLink[] = []
	const endOf = new Map<CountryId, End>([
		[startId, 'start'],
		[targetId, 'target'],
	])
	const depth = new Map([
		[startId, 0],
		[targetId, 0],
	])
	const known = new Set<CountryId>()
	const pending = new Set<CountryId>()
	const nearest = (ids: readonly CountryId[]) =>
		ids.reduce((best, id) => (depth.get(id)! < depth.get(best)! ? id : best))
	const preferOnWay = (ids: CountryId[]) => {
		const onWay = ids.filter(onShortestWay)
		return onWay.length > 0 ? onWay : ids
	}

	const merge = () => {
		depth.clear()
		for (const [id, distance] of distancesFrom(fromEdges(links), startId)) {
			depth.set(id, distance)
			endOf.set(id, 'start')
		}
	}

	const join = (strict: boolean) => {
		for (const id of pending) {
			const reached = (graph[id] ?? []).filter(n => endOf.has(n))
			const fromStart = reached.filter(n => endOf.get(n) === 'start')
			const side = fromStart.length > 0 ? fromStart : reached
			const sideOnWay = side.filter(onShortestWay)
			const choices = strict
				? onShortestWay(id)
					? sideOnWay
					: []
				: preferOnWay(side)
			if (choices.length === 0) continue

			const from = nearest(choices)
			links.push([from, id])
			endOf.set(id, endOf.get(from)!)
			depth.set(id, depth.get(from)! + 1)
			pending.delete(id)

			const across = (graph[id] ?? []).filter(n => endOf.get(n) === 'target')
			if (endOf.get(id) === 'start' && across.length > 0) {
				links.push([id, nearest(preferOnWay(across))])
				merge()
			}
			return true
		}
		return false
	}

	let way: CountryId[] | null = null
	for (const step of stepsOf(board, state)) {
		for (const id of step) {
			known.add(id)
			if (!endOf.has(id)) pending.add(id)
		}
		let joined = true
		while (joined) {
			joined = join(true) || join(false)
		}
		way = board.chainWithin(known)
		if (way) {
			const drawn = new Set(links.map(linkKey))
			links.push(...pathLinks(way).filter(link => !drawn.has(linkKey(link))))
		}
	}

	const wayLinks = new Set(way ? pathLinks(way).map(linkKey) : [])
	let result = links.map(link => ({
		link,
		onWay: way ? wayLinks.has(linkKey(link)) : link.every(onShortestWay),
	}))
	let pruned = true
	while (pruned) {
		const degree = new Map<CountryId, number>()
		for (const { link } of result) {
			for (const id of link) degree.set(id, (degree.get(id) ?? 0) + 1)
		}
		const kept = result.filter(
			({ link }) => !link.some(id => isOff(id) && degree.get(id) === 1),
		)
		pruned = kept.length < result.length
		result = kept
	}
	return result
}
