import { speedScore } from '../../shared/score'

export function scoreAnswer(
	startedAt: number,
	answeredAt: number,
	timeLimitMs: number,
): number {
	return Math.round(speedScore(answeredAt - startedAt, timeLimitMs))
}
