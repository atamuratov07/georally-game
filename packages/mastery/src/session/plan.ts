import type { CountryId } from '@georally/game-domain'
import { splitCardId } from '../cardId'
import { activeSkills, PACES } from '../settings'
import type {
	CardId,
	CardRecord,
	LearnerSettings,
	Rechecks,
	ReviewLogEntry,
} from '../types'

export interface SessionPlanInput {
	cards: readonly CardRecord[]
	rechecks: Rechecks
	introOrder: readonly CardId[]
	todaysLog: readonly ReviewLogEntry[]
	settings: LearnerSettings
	extraNew: number
	playableIds: ReadonlySet<CountryId>
	dayEnd: number
}

function countKind(log: readonly ReviewLogEntry[], kind: 'new' | 'due') {
	return log.filter(entry => entry.kind === kind).length
}

// Spreads `extra` evenly through `base`, centred so neither end is crowded.
function interleave(base: readonly CardId[], extra: readonly CardId[]) {
	const result: CardId[] = []
	let baseIndex = 0
	extra.forEach((cardId, index) => {
		const before = Math.floor(
			((2 * index + 1) * base.length) / (2 * extra.length),
		)
		result.push(...base.slice(baseIndex, before), cardId)
		baseIndex = before
	})
	return [...result, ...base.slice(baseIndex)]
}

function onePerCountry(
	cardIds: readonly CardId[],
	owners: Map<CountryId, CardId>,
	limit = Infinity,
) {
	const kept: CardId[] = []
	for (const cardId of cardIds) {
		if (kept.length >= limit) break
		const { countryId } = splitCardId(cardId)
		const owner = owners.get(countryId)
		if (owner !== undefined && owner !== cardId) continue
		owners.set(countryId, cardId)
		kept.push(cardId)
	}
	return kept
}

export function buildSessionPlan(input: SessionPlanInput): CardId[] {
	const pace = PACES[input.settings.pace]
	const skills = activeSkills(input.settings)
	const playable = input.cards.filter(
		card =>
			skills.includes(card.skillId) && input.playableIds.has(card.countryId),
	)

	const owners = new Map<CountryId, CardId>(
		input.todaysLog.map(entry => [
			splitCardId(entry.cardId).countryId,
			entry.cardId,
		]),
	)
	const rechecked = onePerCountry(
		playable
			.filter(card => input.rechecks[card.id] !== undefined)
			.sort((a, b) => input.rechecks[a.id]! - input.rechecks[b.id]!)
			.map(card => card.id),
		owners,
	)

	const dueRoom = Math.max(
		0,
		pace.reviewCap - countKind(input.todaysLog, 'due'),
	)
	const due = onePerCountry(
		playable
			.filter(
				card =>
					input.rechecks[card.id] === undefined &&
					card.scheduling.due <= input.dayEnd,
			)
			.sort(
				(a, b) =>
					a.scheduling.due - b.scheduling.due || (a.id < b.id ? -1 : 1),
			)
			.map(card => card.id),
		owners,
		dueRoom,
	)

	const newRoom = Math.max(
		0,
		pace.newPerDay + input.extraNew - countKind(input.todaysLog, 'new'),
	)
	const fresh = onePerCountry(input.introOrder, owners, newRoom)

	return [...rechecked, ...interleave(due, fresh)]
}
