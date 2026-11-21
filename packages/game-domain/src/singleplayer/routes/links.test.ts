import { describe, expect, it } from 'vitest'

import { fromEdges, type BorderGraph } from '../../borders'
import type { CountryId } from '../../shared/types'
import { createRouteBoard } from './board'
import { routeLinks } from './links'
import type { PlayingRouteState } from './types'

function linksAfter(
	graph: BorderGraph,
	startId: CountryId,
	targetId: CountryId,
	guesses: readonly CountryId[],
) {
	const board = createRouteBoard(graph, { startId, targetId })!
	const state: PlayingRouteState = {
		phase: 'playing',
		config: { kind: 'practice', scope: 'all', difficulty: 'easy' },
		startId,
		targetId,
		guesses: guesses.map((countryId, at) => ({
			countryId,
			method: 'typing',
			at,
		})),
		hints: [],
		startedAt: 0,
		lastAttempt: null,
	}
	return routeLinks(graph, board, state).map(
		({ link, onWay }) => `${link.join('-')}${onWay ? ' way' : ''}`,
	)
}

describe('routeLinks', () => {
	it('grows from both ends and bridges them with one link', () => {
		const graph = fromEdges([
			['PRT', 'ESP'],
			['ESP', 'AND'],
			['AND', 'FRA'],
			['ESP', 'FRA'],
			['FRA', 'DEU'],
		])
		expect(linksAfter(graph, 'PRT', 'DEU', ['AND', 'FRA', 'ESP'])).toEqual([
			'DEU-FRA way',
			'FRA-AND',
			'PRT-ESP way',
			'ESP-FRA way',
		])
	})

	it('joins through the neighbour closest to the start and leaves out off dead ends', () => {
		const graph = fromEdges([
			['IRN', 'TUR'],
			['TUR', 'BGR'],
			['BGR', 'SRB'],
			['SRB', 'HRV'],
			['BGR', 'ROU'],
			['ROU', 'HUN'],
			['HUN', 'HRV'],
			['ROU', 'UKR'],
			['UKR', 'POL'],
			['POL', 'AUT'],
			['AUT', 'HUN'],
			['AUT', 'ITA'],
		])
		const guesses = ['TUR', 'BGR', 'UKR', 'ROU', 'POL', 'AUT', 'ITA', 'HUN']
		expect(linksAfter(graph, 'IRN', 'HRV', guesses)).toEqual([
			'IRN-TUR way',
			'TUR-BGR way',
			'BGR-ROU way',
			'ROU-HUN way',
			'HUN-HRV way',
		])
	})
})
