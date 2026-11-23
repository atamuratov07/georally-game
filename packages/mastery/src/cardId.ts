import type { CountryId } from '@georally/game-domain'
import { SKILL_IDS, type CardId, type SkillId } from './types'

export function toCardId(countryId: CountryId, skillId: SkillId): CardId {
	return `${countryId}:${skillId}`
}

export function parseCardId(
	cardId: string,
): { countryId: CountryId; skillId: SkillId } | null {
	const [countryId, skillId, ...rest] = cardId.split(':')
	if (!countryId || rest.length > 0 || !isSkillId(skillId)) {
		return null
	}
	return { countryId, skillId }
}

function isSkillId(value: string | undefined): value is SkillId {
	return SKILL_IDS.some(id => id === value)
}
