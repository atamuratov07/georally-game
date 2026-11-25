import type { CardId, ReviewLogEntry } from '../types'

export interface DaySummary {
	newIds: CardId[]
	reviewedIds: CardId[]
	flawless: boolean
}

export function summarizeDay(log: readonly ReviewLogEntry[]): DaySummary {
	const introduced = new Set(
		log.filter(entry => entry.kind === 'new').map(entry => entry.cardId),
	)
	const answered = new Set(log.map(entry => entry.cardId))
	return {
		newIds: [...introduced],
		reviewedIds: [...answered].filter(id => !introduced.has(id)),
		flawless: log.every(entry => entry.rating !== 'again'),
	}
}
