import type { CountryId } from '@georally/game-domain'
import { toCardId } from '../cardId'
import type { CardId, SkillId } from '../types'

export interface CasualOutcome {
	countryId: CountryId
	skillId: SkillId
	missed: boolean
}

export interface BridgeDecision {
	offer: CardId[]
	recheck: CardId[]
}

export function decideBridge(
	outcomes: readonly CasualOutcome[],
	introduced: ReadonlySet<CardId>,
	accepted: ReadonlySet<CardId>,
	activeSkills: readonly SkillId[],
): BridgeDecision {
	const offer = new Set<CardId>()
	const recheck = new Set<CardId>()
	for (const { countryId, skillId, missed } of outcomes) {
		if (!missed || !activeSkills.includes(skillId)) continue
		const cardId = toCardId(countryId, skillId)
		if (introduced.has(cardId)) recheck.add(cardId)
		else if (!accepted.has(cardId)) offer.add(cardId)
	}
	return { offer: [...offer], recheck: [...recheck] }
}
