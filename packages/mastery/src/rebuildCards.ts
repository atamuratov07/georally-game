import { answerCard } from './answerCard'
import { parseCardId } from './cardId'
import type { Scheduler } from './ports'
import type { CardId, CardRecord, ReviewLogEntry } from './types'

function byReviewTime(a: ReviewLogEntry, b: ReviewLogEntry) {
	return (
		a.reviewedAt - b.reviewedAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
	)
}

export function rebuildCards(
	log: readonly ReviewLogEntry[],
	scheduler: Scheduler,
): CardRecord[] {
	const cards = new Map<CardId, CardRecord>()

	for (const entry of [...log].sort(byReviewTime)) {
		if (!parseCardId(entry.cardId)) {
			continue
		}

		const { card } = answerCard(
			cards.get(entry.cardId),
			entry.kind === 'recheck',
			{
				cardId: entry.cardId,
				outcome: entry.outcome,
				entryId: entry.id,
				now: entry.reviewedAt,
			},
			scheduler,
		)
		cards.set(entry.cardId, card)
	}

	return [...cards.values()]
}
