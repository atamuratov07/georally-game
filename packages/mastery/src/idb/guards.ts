import { isGameRegions } from '@georally/game-domain'
import { PACES } from '../settings'
import type {
	AnswerInput,
	CardPhase,
	CardRecord,
	ExtraNew,
	IntroPlan,
	LearnerSettings,
	Rating,
	Rechecks,
	ReviewKind,
	ReviewLogEntry,
	SchedulingState,
	SingleAnswerOutcome,
} from '../types'

type Fields = Record<string, unknown>

const RATINGS: readonly Rating[] = ['again', 'hard', 'good', 'easy']
const KINDS: readonly ReviewKind[] = ['new', 'due', 'recheck']
const PHASES: readonly CardPhase[] = ['learning', 'review', 'relearning']
const RESULTS: readonly SingleAnswerOutcome['result'][] = [
	'correct',
	'wrong',
	'timeUp',
	'giveUp',
]
const INPUTS: readonly AnswerInput[] = ['mouse', 'touch', 'typing', 'voice']

function isFields(value: unknown): value is Fields {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value)
}

function isString(value: unknown): value is string {
	return typeof value === 'string'
}

function isOneOf<T>(values: readonly T[], value: unknown): value is T {
	return values.includes(value as T)
}

function isAnswerOutcome(value: unknown) {
	if (!isFields(value)) {
		return false
	}
	switch (value.shape) {
		case 'single':
			return (
				isOneOf(RESULTS, value.result) &&
				isNumber(value.responseMs) &&
				isNumber(value.wrongAttempts) &&
				(value.input === null || isOneOf(INPUTS, value.input))
			)
		default:
			return false
	}
}

// Card ids are only checked to be strings: an id from a newer version stays
// in the log, and rebuildCards skips it.
export function isReviewLogEntry(value: unknown): value is ReviewLogEntry {
	return (
		isFields(value) &&
		isString(value.id) &&
		isString(value.cardId) &&
		isNumber(value.reviewedAt) &&
		isOneOf(KINDS, value.kind) &&
		isAnswerOutcome(value.outcome) &&
		isOneOf(RATINGS, value.rating)
	)
}

function isSchedulingState(value: unknown): value is SchedulingState {
	return (
		isFields(value) &&
		isNumber(value.due) &&
		isNumber(value.stability) &&
		isNumber(value.difficulty) &&
		isOneOf(PHASES, value.phase) &&
		isNumber(value.learningStep) &&
		isNumber(value.reps) &&
		isNumber(value.lapses) &&
		isNumber(value.lastReviewedAt)
	)
}

export function isCardRecord(value: unknown): value is CardRecord {
	return (
		isFields(value) &&
		isString(value.id) &&
		isString(value.countryId) &&
		isString(value.skillId) &&
		isNumber(value.introducedAt) &&
		isSchedulingState(value.scheduling)
	)
}

export function isLearnerSettings(value: unknown): value is LearnerSettings {
	return (
		isFields(value) &&
		Object.hasOwn(PACES, value.pace as string) &&
		Array.isArray(value.pausedSkills) &&
		value.pausedSkills.every(isString)
	)
}

export function isIntroPlan(value: unknown): value is IntroPlan {
	return (
		isFields(value) &&
		Array.isArray(value.scopes) &&
		value.scopes.every(
			scope =>
				isFields(scope) &&
				isGameRegions(scope.regions) &&
				isNumber(scope.addedAt),
		) &&
		isNumber(value.seed) &&
		Array.isArray(value.acceptedMisses) &&
		value.acceptedMisses.every(isString)
	)
}

export function isRechecks(value: unknown): value is Rechecks {
	return isFields(value) && Object.values(value).every(isNumber)
}

export function isExtraNew(value: unknown): value is ExtraNew {
	return isFields(value) && isString(value.day) && isNumber(value.count)
}
