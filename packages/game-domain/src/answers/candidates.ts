import { INPUT_FOLDS, VOICE_FILLERS } from './languages'
import { applyLangRules, tokenize } from './normalize'
import type { InputMethod } from './types'

const FILLER_PHRASES: readonly string[][] = VOICE_FILLERS.map(filler =>
	tokenize(filler),
)
	.filter(words => words.length > 0)
	.sort((a, b) => b.length - a.length)

export interface PreparedInput {
	heard: string
	spellings: string[][]
}

export interface TokenRun {
	start: number
	end: number
	key: string
}

export function spellingsOf(raw: string): string[] {
	const spellings = [raw]

	for (const fold of INPUT_FOLDS) {
		const folded = fold(raw)
		if (!spellings.includes(folded)) {
			spellings.push(folded)
		}
	}

	return spellings
}

function removeFillers(tokens: readonly string[]): string[] {
	const kept: string[] = []

	for (let i = 0; i < tokens.length;) {
		let isFiller = false
		for (const phrase of FILLER_PHRASES) {
			if (phrase.every((word, offset) => tokens[i + offset] === word)) {
				i += phrase.length
				isFiller = true
				break
			}
		}

		if (!isFiller) {
			kept.push(tokens[i])
			i += 1
		}
	}

	return kept
}

export function tokensOf(spelling: string, method: InputMethod): string[] {
	const tokens = tokenize(spelling)
	return method === 'voice' ? removeFillers(tokens) : tokens
}

export function prepare(raw: string, method: InputMethod): PreparedInput {
	const heard = raw.trim()
	return {
		heard,
		spellings: spellingsOf(heard).map(spelling => tokensOf(spelling, method)),
	}
}

export function keyOf(tokens: readonly string[]): string {
	return applyLangRules(tokens).join(' ')
}

export function tokenRuns(
	tokens: readonly string[],
	maxTokens: number,
): TokenRun[] {
	const runs: TokenRun[] = []

	for (let length = Math.min(tokens.length, maxTokens); length > 0; length--) {
		for (let start = 0; start + length <= tokens.length; start++) {
			const key = keyOf(tokens.slice(start, start + length))
			if (key) {
				runs.push({ start, end: start + length, key })
			}
		}
	}

	return runs
}
