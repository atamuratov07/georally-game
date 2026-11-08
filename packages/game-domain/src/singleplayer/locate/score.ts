import { speedScore } from '../../shared/score'

const SPEED_WINDOW_MS = 30_000
const WRONG_PICK_PENALTY = 10

export function scoreAnswer(
	startedAt: number,
	answeredAt: number,
	wrongPickCount: number,
): number {
	const points =
		speedScore(answeredAt - startedAt, SPEED_WINDOW_MS) -
		WRONG_PICK_PENALTY * wrongPickCount
	return Math.max(0, Math.round(points))
}
