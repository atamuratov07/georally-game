import {
	getRevealedId,
	type GameState,
} from '@georally/game-domain/singleplayer/locate'
import type { CasualOutcome } from '@/mastery/bridge/reportCasualOutcomes'

export function locateOutcome(state: GameState): CasualOutcome | null {
	const countryId = getRevealedId(state)
	if (state.phase !== 'revealed' || !countryId) return null
	return {
		countryId,
		skillId: 'locate',
		missed: state.outcome !== 'correct' || state.wrongPicks.length > 0,
	}
}
