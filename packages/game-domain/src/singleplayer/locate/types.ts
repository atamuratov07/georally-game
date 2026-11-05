import type { CountryId, GameQuestionSetConfig } from '../../shared/types'

export type GamePhase = 'idle' | 'playing' | 'revealed' | 'finished'

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
	eligibleIds: CountryId[]
	questionIds: CountryId[]
}

interface ProgressGameStateBase {
	config: GameConfig
	questionIds: CountryId[]
	index: number
	score: number
	correctCount: number
}

interface ActiveQuestionGameStateBase extends ProgressGameStateBase {
	questionStartedAt: number
}

export interface IdleGameState {
	phase: 'idle'
	config: GameConfig
}

export interface PlayingGameState extends ActiveQuestionGameStateBase {
	phase: 'playing'
	wrongPicks: CountryId[]
}

export interface RevealedGameState extends ActiveQuestionGameStateBase {
	phase: 'revealed'
	wrongPicks: CountryId[]
	isCorrect: boolean
	questionResolvedAt: number
}

export interface FinishedGameState extends ProgressGameStateBase {
	phase: 'finished'
	questionResolvedAt: number
	finishedAt: number
}

export type StartedGameState =
	| PlayingGameState
	| RevealedGameState
	| FinishedGameState

export type GameState = IdleGameState | StartedGameState

export type GameAction =
	| {
			type: 'START'
			session: GameSession
			now: number
	  }
	| {
			type: 'PICK'
			countryId: CountryId
			now: number
	  }
	| {
			type: 'GIVE_UP'
			now: number
	  }
	| {
			type: 'NEXT'
			now: number
	  }
