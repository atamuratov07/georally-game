import { describe, expect, it } from 'vitest'

import { createAnswerMatcher } from './matcher'
import type { AliasEntry } from './types'

const names: Record<string, readonly string[]> = {
	'036': ['Australia'],
	'040': ['Austria'],
	'070': ['Bosnia and Herzegovina', 'Bosnia'],
	'152': ['Chile'],
	'178': ['Congo', 'Kongo', 'Конго-Браззавиль'],
	'180': ['Congo', 'Kongo'],
	'270': ['Gambia'],
	'368': ['Iraq'],
	'562': ['Niger'],
	'566': ['Nigeria'],
	'860': ["O'zbekiston"],
	'894': ['Zambia'],
}

const entries: AliasEntry[] = [
	...Object.entries(names).flatMap(([countryId, texts]) =>
		texts.map(text => ({ countryId, text, voiceOnly: false })),
	),
	{ countryId: '152', text: 'chilly', voiceOnly: true },
]

const matcher = createAnswerMatcher(entries)

describe('createAnswerMatcher, typing', () => {
	it('prefers an exact match over a typo of a longer name', () => {
		expect(matcher.match(['Niger'], 'typing')).toMatchObject({
			countryId: '562',
			via: 'exact',
		})
		expect(matcher.match(['Austrai'], 'typing')).toMatchObject({
			countryId: '040',
			via: 'fuzzy',
		})
	})

	it('refuses typos in short names and guesses between equally close countries', () => {
		expect(matcher.match(['Irak'], 'typing').kind).toBe('none')
		expect(matcher.match(['Sambia'], 'typing').kind).toBe('none')
		expect(matcher.match(['Nigera'], 'typing').kind).toBe('none')
	})

	it('returns ambiguous for a shared name, exact or with a typo', () => {
		for (const input of ['Congo', 'Congoo']) {
			expect(matcher.match([input], 'typing')).toMatchObject({
				kind: 'ambiguous',
				countryIds: ['178', '180'],
			})
		}
	})

	it('uses voice-only names for voice only', () => {
		expect(matcher.match(['chilly'], 'typing').kind).toBe('none')
		expect(matcher.match(['chilly'], 'voice')).toMatchObject({
			countryId: '152',
		})
	})

	it('tries Uzbek Cyrillic as Latin', () => {
		expect(matcher.match(['Ўзбекистон'], 'typing')).toMatchObject({
			countryId: '860',
		})
	})
})

describe('createAnswerMatcher, voice', () => {
	it('finds the longest name among other words', () => {
		expect(matcher.match(["I think it's Chile"], 'voice')).toMatchObject({
			countryId: '152',
		})
		expect(
			matcher.match(['Bosnia and Herzegovina please'], 'voice'),
		).toMatchObject({ countryId: '070' })
	})

	it('returns ambiguous when several countries are named at once', () => {
		expect(matcher.match(['Austria or Australia'], 'voice')).toMatchObject({
			kind: 'ambiguous',
			countryIds: ['036', '040'],
		})
	})

	it('tries alternatives in order, exact matches before typos', () => {
		expect(matcher.match(['Austria', 'Australia'], 'voice')).toMatchObject({
			countryId: '040',
		})
		expect(matcher.match(['Austrailia', 'Austria'], 'voice')).toMatchObject({
			countryId: '040',
			via: 'exact',
		})
	})

	it('allows one fewer typo than typing', () => {
		expect(matcher.match(['Austrai'], 'voice').kind).toBe('none')
	})

	it('keeps the spelling that matches more words', () => {
		expect(matcher.match(['Конго-Браззавиль'], 'voice')).toMatchObject({
			kind: 'match',
			countryId: '178',
		})
	})
})
