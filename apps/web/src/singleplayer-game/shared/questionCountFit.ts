import { playableCountryPool } from '@georally/country-catalog'
import {
	selectEligibleCountryIds,
	type GameQuestionSetConfig,
} from '@georally/game-domain'

export function fitQuestionCount(
	config: GameQuestionSetConfig,
	options: readonly number[],
) {
	const eligibleCount = selectEligibleCountryIds(
		playableCountryPool,
		config,
	).length
	const limit = Math.min(config.questionCount, eligibleCount)
	const questionCount = options.filter(count => count <= limit).at(-1) ?? null

	return { eligibleCount, questionCount }
}
