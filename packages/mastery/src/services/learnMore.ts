import type { LocalDay } from '@georally/game-domain'
import type { MasteryDeps } from '../ports'

export const LEARN_MORE_COUNT = 5

export async function learnMore({ repository }: MasteryDeps, day: LocalDay) {
	const { extraNew } = await repository.loadMeta()
	const granted = extraNew?.day === day.key ? extraNew.count : 0
	await repository.saveExtraNew({
		day: day.key,
		count: granted + LEARN_MORE_COUNT,
	})
}
