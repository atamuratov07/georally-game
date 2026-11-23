import {
	createEmptyCard,
	fsrs,
	Rating as FsrsRating,
	State,
	type Card,
	type Grade,
} from 'ts-fsrs'
import type { Scheduler } from '../ports'
import type { CardPhase, Rating, SchedulingState } from '../types'

const engine = fsrs({
	request_retention: 0.9,
	maximum_interval: 365,
	enable_short_term: true,
	enable_fuzz: false,
})

const GRADES: Record<Rating, Grade> = {
	again: FsrsRating.Again,
	hard: FsrsRating.Hard,
	good: FsrsRating.Good,
	easy: FsrsRating.Easy,
}

function phaseOf(state: State): CardPhase {
	switch (state) {
		case State.Learning:
			return 'learning'
		case State.Review:
			return 'review'
		case State.Relearning:
			return 'relearning'
		default:
			throw new Error(`ts-fsrs left a reviewed card in state ${state}`)
	}
}

const STATES: Record<CardPhase, State> = {
	learning: State.Learning,
	review: State.Review,
	relearning: State.Relearning,
}

// The library computes elapsed time from last_review and never reads
// elapsed_days or scheduled_days, so they aren't kept.
function toLibrary(state: SchedulingState): Card {
	return {
		due: new Date(state.due),
		stability: state.stability,
		difficulty: state.difficulty,
		elapsed_days: 0,
		scheduled_days: 0,
		learning_steps: state.learningStep,
		reps: state.reps,
		lapses: state.lapses,
		state: STATES[state.phase],
		last_review: new Date(state.lastReviewedAt),
	}
}

function fromLibrary(card: Card, reviewedAt: number): SchedulingState {
	return {
		due: card.due.getTime(),
		stability: card.stability,
		difficulty: card.difficulty,
		phase: phaseOf(card.state),
		learningStep: card.learning_steps,
		reps: card.reps,
		lapses: card.lapses,
		lastReviewedAt: reviewedAt,
	}
}

export const fsrsScheduler: Scheduler = {
	next(state, rating, now) {
		const card = state ? toLibrary(state) : createEmptyCard(new Date(now))
		const { card: next } = engine.next(card, new Date(now), GRADES[rating])
		return fromLibrary(next, now)
	},
	retrievability(state, now) {
		return engine.get_retrievability(toLibrary(state), new Date(now), false)
	},
}
