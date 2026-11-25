import { playableCountryPool as pool } from '@georally/country-catalog'
import {
	GAME_DIFFICULTIES,
	regionsInclude,
	type GameRegions,
} from '@georally/game-domain'
import { describe, expect, it } from 'vitest'
import { parseCardId } from '../cardId'
import type { CardId, IntroPlan } from '../types'
import { introOrder } from './introOrder'

const ALL_IDS = Object.keys(pool.countriesById)
const MISS = ALL_IDS.find(id => pool.countriesById[id].continent === 'oceania')!

function plan(...scopes: GameRegions[]): IntroPlan {
	return {
		scopes: scopes.map((regions, index) => ({ regions, addedAt: index })),
		seed: 42,
		acceptedMisses: [`${MISS}:locate`],
	}
}

function tierRanks(cardIds: readonly CardId[]) {
	return cardIds.map(cardId =>
		GAME_DIFFICULTIES.indexOf(
			pool.countriesById[parseCardId(cardId)!.countryId].difficulty,
		),
	)
}

function isAscending(values: readonly number[]) {
	return values.every(
		(value, index) => index === 0 || values[index - 1] <= value,
	)
}

describe('introOrder', () => {
	it('puts accepted misses first, then each scope tier by tier', () => {
		const order = introOrder(
			plan(['europe', 'asia'], []),
			pool,
			['locate'],
			new Set(),
		)
		const firstScope = ALL_IDS.filter(
			id =>
				id !== MISS &&
				regionsInclude(
					['europe', 'asia'],
					pool.countriesById[id].continent,
				),
		)
		const scoped = order.slice(1, 1 + firstScope.length)
		const world = order.slice(1 + firstScope.length)

		expect(order[0]).toBe(`${MISS}:locate`)
		expect(new Set(order).size).toBe(ALL_IDS.length)
		expect(
			scoped.map(cardId => parseCardId(cardId)!.countryId).sort(),
		).toEqual(firstScope.sort())
		expect(isAscending(tierRanks(scoped))).toBe(true)
		expect(isAscending(tierRanks(world))).toBe(true)
	})

	it('skips introduced cards without reshuffling the rest', () => {
		const seeded = plan(['africa'])
		const order = introOrder(seeded, pool, ['locate'], new Set())
		const introduced = new Set([order[0], order[3], order[4]])

		expect(introOrder(seeded, pool, ['locate'], introduced)).toEqual(
			order.filter(cardId => !introduced.has(cardId)),
		)
	})
})
