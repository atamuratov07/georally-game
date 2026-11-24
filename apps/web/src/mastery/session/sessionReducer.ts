import {
	applyAnswer,
	selectNext,
	startSession,
	type CardId,
	type ReviewKind,
	type SessionState,
} from '@georally/mastery'

export interface SessionStats {
	startedAt: number
	cards: ReadonlySet<CardId>
	newCount: number
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed'

export type MasterySession =
	| { status: 'loading' | 'unavailable' | 'empty' }
	| {
			status: 'playing'
			queue: SessionState
			cardId: CardId
			turn: number
			startedAt: number | null // null until the card's screen is ready
			save: SaveStatus
			stats: SessionStats
	  }
	| { status: 'complete'; stats: SessionStats }

export type SessionEvent =
	| { type: 'loaded'; plan: readonly CardId[]; now: number }
	| { type: 'unavailable' }
	| { type: 'ready'; now: number }
	| { type: 'saving' }
	| {
			type: 'saved'
			cardId: CardId
			due: number
			kind: ReviewKind
			now: number
	  }
	| { type: 'saveFailed' }
	| { type: 'next'; now: number }

function start(plan: readonly CardId[], now: number): MasterySession {
	const queue = startSession(plan)
	const cardId = selectNext(queue, now)
	if (cardId === 'complete') return { status: 'empty' }
	return {
		status: 'playing',
		queue,
		cardId,
		turn: 0,
		startedAt: null,
		save: 'idle',
		stats: { startedAt: now, cards: new Set(), newCount: 0 },
	}
}

export function sessionReducer(
	state: MasterySession,
	event: SessionEvent,
): MasterySession {
	if (state.status === 'loading') {
		if (event.type === 'loaded') return start(event.plan, event.now)
		if (event.type === 'unavailable') return { status: 'unavailable' }
		return state
	}
	if (state.status !== 'playing') return state

	switch (event.type) {
		case 'ready':
			return state.startedAt === null
				? { ...state, startedAt: event.now }
				: state
		case 'saving':
			return { ...state, save: 'saving' }
		case 'saveFailed':
			return { ...state, save: 'failed' }
		case 'saved':
			return {
				...state,
				save: 'saved',
				queue: applyAnswer(state.queue, event.cardId, event.due, event.now),
				stats: {
					...state.stats,
					cards: new Set(state.stats.cards).add(event.cardId),
					newCount: state.stats.newCount + (event.kind === 'new' ? 1 : 0),
				},
			}
		case 'next': {
			if (state.save !== 'saved') return state
			const cardId = selectNext(state.queue, event.now)
			if (cardId === 'complete') {
				return { status: 'complete', stats: state.stats }
			}
			return {
				...state,
				cardId,
				turn: state.turn + 1,
				startedAt: event.now,
				save: 'idle',
			}
		}
		default:
			return state
	}
}
