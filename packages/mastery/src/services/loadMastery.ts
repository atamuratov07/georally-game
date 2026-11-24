import type { MasteryDeps } from '../ports'
import type { CardId } from '../types'
import { masteryViews, type MasteryView } from '../view/deriveMastery'

export async function loadMastery(
	{ repository, scheduler }: MasteryDeps,
	now: number,
): Promise<ReadonlyMap<CardId, MasteryView>> {
	return masteryViews(await repository.loadCards(), scheduler, now)
}
