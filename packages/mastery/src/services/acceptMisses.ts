import type { MasteryDeps } from '../ports'
import type { CardId } from '../types'

export async function acceptMisses(
	{ repository }: MasteryDeps,
	cardIds: readonly CardId[],
	seed: number,
) {
	const { plan } = await repository.loadMeta()
	const current = plan ?? { scopes: [], seed, acceptedMisses: [] }
	const accepted = new Set(current.acceptedMisses)
	await repository.savePlan({
		...current,
		acceptedMisses: [
			...current.acceptedMisses,
			...cardIds.filter(id => !accepted.has(id)),
		],
	})
}
