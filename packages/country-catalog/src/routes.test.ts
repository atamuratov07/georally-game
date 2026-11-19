import { easiestShortestPathRank } from '@georally/game-domain/borders'
import {
	createRouteBoard,
	prepareRouteSession,
	ratingRank,
	ROUTE_SCOPE_CONTINENTS,
	ROUTE_SCOPES,
	routeLevels,
} from '@georally/game-domain/singleplayer/routes'
import { GAME_DIFFICULTIES } from '@georally/game-domain'
import { describe, expect, it } from 'vitest'
import { borderGraph } from './borders'
import { playableCountryPool } from './catalog'

function seeded(seed: number) {
	return () => {
		seed = (seed * 16807) % 2147483647
		return seed / 2147483647
	}
}

const rank = ratingRank(playableCountryPool)

describe('route practice sessions', () => {
	it.each(
		ROUTE_SCOPES.flatMap(scope =>
			GAME_DIFFICULTIES.map(difficulty => [scope, difficulty] as const),
		),
	)('%s %s has puzzles at its level', (scope, difficulty) => {
		const prepared = prepareRouteSession(
			borderGraph,
			playableCountryPool,
			{ kind: 'practice', scope, difficulty },
			seeded(7),
		)
		if (!prepared.ok) throw new Error(`No ${scope} ${difficulty} puzzle.`)

		const { startId, targetId } = prepared.value
		const continents = ROUTE_SCOPE_CONTINENTS[scope]
		for (const id of [startId, targetId]) {
			const { continent } = playableCountryPool.countriesById[id]
			expect(continents === null || continents.includes(continent)).toBe(
				true,
			)
		}

		const board = createRouteBoard(borderGraph, prepared.value)!
		const best = easiestShortestPathRank(
			borderGraph,
			startId,
			targetId,
			rank,
		)!
		expect(routeLevels(board.par, best)).toContain(difficulty)
	})
})
