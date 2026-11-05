import {
	DROP_LEADING_WORDS as DROP_LEADING_WORDS,
	REWRITE_WORDS,
} from './languages'

const COMBINING_MARKS = /\p{M}/gu
const DELETED_CHARACTERS = /['ʻʼ‘’`.]/g
const SEPARATORS = /[^\p{L}\p{N}]+/gu

export function tokenize(raw: string): string[] {
	const cleaned = raw
		.normalize('NFKC')
		.toLowerCase()
		.normalize('NFD')
		.replace(COMBINING_MARKS, '')
		.replace(DELETED_CHARACTERS, '')
		.replaceAll('&', ' and ')
		.replace(SEPARATORS, ' ')
		.trim()
	return cleaned === '' ? [] : cleaned.split(' ')
}

export function applyLangRules(tokens: readonly string[]): string[] {
	const kept =
		tokens.length > 0 && DROP_LEADING_WORDS.has(tokens[0])
			? tokens.slice(1)
			: tokens

	return kept.map(word => REWRITE_WORDS.get(word) ?? word)
}

export function normalize(raw: string): string {
	return applyLangRules(tokenize(raw)).join(' ')
}
