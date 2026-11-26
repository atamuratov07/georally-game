import {
	getTargetId,
	getWrongNames,
	type GameState,
} from '@georally/game-domain/singleplayer/name-it'
import type { CasualOutcome } from '@/mastery/bridge/reportCasualOutcomes'

export function nameItOutcome(state: GameState): CasualOutcome | null {
	const countryId = getTargetId(state)
	if (state.phase !== 'revealed' || !countryId) return null
	return {
		countryId,
		skillId: 'name',
		missed: state.outcome !== 'correct' || getWrongNames(state).length > 0,
	}
}
