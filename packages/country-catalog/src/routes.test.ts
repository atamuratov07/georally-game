import { easiestShortestPathRank } from '@georally/game-domain/borders'
import {
	createRouteBoard,
	prepareRouteSession,
	ratingRank,
	ROUTE_REGIONS,
	routeLevels,
	routeRegionOf,
	type RouteRegion,
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
	const regionSets: (readonly RouteRegion[])[] = [
		[],
		...ROUTE_REGIONS.map(region => [region]),
		['europe', 'asia'],
		['africa', 'americas'],
	]
	const regionOfId = (id: string) =>
		routeRegionOf(playableCountryPool.countriesById[id].continent)

	it.each(
		regionSets.flatMap(regions =>
			GAME_DIFFICULTIES.map(difficulty => [regions, difficulty] as const),
		),
	)('%j %s has puzzles at its level', (regions, difficulty) => {
		const prepared = prepareRouteSession(
			borderGraph,
			playableCountryPool,
			{ kind: 'practice', regions, difficulty },
			seeded(7),
		)
		if (!prepared.ok) {
			throw new Error(`No ${regions.join('+')} ${difficulty} puzzle.`)
		}

		const { startId, targetId } = prepared.value
		for (const id of [startId, targetId]) {
			const region = regionOfId(id)
			expect(
				regions.length === 0 ||
					(region !== null && regions.includes(region)),
			).toBe(true)
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

	it('keeps hard world puzzles from crowding into Africa', () => {
		const rng = seeded(11)
		let african = 0
		for (let i = 0; i < 300; i++) {
			const prepared = prepareRouteSession(
				borderGraph,
				playableCountryPool,
				{ kind: 'practice', regions: [], difficulty: 'hard' },
				rng,
			)
			if (!prepared.ok) throw new Error('No hard world puzzle.')
			const { startId, targetId } = prepared.value
			if (
				[startId, targetId].some(
					id =>
						playableCountryPool.countriesById[id].continent === 'africa',
				)
			) {
				african++
			}
		}
		expect(african / 300).toBeLessThan(0.55)
	})

	it('connects two picked regions when the level allows it', () => {
		const prepared = prepareRouteSession(
			borderGraph,
			playableCountryPool,
			{ kind: 'practice', regions: ['europe', 'asia'], difficulty: 'hard' },
			seeded(3),
		)
		if (!prepared.ok) throw new Error('No Europe and Asia puzzle.')
		const { startId, targetId } = prepared.value
		expect(new Set([regionOfId(startId), regionOfId(targetId)])).toEqual(
			new Set(['europe', 'asia']),
		)
	})
})
