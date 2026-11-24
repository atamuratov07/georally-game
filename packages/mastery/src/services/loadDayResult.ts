import type { LocalDay } from '@georally/game-domain'
import type { MasteryDeps } from '../ports'
import type { CardId } from '../types'
import { summarizeDay, type DaySummary } from '../view/daySummary'
import { deriveMastery, type MasteryView } from '../view/deriveMastery'
import { countDue } from '../view/countDue'

export interface DayResult extends DaySummary {
	dueTomorrow: number
	views: ReadonlyMap<CardId, MasteryView>
}

export async function loadDayResult(
	{ repository, scheduler }: MasteryDeps,
	input: { day: LocalDay; tomorrow: LocalDay; now: number },
): Promise<DayResult> {
	const [cards, log] = await Promise.all([
		repository.loadCards(),
		repository.loadLog({ from: input.day.start, to: input.day.end }),
	])
	return {
		...summarizeDay(log),
		dueTomorrow: countDue(cards, input.tomorrow.end),
		views: new Map(
			cards.map(card => [
				card.id,
				deriveMastery(
					card,
					scheduler.retrievability(card.scheduling, input.now),
				),
			]),
		),
	}
}
