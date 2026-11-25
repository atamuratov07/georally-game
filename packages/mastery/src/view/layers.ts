import type { CountryId } from '@georally/game-domain'
import { splitCardId } from '../cardId'
import type { CardId, SkillId } from '../types'
import type { MasteryView } from './deriveMastery'

export type MasteryLayer = ReadonlyMap<CountryId, MasteryView>

export function skillLayer(
	views: ReadonlyMap<CardId, MasteryView>,
	skill: SkillId,
): MasteryLayer {
	const layer = new Map<CountryId, MasteryView>()
	for (const [cardId, view] of views) {
		const { countryId, skillId } = splitCardId(cardId)
		if (skillId === skill) layer.set(countryId, view)
	}
	return layer
}
