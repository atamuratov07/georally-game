import { prepareQuestionSet } from '../../catalog/questionSet'
import type { CountryPool } from '../../catalog/types'
import type { SessionPreparationError } from '../../shared/errors'
import type { RandomNumberGenerator } from '../../shared/random'
import { ok, type Result } from '../../shared/result'
import type { GameConfig, GameSession } from './types'

export function prepareGameSession(
	pool: CountryPool,
	config: GameConfig,
	rng: RandomNumberGenerator = Math.random,
): Result<GameSession, SessionPreparationError> {
	const questionSet = prepareQuestionSet(pool, config, rng)
	if (!questionSet.ok) {
		return questionSet
	}

	const { eligibleIds, questionIds } = questionSet.value

	return ok({
		config: {
			questionCount: config.questionCount,
			attemptsPerQuestion: config.attemptsPerQuestion,
			difficulty: config.difficulty,
			scope: config.scope,
		},
		eligibleIds,
		questionIds,
	})
}
