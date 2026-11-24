import type { Scheduler } from '../ports'
import type { CardId, CardRecord } from '../types'

export const MASTERY_LEVELS = ['learning', 'familiar', 'mastered'] as const
export type MasteryLevel = (typeof MASTERY_LEVELS)[number]

export interface MasteryView {
	level: MasteryLevel
	fading: boolean
	due: number
}

export const MASTERED_STABILITY_DAYS = 21
export const FADING_RETRIEVABILITY = 0.85

export function deriveMastery(
	card: CardRecord,
	retrievability: number,
): MasteryView {
	const { phase, stability, due } = card.scheduling
	if (phase !== 'review') return { level: 'learning', fading: false, due }
	return {
		level: stability >= MASTERED_STABILITY_DAYS ? 'mastered' : 'familiar',
		fading: retrievability < FADING_RETRIEVABILITY,
		due,
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
