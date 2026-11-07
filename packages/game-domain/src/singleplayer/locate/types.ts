import type { CountryId, GameQuestionSetConfig } from '../../shared/types'
import type { FinishedState, IdleState, Progress } from '../rounds'

export type { GamePhase } from '../rounds'

export interface GameConfig extends GameQuestionSetConfig {
	attemptsPerQuestion: number
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
	questionCount: 10,
	attemptsPerQuestion: 3,
	difficulty: 'easy',
	scope: 'all',
}

export interface GameSession {
	config: GameConfig
	questionIds: CountryId[]
}

export type RoundOutcome = 'correct' | 'outOfAttempts' | 'giveUp'

interface Round extends Progress<GameConfig> {
	startedAt: number
	wrongPicks: CountryId[]
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
	| { type: 'PICK'; countryId: CountryId; now: number }
	| { type: 'GIVE_UP'; now: number }
	| { type: 'NEXT'; now: number }
