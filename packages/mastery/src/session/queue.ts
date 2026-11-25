import type { CardId } from '../types'

export const LEARN_AHEAD_MS = 15 * 60_000

export interface SessionState {
	upcoming: CardId[]
	waiting: { cardId: CardId; due: number }[]
	reviewed: number
}

export function startSession(plan: readonly CardId[]): SessionState {
	return { upcoming: [...plan], waiting: [], reviewed: 0 }
}

function earliestWaiting(state: SessionState) {
	return state.waiting.reduce<SessionState['waiting'][number] | null>(
		(earliest, card) =>
			!earliest || card.due < earliest.due ? card : earliest,
		null,
	)
}

export function selectNext(
	state: SessionState,
	now: number,
): CardId | 'complete' {
	const earliest = earliestWaiting(state)
	if (earliest && earliest.due <= now) {
		return earliest.cardId
	}
	return state.upcoming[0] ?? earliest?.cardId ?? 'complete'
}

export function applyAnswer(
	state: SessionState,
	cardId: CardId,
	nextDue: number,
	now: number,
): SessionState {
	const waiting = state.waiting.filter(card => card.cardId !== cardId)
	return {
		upcoming: state.upcoming.filter(id => id !== cardId),
		waiting:
			nextDue - now <= LEARN_AHEAD_MS
				? [...waiting, { cardId, due: nextDue }]
				: waiting,
		reviewed: state.reviewed + 1,
	}
}
