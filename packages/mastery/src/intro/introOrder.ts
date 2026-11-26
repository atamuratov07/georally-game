import {
	GAME_DIFFICULTIES,
	pickRandomIds,
	regionsInclude,
	seededRandom,
	type CountryId,
	type CountryPool,
} from '@georally/game-domain'
import { parseCardId, toCardId } from '../cardId'
import type { CardId, IntroPlan, SkillId } from '../types'

function countryOrder(plan: IntroPlan, pool: CountryPool): CountryId[] {
	const random = seededRandom(plan.seed)
	const ids = Object.keys(pool.countriesById).sort()
	const placed = new Set<CountryId>()
	const order: CountryId[] = []

	for (const { regions } of plan.scopes) {
		for (const tier of GAME_DIFFICULTIES) {
			const tierIds = ids.filter(id => {
				const country = pool.countriesById[id]
				return (
					!placed.has(id) &&
					country.difficulty === tier &&
					regionsInclude(regions, country.continent)
				)
			})
			for (const id of pickRandomIds(tierIds, tierIds.length, random)) {
				placed.add(id)
				order.push(id)
			}
		}
	}

	return order
}

export function introOrder(
	plan: IntroPlan,
	pool: CountryPool,
	skills: readonly SkillId[],
	introduced: ReadonlySet<CardId>,
): CardId[] {
	const countries = countryOrder(plan, pool)
	const candidates = [
		...plan.acceptedMisses,
		...skills.flatMap(skill => countries.map(id => toCardId(id, skill))),
	]
	const taken = new Set(introduced)

	return candidates.filter(cardId => {
		const card = parseCardId(cardId)
		if (
			!card ||
			taken.has(cardId) ||
			!skills.includes(card.skillId) ||
			!(card.countryId in pool.countriesById)
		) {
			return false
		}
		taken.add(cardId)
		return true
	})
}
