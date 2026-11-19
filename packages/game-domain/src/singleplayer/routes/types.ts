import type { InputMethod, MatchResult } from '../../answers'
import type { CountryId, GameDifficulty } from '../../shared/types'
import type { IdleState } from '../rounds'

export const ROUTE_SCOPES = [
	'all',
	'europe',
	'asia',
	'africa',
	'americas',
] as const
export type RouteScope = (typeof ROUTE_SCOPES)[number]

export interface RoutePracticeConfig {
	kind: 'practice'
	scope: RouteScope
	difficulty: GameDifficulty
}

export interface RouteDailyConfig {
	kind: 'daily'
	number: number
}

export type RouteConfig = RoutePracticeConfig | RouteDailyConfig

export interface RouteSession {
	config: RouteConfig
	startId: CountryId
	targetId: CountryId
}

export type RouteEnds = Pick<RouteSession, 'startId' | 'targetId'>

export interface DailyRouteEntry {
	startId: CountryId
	targetId: CountryId
	par: number
	level: GameDifficulty
}

export type RouteVerdict = 'route' | 'near' | 'off'

export interface Guess {
	countryId: CountryId
	method: InputMethod
	at: number
}

export interface Hint {
	countryId: CountryId
	at: number
}

export interface Attempt {
	method: InputMethod
	at: number
	heard: string
	addedIds: CountryId[]
	repeatedIds: CountryId[]
	endpointIds: CountryId[]
	unresolved: MatchResult[]
}

interface Route extends RouteSession {
	guesses: Guess[]
	hints: Hint[]
	startedAt: number
	lastAttempt: Attempt | null
}

export type RoutePhase = 'idle' | 'playing' | 'finished'

export type RouteOutcome = 'solved' | 'gaveUp'

export type IdleRouteState = IdleState<RouteConfig>

export interface PlayingRouteState extends Route {
	phase: 'playing'
}

export interface FinishedRouteState extends Route {
	phase: 'finished'
	outcome: RouteOutcome
	finishedAt: number
}

export type StartedRouteState = PlayingRouteState | FinishedRouteState

export type RouteState = IdleRouteState | StartedRouteState

export type RouteAction =
	| { type: 'START'; session: RouteSession; now: number }
	| {
			type: 'ATTEMPT'
			method: InputMethod
			heard: string
			results: readonly MatchResult[]
			now: number
	  }
	| { type: 'HINT'; now: number }
	| { type: 'GIVE_UP'; now: number }

export type TimelineEvent =
	| { kind: 'guess'; countryId: CountryId; at: number }
	| { kind: 'hint'; countryId: CountryId; at: number }
