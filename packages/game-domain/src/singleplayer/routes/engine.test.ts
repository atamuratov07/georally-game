import { describe, expect, it } from 'vitest'

import type { MatchResult } from '../../answers'
import { fromEdges } from '../../borders'
import { createRouteBoard } from './board'
import { routeLevels } from './difficulty'
import { createIdleState, reduceRouteState } from './engine'
import { getKnownIds, getScore, getTimeline, isPerfect } from './selectors'
import { dailyRouteSession } from './session'
import type { RouteAction, RouteConfig, RouteEnds, RouteState } from './types'

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

const T0 = 1_000_000
const CONFIG: RouteConfig = {
	kind: 'practice',
	scope: 'all',
	difficulty: 'easy',
}

const boardFor = (ends: RouteEnds) => createRouteBoard(graph, ends)!

function reduce(state: RouteState, action: RouteAction): RouteState {
	const ends = action.type === 'START' ? action.session : state
	return reduceRouteState(boardFor(ends as RouteEnds), state, action)
}

const match = (countryId: string): MatchResult => ({
	kind: 'match',
	countryId,
	via: 'exact',
	heard: countryId,
})

function started(startId = 'ESP', targetId = 'AUT'): RouteState {
	return reduce(createIdleState(CONFIG), {
		type: 'START',
		session: { config: CONFIG, startId, targetId },
		now: T0,
	})
}

function say(state: RouteState, ids: string[], now = T0 + 1_000): RouteState {
	const action: RouteAction = {
		type: 'ATTEMPT',
		method: 'voice',
		heard: ids.join(', '),
		results: ids.map(match),
		now,
	}
	return reduce(state, action)
}

describe('route board', () => {
	it('colours countries by their detour', () => {
		const board = createRouteBoard(graph, {
			startId: 'PRT',
			targetId: 'DEU',
		})!
		expect(board.par).toBe(2)
		expect(['ESP', 'FRA', 'BEL', 'MAR', 'ISL'].map(board.verdict)).toEqual([
			'route',
			'route',
			'near',
			'off',
			'off',
		])
	})

	it('has no board for neighbours or unconnected countries', () => {
		expect(
			createRouteBoard(graph, { startId: 'ESP', targetId: 'FRA' }),
		).toBeNull()
		expect(
			createRouteBoard(graph, { startId: 'ESP', targetId: 'ESP' }),
		).toBeNull()
		expect(
			createRouteBoard(graph, { startId: 'ESP', targetId: 'ISL' }),
		).toBeNull()
	})
})

describe('route levels', () => {
	it.each([
		[1, 2, []],
		[2, 0, ['easy', 'medium']],
		[3, 1, ['easy', 'medium']],
		[2, 2, ['medium']],
		[5, 0, ['medium']],
		[4, 2, ['hard']],
		[6, 0, ['hard']],
	] as const)('par %i at rank %i is %j', (par, rank, levels) => {
		expect(routeLevels(par, rank)).toEqual(levels)
	})
})

describe('route engine', () => {
	it('refuses a board that belongs to another route', () => {
		const board = boardFor({ startId: 'PRT', targetId: 'DEU' })
		expect(() =>
			reduceRouteState(board, createIdleState(CONFIG), {
				type: 'START',
				session: { config: CONFIG, startId: 'ESP', targetId: 'AUT' },
				now: T0,
			}),
		).toThrow()
		expect(() =>
			reduceRouteState(board, started(), { type: 'HINT', now: T0 + 1_000 }),
		).toThrow()
	})

	it('sorts a sentence into new, repeated, endpoint and unknown names', () => {
		let state = say(started(), ['BEL'])
		state = reduce(state, {
			type: 'ATTEMPT',
			method: 'typing',
			heard: 'x',
			results: [
				match('BEL'),
				match('ESP'),
				{ kind: 'ambiguous', countryIds: ['CHE', 'ITA'], heard: 'x' },
				{ kind: 'none', heard: 'x' },
				match('MAR'),
			],
			now: T0 + 2_000,
		})

		expect(state).toMatchObject({
			phase: 'playing',
			guesses: [
				{ countryId: 'BEL' },
				{ countryId: 'MAR', method: 'typing' },
			],
			lastAttempt: {
				addedIds: ['MAR'],
				repeatedIds: ['BEL'],
				endpointIds: ['ESP'],
				unresolved: [{ kind: 'ambiguous' }, { kind: 'none' }],
			},
		})
	})

	it('solves through any chain and ignores names after the solving one', () => {
		const longer = say(say(started(), ['BEL', 'FRA']), ['DEU'])
		expect(longer).toMatchObject({ phase: 'finished', outcome: 'solved' })
		expect(getScore(longer)).toBe(3)

		const sentence = say(started(), ['FRA', 'DEU', 'ITA'])
		expect(sentence).toMatchObject({ phase: 'finished', outcome: 'solved' })
		expect(getScore(sentence)).toBe(2)
		expect(isPerfect(boardFor(sentence as RouteEnds), sentence)).toBe(true)
		expect(getKnownIds(sentence).has('ITA')).toBe(false)
	})

	it('hints the country of the best completion next to the latest one, at a cost of one', () => {
		const named = say(started(), ['ITA'])
		const hinted = reduce(named, { type: 'HINT', now: T0 + 2_000 })
		expect(hinted).toMatchObject({
			phase: 'finished',
			outcome: 'solved',
			hints: [{ countryId: 'FRA', at: T0 + 2_000 }],
		})
		expect(getScore(hinted)).toBe(2)
		expect(isPerfect(boardFor(hinted as RouteEnds), hinted)).toBe(false)

		const fresh = reduce(started(), { type: 'HINT', now: T0 + 1_000 })
		expect(fresh).toMatchObject({
			phase: 'playing',
			hints: [{ countryId: 'FRA' }],
		})
		expect(say(fresh, ['FRA'])).toMatchObject({
			lastAttempt: { repeatedIds: ['FRA'] },
		})

		const fromTarget = say(started('PRT', 'AUT'), ['DEU'])
		expect(
			reduce(fromTarget, { type: 'HINT', now: T0 + 2_000 }),
		).toMatchObject({ hints: [{ countryId: 'FRA' }] })
	})

	it('gives up and then ignores everything but a new start', () => {
		const state = reduce(say(started(), ['ITA']), {
			type: 'GIVE_UP',
			now: T0 + 3_000,
		})
		if (state.phase !== 'finished')
			throw new Error('Expected a finished route.')
		expect(state.outcome).toBe('gaveUp')
		expect(boardFor(state).completion(getKnownIds(state))).toEqual([
			'ESP',
			'FRA',
			'ITA',
			'AUT',
		])

		expect(say(state, ['FRA'])).toBe(state)
		expect(reduce(state, { type: 'HINT', now: T0 + 4_000 })).toBe(state)
		expect(reduce(state, { type: 'GIVE_UP', now: T0 + 4_000 })).toBe(state)
		expect(
			reduce(state, {
				type: 'START',
				session: { config: CONFIG, startId: 'PRT', targetId: 'DEU' },
				now: T0 + 5_000,
			}),
		).toMatchObject({ phase: 'playing', startId: 'PRT', guesses: [] })
	})

	it('orders guesses and hints by time, guesses first on a tie', () => {
		let state = reduce(started('PRT', 'AUT'), { type: 'HINT', now: T0 + 500 })
		state = say(state, ['MAR', 'BEL'], T0 + 1_000)
		state = reduce(state, { type: 'HINT', now: T0 + 1_000 })
		expect(
			getTimeline(state).map(event => `${event.kind}:${event.countryId}`),
		).toEqual(['hint:ESP', 'guess:MAR', 'guess:BEL', 'hint:FRA'])
	})

	it('reads a daily session by its puzzle number', () => {
		const list = [
			{ startId: 'PRT', targetId: 'DEU', par: 2, level: 'easy' } as const,
		]
		expect(dailyRouteSession(list, 1)).toEqual({
			config: { kind: 'daily', number: 1 },
			startId: 'PRT',
			targetId: 'DEU',
		})
		expect(dailyRouteSession(list, 0)).toBeNull()
		expect(dailyRouteSession(list, 2)).toBeNull()
	})
})
