import type { Rating, SchedulingState } from './types'

export interface Scheduler {
	next(
		state: SchedulingState | null, // null for a card's first review
		rating: Rating,
		now: number,
	): SchedulingState
	retrievability(state: SchedulingState, now: number): number // 0 to 1
}
