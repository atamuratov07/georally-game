import type { MasteryDeps } from '../ports'
import { activeSkills } from '../settings'
import type { CardId, IntroPlan, SkillId } from '../types'
import { masteryViews, type MasteryView } from '../view/deriveMastery'

export interface MasteryState {
	views: ReadonlyMap<CardId, MasteryView>
	plan: IntroPlan | null
	activeSkills: SkillId[]
}

export async function loadMastery(
	{ repository, scheduler }: MasteryDeps,
	now: number,
): Promise<MasteryState> {
	const [cards, meta] = await Promise.all([
		repository.loadCards(),
		repository.loadMeta(),
	])
	return {
		views: masteryViews(cards, scheduler, now),
		plan: meta.plan,
		activeSkills: activeSkills(meta.settings),
	}
}
