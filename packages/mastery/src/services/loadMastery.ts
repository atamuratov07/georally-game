import type { MasteryDeps } from '../ports'
import type { CardId, IntroPlan } from '../types'
import { masteryViews, type MasteryView } from '../view/deriveMastery'

export interface MasteryState {
	views: ReadonlyMap<CardId, MasteryView>
	plan: IntroPlan | null
}

export async function loadMastery(
	{ repository, scheduler }: MasteryDeps,
	now: number,
): Promise<MasteryState> {
	const [cards, meta] = await Promise.all([
		repository.loadCards(),
		repository.loadMeta(),
	])
	return { views: masteryViews(cards, scheduler, now), plan: meta.plan }
}
