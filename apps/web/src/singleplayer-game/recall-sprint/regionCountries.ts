import { playableCountryPool } from '@georally/country-catalog'
import {
	selectEligibleCountryIds,
	type GameRegions,
} from '@georally/game-domain'

export function regionCountryIds(regions: GameRegions): string[] {
	return selectEligibleCountryIds(playableCountryPool, {
		regions,
		difficulty: 'hard',
	})
}
