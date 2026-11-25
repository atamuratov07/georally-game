import type { GameRegions } from '@georally/game-domain'
import type { MasteryDeps } from '../ports'

export async function addScope(
	{ repository }: MasteryDeps,
	input: { regions: GameRegions; now: number; seed: number },
) {
	const { plan } = await repository.loadMeta()
	const scope = { regions: input.regions, addedAt: input.now }
	await repository.savePlan(
		plan
			? { ...plan, scopes: [...plan.scopes, scope] }
			: { scopes: [scope], seed: input.seed, acceptedMisses: [] },
	)
}
