import type { CountryPool } from '@georally/game-domain'
import type { MasteryMeta } from '../ports'
import { activeSkills } from '../settings'
import type { CardId, CardRecord } from '../types'
import { introOrder } from './introOrder'

export function unseenCards(
	meta: MasteryMeta,
	pool: CountryPool,
	cards: readonly CardRecord[],
): CardId[] {
	return meta.plan
		? introOrder(
				meta.plan,
				pool,
				activeSkills(meta.settings),
				new Set(cards.map(card => card.id)),
			)
		: []
}
