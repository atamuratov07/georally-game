import type { LanguageRules } from './types'

export const englishRules: LanguageRules = {
	dropLeadingWords: ['the'],
	rewriteWords: {
		st: 'saint',
	},
	voiceFillers: [
		'i think',
		"it's",
		'it is',
		'is it',
		"that's",
		'that is',
		'this is',
		'the answer is',
		'my answer is',
		'maybe',
		'um',
		'uh',
		'er',
		'erm',
		'hmm',
	],
}
