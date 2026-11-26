import type { CountryId } from '@georally/game-domain'
import { splitCardId } from '../cardId'
import type { CardId, SkillId } from '../types'
import { MASTERY_LEVELS, type MasteryView } from './deriveMastery'

export type MasteryLayer = ReadonlyMap<CountryId, MasteryView>
export type LayerId = 'overall' | SkillId

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

export function overallLayer(
	views: ReadonlyMap<CardId, MasteryView>,
	skills: readonly SkillId[],
): MasteryLayer {
	const met = new Map<CountryId, MasteryView[]>()
	for (const skill of skills) {
		for (const [countryId, view] of skillLayer(views, skill)) {
			met.set(countryId, [...(met.get(countryId) ?? []), view])
		}
	}
	return new Map([...met].map(([countryId, all]) => [countryId, weakest(all)]))
}

function weakest(views: readonly MasteryView[]): MasteryView {
	const rank = (view: MasteryView) => MASTERY_LEVELS.indexOf(view.level)
	return {
		level: MASTERY_LEVELS[Math.min(...views.map(rank))]!,
		fading: views.some(view => view.fading),
		due: Math.min(...views.map(view => view.due)),
	}
}

export function masteryLayer(
	views: ReadonlyMap<CardId, MasteryView>,
	id: LayerId,
	activeSkills: readonly SkillId[],
): MasteryLayer {
	return id === 'overall'
		? overallLayer(views, activeSkills)
		: skillLayer(views, id)
}
