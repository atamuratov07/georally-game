import { describe, expect, it } from 'vitest'
import type {
	CardId,
	CardRecord,
	ReviewKind,
	ReviewLogEntry,
	SkillId,
} from '../types'
import { buildSessionPlan, type SessionPlanInput } from './plan'

const DAY_END = Date.UTC(2026, 10, 23, 23)
const HOUR = 3_600_000

function card(
	countryId: string,
	due: number,
	skillId: SkillId = 'locate',
): CardRecord {
	return {
		id: `${countryId}:${skillId}`,
		countryId,
		skillId,
		introducedAt: 0,
		scheduling: {
			due,
			stability: 1,
			difficulty: 5,
			phase: 'review',
			learningStep: 0,
			reps: 1,
			lapses: 0,
			lastReviewedAt: 0,
		},
	}
}

function logged(kind: ReviewKind, count: number): ReviewLogEntry[] {
	return Array.from({ length: count }, (_, index) => ({
		id: `${kind}-${index}`,
		cardId: '999:locate',
		reviewedAt: DAY_END - HOUR,
		kind,
		outcome: {
			shape: 'single',
			result: 'correct',
			responseMs: 1_000,
			wrongAttempts: 0,
			input: 'mouse',
		},
		rating: 'good',
	}))
}

function ids(prefix: string, count: number) {
	return Array.from({ length: count }, (_, index) => `${prefix}${index}`)
}

function plan(overrides: Partial<SessionPlanInput>) {
	const cards = overrides.cards ?? []
	return buildSessionPlan({
		cards,
		rechecks: {},
		introOrder: [],
		todaysLog: [],
		settings: { pace: 'steady', pausedSkills: [] },
		extraNew: 0,
		playableIds: new Set(cards.map(entry => entry.countryId)),
		dayEnd: DAY_END,
		...overrides,
	})
}

describe('buildSessionPlan', () => {
	it('leads with rechecks, oldest first, outside the caps', () => {
		const cards = [card('1', 0), card('2', DAY_END + HOUR), card('3', 0)]
		const result = plan({
			cards,
			rechecks: { '2:locate': 20, '1:locate': 10 },
			todaysLog: logged('due', 60),
		})

		expect(result).toEqual(['1:locate', '2:locate'])
	})

	it("fills what's left of today's caps, earliest due first", () => {
		const cards = ids('d', 5).map((id, index) => card(id, DAY_END - index))
		const later = card('tomorrow', DAY_END + 1)
		const result = plan({
			cards: [...cards, later],
			introOrder: ids('n', 20).map(id => `${id}:locate` as CardId),
			todaysLog: [...logged('due', 57), ...logged('new', 6)],
			extraNew: 5,
		})

		expect(result.filter(id => id.startsWith('d'))).toEqual([
			'd4:locate',
			'd3:locate',
			'd2:locate',
		])
		expect(result.filter(id => id.startsWith('n'))).toEqual(
			ids('n', 7).map(id => `${id}:locate`),
		)
	})

	it('spreads new cards evenly through the due ones', () => {
		const due = ids('d', 12).map(id => card(id, 0))
		const result = plan({
			cards: due,
			introOrder: ids('n', 4).map(id => `${id}:locate` as CardId),
		})

		expect(result.map(id => (id.startsWith('n') ? 'N' : '.')).join('')).toBe(
			'.N...N...N...N..',
		)
	})

	it('gives a country one card a day, the longest due first', () => {
		const cards = [
			card('250', HOUR),
			card('250', 2 * HOUR, 'name'),
			card('392', HOUR),
		]
		expect(plan({ cards, introOrder: ['392:name', '616:locate'] })).toEqual([
			'250:locate',
			'616:locate',
			'392:locate',
		])

		const nextDay = [card('250', DAY_END - 1), card('250', 2 * HOUR, 'name')]
		const answeredToday: ReviewLogEntry = {
			...logged('due', 1)[0],
			cardId: '250:locate',
		}
		expect(plan({ cards: nextDay })).toEqual(['250:name'])
		expect(plan({ cards: nextDay, todaysLog: [answeredToday] })).toEqual([
			'250:locate',
		])
	})

	it('skips paused skills and countries no longer playable', () => {
		const cards = [card('1', 0), card('gone', 0)]

		expect(plan({ cards, playableIds: new Set(['1']) })).toEqual(['1:locate'])
		expect(
			plan({
				cards,
				settings: { pace: 'steady', pausedSkills: ['locate'] },
			}),
		).toEqual([])
	})
})
