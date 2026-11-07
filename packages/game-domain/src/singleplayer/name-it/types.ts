import type { InputMethod, MatchResult } from '../../answers'
import type { CountryId, GameQuestionSetConfig } from '../../shared/types'
import type { FinishedState, IdleState, Progress } from '../rounds'

export type { GamePhase } from '../rounds'

export interface GameConfig extends GameQuestionSetConfig {
	timeLimitMs: number
	inputs: readonly InputMethod[]
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
	questionCount: 10,
	difficulty: 'easy',
	scope: 'all',
	timeLimitMs: 20_000,
	inputs: ['typing', 'voice'],
}

export interface GameSession {
	config: GameConfig
	questionIds: CountryId[]
}

export interface Attempt {
	method: InputMethod
	result: MatchResult
	at: number
}

export type RoundOutcome = 'correct' | 'timeUp' | 'giveUp'

interface Round extends Progress<GameConfig> {
	startedAt: number
	deadlineAt: number
	attempts: Attempt[]
}

export type IdleGameState = IdleState<GameConfig>

export interface AnsweringGameState extends Round {
	phase: 'answering'
}

export interface RevealedGameState extends Round {
	phase: 'revealed'
	outcome: RoundOutcome
	points: number
	resolvedAt: number
}

export type FinishedGameState = FinishedState<GameConfig>

export type StartedGameState =
	AnsweringGameState | RevealedGameState | FinishedGameState

export type GameState = IdleGameState | StartedGameState

export type GameAction =
	| { type: 'START'; session: GameSession; now: number }
	| { type: 'ATTEMPT'; method: InputMethod; result: MatchResult; now: number }
	| { type: 'TIME_UP'; now: number }
	| { type: 'GIVE_UP'; now: number }
	| { type: 'NEXT'; now: number }
