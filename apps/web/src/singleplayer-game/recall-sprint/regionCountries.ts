import { playableCountryPool } from '@georally/country-catalog'
import { selectEligibleCountryIds, type GameScope } from '@georally/game-domain'

export function regionCountryIds(scope: GameScope): string[] {
	return selectEligibleCountryIds(playableCountryPool, {
		scope,
		difficulty: 'hard',
	})
}
