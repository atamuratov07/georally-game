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
		texts.map(text => ({ countryId, text })),
	),
	{ countryId: '152', text: 'chilly', only: 'voice' },
	{ countryId: '840', text: 'US', only: 'typing' },
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

	it('keeps names limited to one input method to that method', () => {
		expect(matcher.match(['chilly'], 'typing').kind).toBe('none')
		expect(matcher.match(['chilly'], 'voice')).toMatchObject({
			countryId: '152',
		})
		expect(matcher.match(['US'], 'typing')).toMatchObject({
			countryId: '840',
		})
		expect(matcher.match(['tell us'], 'voice').kind).toBe('none')
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

	it('allows one fewer typo than typing, in any run of words', () => {
		expect(matcher.match(['Austrai'], 'voice').kind).toBe('none')
		expect(matcher.match(['umm Austrailia maybe'], 'voice')).toMatchObject({
			countryId: '036',
			via: 'fuzzy',
		})
	})

	it('keeps the spelling that matches more words', () => {
		expect(matcher.match(['Конго-Браззавиль'], 'voice')).toMatchObject({
			kind: 'match',
			countryId: '178',
		})
	})
})

describe('createAnswerMatcher, while typing', () => {
	it('matches one country exactly and flags the start of another name', () => {
		expect(matcher.matchAsTyped('Niger')).toEqual({
			countryId: '562',
			isPrefix: true,
		})
		expect(matcher.matchAsTyped('Bosnia')).toEqual({
			countryId: '070',
			isPrefix: false,
		})
		expect(matcher.matchAsTyped('Congo')).toBeNull()
		expect(matcher.matchAsTyped('Austrai')).toBeNull()
	})
})

describe('createAnswerMatcher, phrases', () => {
	it('splits a phrase into countries in spoken order, longest name first', () => {
		expect(
			matcher.matchAll(['niger nigeria bosnia and herzegovina'], 'voice'),
		).toMatchObject([
			{ kind: 'match', countryId: '562' },
			{ kind: 'match', countryId: '566' },
			{ kind: 'match', countryId: '070', heard: 'bosnia and herzegovina' },
		])
	})

	it('keeps a shared name as its own ambiguous segment', () => {
		expect(matcher.matchAll(['congo and chile'], 'voice')).toMatchObject([
			{ kind: 'ambiguous', countryIds: ['178', '180'] },
			{ kind: 'match', countryId: '152' },
		])
	})

	it('ignores filler and never accepts typos', () => {
		expect(matcher.matchAll(['umm let me think'], 'voice')).toEqual([])
		expect(matcher.matchAll(['umm Austrailia maybe'], 'voice')).toEqual([])
	})

	it('takes the alternative that names the most', () => {
		expect(
			matcher.matchAll(
				['austria and so on', 'austria and australia'],
				'voice',
			),
		).toMatchObject([{ countryId: '040' }, { countryId: '036' }])
	})
})
