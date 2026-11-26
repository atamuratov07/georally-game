import type { CountryPool, LocalDay } from '@georally/game-domain'
import { unseenCards } from '../intro/unseen'
import type { MasteryDeps } from '../ports'
import { activeSkills } from '../settings'
import { summarizeDay, type DaySummary } from '../view/daySummary'
import { masteryViews } from '../view/deriveMastery'
import { overallLayer, type MasteryLayer } from '../view/layers'
import { countDue } from '../view/countDue'

export interface DayResult extends DaySummary {
	dueTomorrow: number
	unseenCount: number
	layer: MasteryLayer // Overall
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
		layer: overallLayer(
			masteryViews(cards, scheduler, input.now),
			activeSkills(meta.settings),
		),
	}
}
