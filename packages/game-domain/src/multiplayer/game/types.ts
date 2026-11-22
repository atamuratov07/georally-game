import type { CountryId, GameDifficulty, GameRegions } from '../../shared/types'
import type { MemberId } from '../room/types'

export type GamePhase = 'open' | 'revealed' | 'leaderboard' | 'completed'

export interface GameConfig {
	questionCount: number
	questionDurationMs?: number | undefined
	difficulty: GameDifficulty
	regions: GameRegions
}

export const DEFAULT_GAME_CONFIG: Required<GameConfig> = {
	questionCount: 10,
	difficulty: 'easy',
	regions: [],
	questionDurationMs: 30_000,
}

export interface GameSession {
	readonly config: Readonly<GameConfig>
	readonly eligibleIds: readonly CountryId[]
	readonly questionIds: readonly CountryId[]
}

export type GameParticipantScore = number

export type GameParticipantState = {
	id: MemberId
	score: GameParticipantScore
	correctCount: number
	// correctStreak: number
}

interface SubmissionBase {
	participantId: MemberId
	countryId: CountryId
	submittedAt: number
}

export interface LockedSubmission extends SubmissionBase {}

export interface EvaluatedSubmission {
	participantId: MemberId
	countryId: CountryId | null
	submittedAt: number | null
	isCorrect: boolean
	score: GameParticipantScore
}

export interface GameLeaderboardEntry {
	participantId: MemberId
	rank: number
	score: GameParticipantScore
	correctCount: number
}

interface RoundStateBase {
	questionIndex: number
	questionId: CountryId
	startedAt: number
	deadlineAt: number | null
}

export interface OpenRoundState extends RoundStateBase {
	submissions: Record<MemberId, LockedSubmission>
}
export interface RevealedRoundState extends RoundStateBase {
	submissions: Record<MemberId, EvaluatedSubmission>
	revealedAt: number
}
export interface LeaderboardRoundState extends RoundStateBase {
	submissions: Record<MemberId, EvaluatedSubmission>
	revealedAt: number
	leaderboardShownAt: number
}
export interface CompletedRoundState extends RoundStateBase {
	submissions: Record<MemberId, EvaluatedSubmission>
	revealedAt: number
	leaderboardShownAt: number | null
}

export interface GameResult {
	gameId: string
	finishedAt: number
	rounds: CompletedRoundState[]
	leaderboard: GameLeaderboardEntry[]
}

export interface GameStateBase {
	gameId: string
	session: GameSession
	participantsById: Record<MemberId, GameParticipantState>
	completedRounds: CompletedRoundState[]
	startedAt: number
}

export interface GameOpenState extends GameStateBase {
	phase: 'open'
	currentRound: OpenRoundState
}

export interface GameRevealedState extends GameStateBase {
	phase: 'revealed'
	currentRound: RevealedRoundState
}

export interface GameLeaderboardState extends GameStateBase {
	phase: 'leaderboard'
	currentRound: LeaderboardRoundState
}

export interface GameCompletedState {
	phase: 'completed'
	gameId: string
	session: GameSession
	participantsById: Record<MemberId, GameParticipantState>
	result: GameResult
	completedAt: number
}

export type GameState =
	GameOpenState | GameRevealedState | GameLeaderboardState | GameCompletedState
