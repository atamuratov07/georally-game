import { describe, expect, it } from 'vitest'

import { distance } from './distance'

describe('distance', () => {
	it.each([
		['kenya', 'keyna', 2, 1],
		['chile', 'chilee', 2, 1],
		['ab', '', 2, 2],
		['abc', 'cab', 2, 2],
		['slovakia', 'slovenia', 1, 2],
		['abcdef', 'ghijkl', 2, 3],
	])('%s → %s within %i steps is %i', (a, b, maxSteps, expected) => {
		expect(distance(a, b, maxSteps)).toBe(expected)
	})
})
