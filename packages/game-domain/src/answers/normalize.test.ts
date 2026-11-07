import { describe, expect, it } from 'vitest'

import { keyOf, toWords } from './normalize'

describe('keyOf(toWords(…))', () => {
	it.each([
		['  South   KOREA ', 'south korea'],
		['Oʻzbekiston', 'ozbekiston'],
		['O’zbekiston', 'ozbekiston'],
		['U.S.A.', 'usa'],
		["Côte d'Ivoire", 'cote divoire'],
		['Соединённые Штаты', 'соединенные штаты'],
		['Папуа — Новая Гвинея', 'папуа новая гвинея'],
		['Trinidad & Tobago', 'trinidad and tobago'],
		['The Gambia', 'gambia'],
		['St. Lucia', 'saint lucia'],
	])('%s → %s', (raw, expected) => {
		expect(keyOf(toWords(raw))).toBe(expected)
	})
})
