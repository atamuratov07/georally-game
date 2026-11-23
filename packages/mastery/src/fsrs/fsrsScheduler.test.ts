import { createEmptyCard, fsrs, State, type Grade } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import type { Rating, SchedulingState } from '../types'
import { fsrsScheduler } from './fsrsScheduler'

const MINUTE = 60_000
const DAY = 86_400_000
const T0 = Date.UTC(2026, 10, 23, 9)
const RATINGS: Rating[] = ['again', 'hard', 'good', 'easy']
const PHASES = {
	[State.Learning]: 'learning',
	[State.Review]: 'review',
	[State.Relearning]: 'relearning',
} as Record<State, string>

function minutesAfter(from: number, state: SchedulingState) {
	return Math.round((state.due - from) / MINUTE)
}

function daysAfter(from: number, state: SchedulingState) {
	return Math.round(((state.due - from) / DAY) * 10) / 10
}

describe('fsrsScheduler', () => {
	it('schedules the worked example', () => {
		const missed = fsrsScheduler.next(null, 'again', T0)
		const stepped = fsrsScheduler.next(missed, 'good', missed.due)
		const graduated = fsrsScheduler.next(stepped, 'good', stepped.due)
		const second = fsrsScheduler.next(graduated, 'good', graduated.due)
		const third = fsrsScheduler.next(second, 'good', second.due)
		const fourth = fsrsScheduler.next(third, 'good', third.due)
		const lapsed = fsrsScheduler.next(fourth, 'again', fourth.due)
		const known = fsrsScheduler.next(null, 'easy', T0)

		expect({
			missedInMinutes: minutesAfter(T0, missed),
			steppedInMinutes: minutesAfter(missed.due, stepped),
			graduatedInDays: daysAfter(stepped.due, graduated),
			secondInDays: daysAfter(graduated.due, second),
			thirdInDays: daysAfter(second.due, third),
			fourthInDays: daysAfter(third.due, fourth),
			lapsedPhase: lapsed.phase,
			lapsedInMinutes: minutesAfter(fourth.due, lapsed),
			knownInDays: daysAfter(T0, known),
			recallWhenDue: fsrsScheduler
				.retrievability(fourth, fourth.due)
				.toFixed(2),
		}).toMatchInlineSnapshot(`
			{
			  "fourthInDays": 19,
			  "graduatedInDays": 1,
			  "knownInDays": 8,
			  "lapsedInMinutes": 10,
			  "lapsedPhase": "relearning",
			  "missedInMinutes": 1,
			  "recallWhenDue": "0.90",
			  "secondInDays": 2,
			  "steppedInMinutes": 10,
			  "thirdInDays": 7,
			}
		`)
	})

	it('drops no field the library needs', () => {
		const library = fsrs({
			request_retention: 0.9,
			maximum_interval: 365,
			enable_short_term: true,
			enable_fuzz: false,
		})
		let seed = 7
		const random = () => {
			seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648
			return seed / 2_147_483_648
		}

		for (let history = 0; history < 50; history += 1) {
			let now = T0
			let card = createEmptyCard(new Date(now))
			let state: SchedulingState | null = null

			for (let review = 0; review < 30; review += 1) {
				const index = Math.floor(random() * 4)
				card = library.next(card, new Date(now), (index + 1) as Grade).card
				state = fsrsScheduler.next(state, RATINGS[index], now)

				expect(state).toEqual({
					due: card.due.getTime(),
					stability: card.stability,
					difficulty: card.difficulty,
					phase: PHASES[card.state],
					learningStep: card.learning_steps,
					reps: card.reps,
					lapses: card.lapses,
					lastReviewedAt: now,
				})

				const interval = state.due - now
				now += Math.round(interval * (0.5 + random() * 2))
			}
		}
	})
})
