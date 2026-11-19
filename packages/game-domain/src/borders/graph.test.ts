import { describe, expect, it } from 'vitest'

import {
	bestCompletion,
	detour,
	distancesFrom,
	easiestShortestPathRank,
	fromEdges,
	routeDistances,
	shortestPath,
} from './graph'

const graph = fromEdges([
	['PRT', 'ESP'],
	['ESP', 'FRA'],
	['ESP', 'MAR'],
	['FRA', 'BEL'],
	['FRA', 'DEU'],
	['BEL', 'DEU'],
	['FRA', 'CHE'],
	['FRA', 'ITA'],
	['CHE', 'DEU'],
	['CHE', 'ITA'],
	['CHE', 'AUT'],
	['DEU', 'AUT'],
	['ITA', 'AUT'],
])

describe('border graph', () => {
	it('builds symmetric, sorted neighbour lists', () => {
		const built = fromEdges([
			['B', 'A'],
			['C', 'A'],
			['A', 'B'],
			['A', 'A'],
		])
		expect(built).toEqual({ A: ['B', 'C'], B: ['A'], C: ['A'] })
	})

	it('measures distances and shortest paths', () => {
		expect(distancesFrom(graph, 'PRT').get('AUT')).toBe(4)
		expect(shortestPath(graph, 'PRT', 'DEU')).toEqual([
			'PRT',
			'ESP',
			'FRA',
			'DEU',
		])
		expect(shortestPath(graph, 'ESP', 'AUT', id => id !== 'FRA')).toBeNull()
		expect(shortestPath(graph, 'ESP', 'ISL')).toBeNull()
	})

	it('scores how far a country lies off a shortest route', () => {
		const d = routeDistances(graph, 'PRT', 'DEU')!
		expect(d.shortest).toBe(3)
		expect(detour(d, 'FRA')).toBe(0)
		expect(detour(d, 'BEL')).toBe(1)
		expect(detour(d, 'MAR')).toBe(2)
		expect(detour(d, 'ISL')).toBe(Infinity)
		expect(routeDistances(graph, 'PRT', 'ISL')).toBeNull()
	})

	it('completes a route through the countries already known', () => {
		expect(bestCompletion(graph, new Set(), 'ESP', 'AUT')).toEqual([
			'ESP',
			'FRA',
			'CHE',
			'AUT',
		])
		expect(bestCompletion(graph, new Set(['ITA']), 'ESP', 'AUT')).toEqual([
			'ESP',
			'FRA',
			'ITA',
			'AUT',
		])
		expect(
			bestCompletion(graph, new Set(['MAR', 'BEL', 'DEU']), 'ESP', 'AUT'),
		).toEqual(['ESP', 'FRA', 'DEU', 'AUT'])
	})

	it('finds the easiest rank a shortest path can keep to', () => {
		const ranks: Record<string, number> = { CHE: 2, DEU: 2 }
		const rank = (id: string) => ranks[id] ?? 0
		expect(easiestShortestPathRank(graph, 'ESP', 'AUT', rank)).toBe(0)

		ranks.ITA = 2
		expect(easiestShortestPathRank(graph, 'ESP', 'AUT', rank)).toBe(2)
		expect(easiestShortestPathRank(graph, 'ESP', 'ISL', rank)).toBeNull()
	})
})
