import type {
	AnswerOutcome,
	Rating,
	ReviewKind,
	SingleAnswerOutcome,
} from '../types'

export type Grader = (outcome: AnswerOutcome, kind: ReviewKind) => Rating

export function gradeSingle(
	outcome: SingleAnswerOutcome,
	kind: ReviewKind,
	slowMs: number,
): Rating {
	if (outcome.result !== 'correct') {
		return 'again'
	}
	if (outcome.wrongAttempts > 0 || outcome.responseMs > slowMs) {
		return 'hard'
	}
	return kind === 'new' ? 'easy' : 'good'
}
