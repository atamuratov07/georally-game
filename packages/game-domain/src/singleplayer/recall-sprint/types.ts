import type { InputMethod, MatchResult } from '../../answers'
import type { CountryId, GameScope } from '../../shared/types'
import type { IdleState } from '../rounds'

export const SPRINT_LENGTHS = ['short', 'medium', 'long'] as const
export type SprintLength = (typeof SPRINT_LENGTHS)[number]

export interface SprintConfig {
	scope: GameScope
	length: SprintLength
}

export const DEFAULT_SPRINT_CONFIG: SprintConfig = {
	scope: 'all',
	length: 'medium',
}

export interface SprintSession {
	config: SprintConfig
	countryIds: CountryId[]
	durationMs: number
}

export interface Attempt {
	method: InputMethod
	at: number
	heard: string
	foundIds: CountryId[]
	repeatedIds: CountryId[]
	outsideIds: CountryId[]
	unresolved: MatchResult[]
}

interface Sprint extends SprintSession {
	startedAt: number
	deadlineAt: number
	found: CountryId[]
	lastAttempt: Attempt | null
}

export type SprintPhase = 'idle' | 'running' | 'finished'

export type SprintEndedBy = 'timeUp' | 'complete' | 'finished'

export type IdleSprintState = IdleState<SprintConfig>

export interface RunningSprintState extends Sprint {
	phase: 'running'
}

export interface FinishedSprintState extends Sprint {
	phase: 'finished'
	endedBy: SprintEndedBy
	finishedAt: number
}

export type StartedSprintState = RunningSprintState | FinishedSprintState

export type SprintState = IdleSprintState | StartedSprintState

export type SprintAction =
	| { type: 'START'; session: SprintSession; now: number }
	| {
			type: 'ATTEMPT'
			method: InputMethod
			heard: string
			results: readonly MatchResult[]
			now: number
	  }
	| { type: 'TIME_UP'; now: number }
	| { type: 'FINISH'; now: number }
