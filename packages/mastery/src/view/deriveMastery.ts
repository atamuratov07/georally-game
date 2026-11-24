import type { Scheduler } from '../ports'
import type { CardId, CardRecord } from '../types'

export type MasteryLevel = 'learning' | 'familiar' | 'mastered'

export interface MasteryView {
	level: MasteryLevel
	fading: boolean
}

export const MASTERED_STABILITY_DAYS = 21
export const FADING_RETRIEVABILITY = 0.85

export function deriveMastery(
	card: CardRecord,
	retrievability: number,
): MasteryView {
	const { phase, stability } = card.scheduling
	if (phase !== 'review') return { level: 'learning', fading: false }
	return {
		level: stability >= MASTERED_STABILITY_DAYS ? 'mastered' : 'familiar',
		fading: retrievability < FADING_RETRIEVABILITY,
	}
}

export function masteryViews(
	cards: readonly CardRecord[],
	scheduler: Scheduler,
	now: number,
): ReadonlyMap<CardId, MasteryView> {
	return new Map(
		cards.map(card => [
			card.id,
			deriveMastery(card, scheduler.retrievability(card.scheduling, now)),
		]),
	)
}
