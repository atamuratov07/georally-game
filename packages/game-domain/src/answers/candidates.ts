import { INPUT_FOLDS } from './languages'
import { keyOf, toWords } from './normalize'

export interface Candidate {
	heard: string
	wordsBySpelling: string[][]
}

export interface WordRun {
	start: number
	end: number
	key: string
}

function spellingsOf(raw: string): string[] {
	const spellings = [raw]

	for (const fold of INPUT_FOLDS) {
		const folded = fold(raw)
		if (!spellings.includes(folded)) {
			spellings.push(folded)
		}
	}

	return spellings
}

export function prepareCandidate(raw: string): Candidate {
	const heard = raw.trim()
	return {
		heard,
		wordsBySpelling: spellingsOf(heard).map(spelling => toWords(spelling)),
	}
}

export function wordRuns(
	words: readonly string[],
	maxWords: number,
): WordRun[] {
	const runs: WordRun[] = []

	for (let length = Math.min(words.length, maxWords); length > 0; length--) {
		for (let start = 0; start + length <= words.length; start++) {
			const key = keyOf(words.slice(start, start + length))
			if (key) {
				runs.push({ start, end: start + length, key })
			}
		}
	}

	return runs
}
