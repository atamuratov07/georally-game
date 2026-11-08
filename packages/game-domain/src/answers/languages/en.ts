import type { LanguageRules } from './types'

export const englishRules: LanguageRules = {
	dropLeadingWords: ['the'],
	rewriteWords: {
		st: 'saint',
	},
}
