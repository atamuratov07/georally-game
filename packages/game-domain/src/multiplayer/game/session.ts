import { prepareQuestionSet } from '../../catalog/questionSet'
import type { CountryPool } from '../../catalog/types'
import type { SessionPreparationError } from '../errors'
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
			questionCount: questionIds.length,
			difficulty: config.difficulty,
			scope: config.scope,
			questionDurationMs: config.questionDurationMs,
		},
		eligibleIds,
		questionIds,
	})
}
