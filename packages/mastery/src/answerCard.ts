import { parseCardId } from './cardId'
import type { Scheduler } from './ports'
import { SKILLS } from './skills/registry'
import type {
	AnswerOutcome,
	CardId,
	CardRecord,
	ReviewKind,
	ReviewLogEntry,
} from './types'

export interface Answer {
	cardId: CardId
	outcome: AnswerOutcome
	entryId: string
	now: number
}

export function answerCard(
	current: CardRecord | undefined,
	recheckPending: boolean,
	answer: Answer,
	scheduler: Scheduler,
): { card: CardRecord; entry: ReviewLogEntry } {
	const parsed = parseCardId(answer.cardId)
	if (!parsed) {
		throw new Error(`Unknown card ${answer.cardId}`)
	}

	const kind: ReviewKind = !current
		? 'new'
		: recheckPending
			? 'recheck'
			: 'due'
	const rating = SKILLS[parsed.skillId].grade(answer.outcome, kind)
	const scheduling = scheduler.next(
		current?.scheduling ?? null,
		rating,
		answer.now,
	)

	return {
		card: current
			? { ...current, scheduling }
			: {
					id: answer.cardId,
					...parsed,
					introducedAt: answer.now,
					scheduling,
				},
		entry: {
			id: answer.entryId,
			cardId: answer.cardId,
			reviewedAt: answer.now,
			kind,
			outcome: answer.outcome,
			rating,
		},
	}
}
