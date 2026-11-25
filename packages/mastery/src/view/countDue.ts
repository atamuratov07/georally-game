import type { CardRecord } from '../types'

export function countDue(cards: readonly CardRecord[], before: number): number {
	return cards.filter(card => card.scheduling.due < before).length
}
