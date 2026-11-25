import { answerCard, type Answer } from '../answerCard'
import type { MasteryDeps } from '../ports'

export function recordAnswer(
	{ repository, scheduler }: MasteryDeps,
	answer: Answer,
) {
	return repository.recordReview(answer.cardId, (current, recheckPending) =>
		answerCard(current, recheckPending, answer, scheduler),
	)
}
