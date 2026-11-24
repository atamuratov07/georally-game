import { regionsInclude, type GameContinent } from '@georally/game-domain'
import type { CardId, IntroPlan } from '../types'

export function isPlanned(
	plan: IntroPlan | null,
	cardId: CardId,
	continent: GameContinent,
): boolean {
	if (!plan) return false
	return (
		plan.acceptedMisses.includes(cardId) ||
		plan.scopes.some(({ regions }) => regionsInclude(regions, continent))
	)
}
