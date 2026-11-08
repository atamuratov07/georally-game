import { DROP_LEADING_WORDS, REWRITE_WORDS } from './languages'

const COMBINING_MARKS = /\p{M}/gu
const DELETED_CHARACTERS = /['ʻʼ‘’`.]/g
const SEPARATORS = /[^\p{L}\p{N}]+/gu

export function toWords(raw: string): string[] {
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

export function applyWordRules(words: readonly string[]): string[] {
	const kept =
		words.length > 0 && DROP_LEADING_WORDS.has(words[0])
			? words.slice(1)
			: words

	return kept.map(word => REWRITE_WORDS.get(word) ?? word)
}

export function keyOf(words: readonly string[]): string {
	return applyWordRules(words).join(' ')
}
