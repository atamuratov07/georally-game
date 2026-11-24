import type { CountryPool } from '@georally/game-domain'
import { introOrder } from '../intro/introOrder'
import type { MasteryDeps, MasteryMeta } from '../ports'
import { rebuildCards } from '../rebuildCards'
import { SCHEDULER_VERSION } from '../schedulerVersion'
import { buildSessionPlan } from '../session/plan'
import { activeSkills } from '../settings'
import type { CardId, CardRecord } from '../types'

export interface Day {
	key: string // 'YYYY-MM-DD' in the player's time zone
	start: number
	end: number
}

export interface Today {
	meta: MasteryMeta
	cards: CardRecord[]
	sessionPlan: CardId[]
}

export async function loadToday(
	{ repository, scheduler }: MasteryDeps,
	input: { pool: CountryPool; day: Day },
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
	const order = meta.plan
		? introOrder(
				meta.plan,
				input.pool,
				activeSkills(meta.settings),
				new Set(cards.map(card => card.id)),
			)
		: []

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
	}
}
