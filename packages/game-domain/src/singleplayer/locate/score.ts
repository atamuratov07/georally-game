import { elapsedSeconds } from '../../shared/time'

const BASE_QUESTION_SCORE = 100
const TIME_PENALTY_PER_SECOND = 5
const WRONG_PICK_PENALTY = 20

export function calculateQuestionScore(
	startedAt: number,
	resolvedAt: number,
	wrongPickCount: number,
): number {
	const secondsElapsed = elapsedSeconds(startedAt, resolvedAt)
	const totalPenalty =
		secondsElapsed * TIME_PENALTY_PER_SECOND +
		wrongPickCount * WRONG_PICK_PENALTY

	return Math.max(0, BASE_QUESTION_SCORE - totalPenalty)
}
