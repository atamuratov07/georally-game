import { decideBridge, type CasualOutcome } from '../bridge/decideBridge'
import type { MasteryDeps } from '../ports'
import { activeSkills } from '../settings'
import type { CardId } from '../types'

export async function applyCasualOutcomes(
	{ repository }: MasteryDeps,
	outcomes: readonly CasualOutcome[],
	now: number,
): Promise<CardId[]> {
	const [meta, cards] = await Promise.all([
		repository.loadMeta(),
		repository.loadCards(),
	])
	const { offer, recheck } = decideBridge(
		outcomes,
		new Set(cards.map(card => card.id)),
		new Set(meta.plan?.acceptedMisses),
		activeSkills(meta.settings),
	)
	if (recheck.length > 0) await repository.requestRecheck(recheck, now)
	return offer
}
