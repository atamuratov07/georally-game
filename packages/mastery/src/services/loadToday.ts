import type { CountryPool, LocalDay } from '@georally/game-domain'
import { unseenCards } from '../intro/unseen'
import type { MasteryDeps, MasteryMeta } from '../ports'
import { rebuildCards } from '../rebuildCards'
import { SCHEDULER_VERSION } from '../schedulerVersion'
import { buildSessionPlan } from '../session/plan'
import type { CardId, CardRecord } from '../types'

export interface Today {
	meta: MasteryMeta
	cards: CardRecord[]
	sessionPlan: CardId[]
	unseenCount: number // cards in the plan's scopes not yet introduced
}

export async function loadToday(
	{ repository, scheduler }: MasteryDeps,
	input: { pool: CountryPool; day: LocalDay },
): Promise<Today> {
	if ((await repository.loadMeta()).schedulerVersion !== SCHEDULER_VERSION) {
		await repository.replaceCards(
			log => rebuildCards(log, scheduler),
			SCHEDULER_VERSION,
		)
	}

	const [meta, cards, todaysLog] = await Promise.all([
		repository.loadMeta(),
		repository.loadCards(),
		repository.loadLog({ from: input.day.start, to: input.day.end }),
	])
	const order = unseenCards(meta, input.pool, cards)

	return {
		meta,
		cards,
		sessionPlan: buildSessionPlan({
			cards,
			rechecks: meta.rechecks,
			introOrder: order,
			todaysLog,
			settings: meta.settings,
			extraNew:
				meta.extraNew?.day === input.day.key ? meta.extraNew.count : 0,
			playableIds: new Set(Object.keys(input.pool.countriesById)),
			dayEnd: input.day.end,
		}),
		unseenCount: order.length,
	}
}
