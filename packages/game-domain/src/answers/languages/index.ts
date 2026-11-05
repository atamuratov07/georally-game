import type { AnswerLanguage } from '../types'
import { englishRules } from './en'
import { russianRules } from './ru'
import type { LanguageRules } from './types'
import { uzbekRules } from './uz'

export const LANGUAGE_RULES: Record<AnswerLanguage, LanguageRules> = {
	en: englishRules,
	ru: russianRules,
	uz: uzbekRules,
}

const ALL_RULES = Object.values(LANGUAGE_RULES)

export const DROP_LEADING_WORDS: ReadonlySet<string> = new Set(
	ALL_RULES.flatMap(rules => rules.dropLeadingWords),
)

export const REWRITE_WORDS: ReadonlyMap<string, string> = new Map(
	ALL_RULES.flatMap(rules => Object.entries(rules.rewriteWords)),
)

export const VOICE_FILLERS: readonly string[] = ALL_RULES.flatMap(
	rules => rules.voiceFillers,
)

export const INPUT_FOLDS: readonly ((raw: string) => string)[] =
	ALL_RULES.flatMap(rules => (rules.foldInput ? [rules.foldInput] : []))

export type { LanguageRules } from './types'
