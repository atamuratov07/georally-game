import type { SessionPreparationError } from '../shared/errors'
import { pickRandomIds, type RandomNumberGenerator } from '../shared/random'
import { err, ok, type Result } from '../shared/result'
import type { CountryId, GameQuestionSetConfig } from '../shared/types'
import { selectEligibleCountryIds } from './selectors'
import type { CountryPool } from './types'

export interface QuestionSet {
	eligibleIds: CountryId[]
	questionIds: CountryId[]
}

export function prepareQuestionSet(
	pool: CountryPool,
	config: GameQuestionSetConfig,
	rng: RandomNumberGenerator = Math.random,
): Result<QuestionSet, SessionPreparationError> {
	const eligibleIds = selectEligibleCountryIds(pool, config)
	if (eligibleIds.length === 0) {
		return err({
			code: 'no_eligible_countries',
		})
	}

	if (eligibleIds.length < config.questionCount) {
		return err({
			code: 'insufficient_eligible_countries',
			questionCount: config.questionCount,
			countryCount: eligibleIds.length,
		})
	}

	const questionIds = pickRandomIds(eligibleIds, config.questionCount, rng)

	return ok({
		eligibleIds,
		questionIds,
	})
}
