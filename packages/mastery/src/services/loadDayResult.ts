import type { CountryPool, LocalDay } from '@georally/game-domain'
import { unseenCards } from '../intro/unseen'
import type { MasteryDeps } from '../ports'
import type { CardId } from '../types'
import { summarizeDay, type DaySummary } from '../view/daySummary'
import { masteryViews, type MasteryView } from '../view/deriveMastery'
import { countDue } from '../view/countDue'

export interface DayResult extends DaySummary {
	dueTomorrow: number
	unseenCount: number
	views: ReadonlyMap<CardId, MasteryView>
}

export async function loadDayResult(
	{ repository, scheduler }: MasteryDeps,
	input: { pool: CountryPool; day: LocalDay; tomorrow: LocalDay; now: number },
): Promise<DayResult> {
	const [meta, cards, log] = await Promise.all([
		repository.loadMeta(),
		repository.loadCards(),
		repository.loadLog({ from: input.day.start, to: input.day.end }),
	])
	return {
		...summarizeDay(log),
		dueTomorrow: countDue(cards, input.tomorrow.end),
		unseenCount: unseenCards(meta, input.pool, cards).length,
		views: masteryViews(cards, scheduler, input.now),
	}
}
