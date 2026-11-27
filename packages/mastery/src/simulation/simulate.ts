import {
	GAME_DIFFICULTIES,
	seededRandom,
	type CountryPool,
} from '@georally/game-domain'
import { answerCard } from '../answerCard'
import { splitCardId } from '../cardId'
import { introOrder } from '../intro/introOrder'
import type { Scheduler } from '../ports'
import { buildSessionPlan } from '../session/plan'
import { applyAnswer, selectNext, startSession } from '../session/queue'
import { activeSkills } from '../settings'
import { LOCATE_SLOW_MS } from '../skills/locate'
import type {
	AnswerOutcome,
	CardId,
	CardRecord,
	IntroPlan,
	LearnerSettings,
	Pace,
	ReviewLogEntry,
} from '../types'

const DAY = 86_400_000
const SESSION_HOUR = 9 * 3_600_000
const START = Date.UTC(2026, 0, 5)
const MAX_ANSWERS_PER_SESSION = 2_000

// The chance of knowing a never-seen country, by catalog tier.
const NEW_CARD_SUCCESS = [0.7, 0.4, 0.15] as const

export interface SimulationOptions {
	pace: Pace
	days: number
	breakDays?: { from: number; length: number }
	pool: CountryPool
	scheduler: Scheduler
	seed: number
}

export interface SimulatedDay {
	day: number
	played: boolean
	reviews: number
	newCards: number
	dueLeftOver: number // due by the end of the day but cut by the cap
	sessionMs: number
	ended: boolean
}

export interface SimulationResult {
	days: SimulatedDay[]
	cards: CardRecord[]
	log: ReviewLogEntry[]
}

export function simulate(options: SimulationOptions): SimulationResult {
	const { pool, scheduler } = options
	const random = seededRandom(options.seed)
	const settings: LearnerSettings = { pace: options.pace, pausedSkills: [] }
	const plan: IntroPlan = {
		scopes: [{ regions: [], addedAt: START }],
		seed: options.seed,
		acceptedMisses: [],
	}
	const playableIds = new Set(Object.keys(pool.countriesById))
	const cards = new Map<CardId, CardRecord>()
	const log: ReviewLogEntry[] = []
	const days: SimulatedDay[] = []

	function outcomeFor(cardId: CardId, now: number): AnswerOutcome {
		const current = cards.get(cardId)
		const chance = current
			? scheduler.retrievability(current.scheduling, now)
			: NEW_CARD_SUCCESS[
					GAME_DIFFICULTIES.indexOf(
						pool.countriesById[splitCardId(cardId).countryId].difficulty,
					)
				]
		const correct = random() < chance
		const slow = correct && random() < 0.1
		return {
			shape: 'single',
			result: correct ? 'correct' : 'wrong',
			responseMs: slow
				? LOCATE_SLOW_MS + 4_000
				: 2_000 + Math.round(random() * 5_000),
			wrongAttempts: 0,
			input: 'touch',
		}
	}

	for (let day = 0; day < options.days; day += 1) {
		const dayStart = START + day * DAY
		const dayEnd = dayStart + DAY
		const onBreak =
			options.breakDays !== undefined &&
			day >= options.breakDays.from &&
			day < options.breakDays.from + options.breakDays.length
		if (onBreak) {
			days.push({
				day,
				played: false,
				reviews: 0,
				newCards: 0,
				dueLeftOver: 0,
				sessionMs: 0,
				ended: true,
			})
			continue
		}

		const sessionPlan = buildSessionPlan({
			cards: [...cards.values()],
			rechecks: {},
			introOrder: introOrder(
				plan,
				pool,
				activeSkills(settings),
				new Set(cards.keys()),
			),
			todaysLog: [],
			settings,
			extraNew: 0,
			playableIds,
			dayEnd,
		})
		const plannedCountries = new Set(
			sessionPlan.map(cardId => splitCardId(cardId).countryId),
		)
		const dueLeftOver = [...cards.values()].filter(
			card =>
				card.scheduling.due <= dayEnd &&
				!plannedCountries.has(card.countryId),
		).length

		const sessionStart = dayStart + SESSION_HOUR
		const logStart = log.length
		let now = sessionStart
		let state = startSession(sessionPlan)
		let next = selectNext(state, now)
		while (
			next !== 'complete' &&
			log.length - logStart < MAX_ANSWERS_PER_SESSION
		) {
			const outcome = outcomeFor(next, now)
			const answeredAt = now + outcome.responseMs
			const { card, entry } = answerCard(
				cards.get(next),
				false,
				{
					cardId: next,
					outcome,
					entryId: `e${log.length}`,
					now: answeredAt,
				},
				scheduler,
			)
			cards.set(next, card)
			log.push(entry)
			state = applyAnswer(state, next, card.scheduling.due, answeredAt)
			now = answeredAt + (outcome.result === 'correct' ? 1_500 : 4_000)
			next = selectNext(state, now)
		}

		const today = log.slice(logStart)
		days.push({
			day,
			played: true,
			reviews: today.length,
			newCards: today.filter(entry => entry.kind === 'new').length,
			dueLeftOver,
			sessionMs: now - sessionStart,
			ended: next === 'complete',
		})
	}

	return { days, cards: [...cards.values()], log }
}
