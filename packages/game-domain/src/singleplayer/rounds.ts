import type { CountryId } from '../shared/types'

export type GamePhase = 'idle' | 'answering' | 'revealed' | 'finished'

export interface IdleState<Config> {
	phase: 'idle'
	config: Config
}

export interface Progress<Config> {
	config: Config
	questionIds: CountryId[]
	index: number
	score: number
	correctCount: number
}

export interface FinishedState<Config> extends Progress<Config> {
	phase: 'finished'
	finishedAt: number
}

type RoundsState =
	| { phase: 'idle' }
	| (Progress<unknown> & { phase: 'answering'; startedAt: number })
	| (Progress<unknown> & {
			phase: 'revealed'
			startedAt: number
			resolvedAt: number
			points: number
	  })
	| FinishedState<unknown>

export function isAnswering(state: RoundsState): boolean {
	return state.phase === 'answering'
}

export function getTargetId(state: RoundsState): CountryId | null {
	return state.phase === 'answering' || state.phase === 'revealed'
		? state.questionIds[state.index]
		: null
}

export function getRevealedId(state: RoundsState): CountryId | null {
	return state.phase === 'revealed' ? state.questionIds[state.index] : null
}

export function getStartedAt(state: RoundsState): number | null {
	return state.phase === 'answering' || state.phase === 'revealed'
		? state.startedAt
		: null
}

export function getResolvedAt(state: RoundsState): number | null {
	return state.phase === 'revealed' ? state.resolvedAt : null
}

export function getRoundPoints(state: RoundsState): number | null {
	return state.phase === 'revealed' ? state.points : null
}

export function getQuestionIndex(state: RoundsState): number {
	return state.phase === 'idle' ? 0 : state.index
}

export function getQuestionCount(state: RoundsState): number {
	return state.phase === 'idle' ? 0 : state.questionIds.length
}

export function getScore(state: RoundsState): number {
	return state.phase === 'idle' ? 0 : state.score
}

export function getCorrectCount(state: RoundsState): number {
	return state.phase === 'idle' ? 0 : state.correctCount
}
