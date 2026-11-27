import type { CardId, CardRecord } from '../types'

export function planCounts(
	cards: readonly CardRecord[],
	sessionPlan: readonly CardId[],
): { review: number; fresh: number } {
	const known = new Set(cards.map(card => card.id))
	const review = sessionPlan.filter(id => known.has(id)).length
	return { review, fresh: sessionPlan.length - review }
}
