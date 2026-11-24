import { describe, expect, it } from 'vitest'
import { toCardId } from '../cardId'
import type { IntroPlan } from '../types'
import { isPlanned } from './isPlanned'

const plan: IntroPlan = {
	scopes: [{ regions: ['europe'], addedAt: 0 }],
	seed: 1,
	acceptedMisses: [toCardId('392', 'locate')],
}

describe('isPlanned', () => {
	it('covers the chosen continents and accepted misses, and nothing else', () => {
		expect(isPlanned(plan, toCardId('250', 'locate'), 'europe')).toBe(true)
		expect(isPlanned(plan, toCardId('392', 'locate'), 'asia')).toBe(true)
		expect(isPlanned(plan, toCardId('156', 'locate'), 'asia')).toBe(false)
		expect(isPlanned(null, toCardId('250', 'locate'), 'europe')).toBe(false)
	})
})
