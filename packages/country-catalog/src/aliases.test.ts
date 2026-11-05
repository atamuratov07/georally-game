import { describe, expect, it } from 'vitest'
import {
	createAnswerMatcher,
	type InputMethod,
	type MatchResult,
} from '@georally/game-domain/answers'

import { aliasEntries } from './aliases'

const matcher = createAnswerMatcher(aliasEntries)

const SHARED_NAMES: Readonly<Record<string, readonly string[]>> = {
	Congo: ['178', '180'],
	Конго: ['178', '180'],
	Kongo: ['178', '180'],
	Korea: ['408', '410'],
	Корея: ['408', '410'],
	Koreya: ['408', '410'],
}

function outcome(result: MatchResult): string | readonly string[] {
	switch (result.kind) {
		case 'match':
			return result.countryId
		case 'ambiguous':
			return result.countryIds
		case 'none':
			return 'none'
	}
}

describe('aliasEntries', () => {
	// Also catches names that clean up to nothing, filler words inside names,
	// and Uzbek folding that lands a Russian name on another country.
	it('resolves every name to its own country, typed and spoken', () => {
		const mismatches: string[] = []

		for (const entry of aliasEntries) {
			const expected = SHARED_NAMES[entry.text] ?? entry.countryId
			const methods: InputMethod[] = entry.voiceOnly
				? ['voice']
				: ['typing', 'voice']

			for (const method of methods) {
				const actual = outcome(matcher.match([entry.text], method))
				if (JSON.stringify(actual) !== JSON.stringify(expected)) {
					mismatches.push(
						`${method} "${entry.text}" (${entry.countryId}): ${JSON.stringify(actual)}`,
					)
				}
			}
		}

		expect(mismatches).toEqual([])
	})

	// Typos whose outcome depends on which other names exist.
	it.each([
		['Austrai', 'typing', '040'],
		['Austrailia', 'typing', '036'],
		['Nigera', 'typing', 'none'],
		['Sambia', 'typing', 'none'],
		['Slovenija', 'typing', '705'],
		['Dominicana', 'typing', '214'],
		['Guinea Bisau', 'typing', '624'],
		['Конго-Браззавиль', 'voice', '178'],
	] as const)('%s (%s) → %s', (input, method, expected) => {
		expect(outcome(matcher.match([input], method))).toBe(expected)
	})
})
