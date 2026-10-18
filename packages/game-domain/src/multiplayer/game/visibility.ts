import type { CountryId, GameScope } from '../../shared/types'
import type { MemberId } from '../room/types'
import {
	getAnsweredParticipantCount,
	getGameCurrentQuestionNumber,
	getGameLeaderboard,
	getGameParticipantCount,
	getGameQuestionCount,
	type ActiveGameState,
} from './selectors'
import type {
	EvaluatedSubmission,
	GameLeaderboardEntry,
	GamePhase,
	GameResult,
	GameState,
	LockedSubmission,
} from './types'

export interface ViewerSubmissionView {
	countryId: CountryId
	submittedAt: number
}

export interface EvaluatedViewerSubmissionView {
	countryId: CountryId | null
	submittedAt: number | null
	isCorrect: boolean
	scoreAwarded: number
}

interface GameParticipantViewBase {
	gameId: string
	phase: GamePhase
	viewerParticipantId: MemberId
	questionCount: number
	currentQuestionNumber: number
	scope: GameScope
	eligibleCountryIds: readonly CountryId[]
	participantCount: number
	viewerScore: number
	viewerCorrectCount: number
	viewerRank: number | null
	leaderboard: GameLeaderboardEntry[] | null
}

interface ActiveGameViewBase extends GameParticipantViewBase {
	startedAt: number
	deadlineAt: number | null
	answeredCount: number
	questionCountryId: CountryId
	viewerSubmission: ViewerSubmissionView | EvaluatedViewerSubmissionView | null
}

export interface OpenGameParticipantView extends ActiveGameViewBase {
	phase: 'open'
	viewerSubmission: ViewerSubmissionView | null
}

export interface RevealedGameParticipantView extends ActiveGameViewBase {
	phase: 'revealed'
	revealedAt: number
	correctCountryId: CountryId
	viewerSubmission: EvaluatedViewerSubmissionView | null
}

export interface LeaderboardGameParticipantView extends ActiveGameViewBase {
	phase: 'leaderboard'
	revealedAt: number
	leaderboardShownAt: number
	correctCountryId: CountryId
	viewerSubmission: EvaluatedViewerSubmissionView | null
	leaderboard: GameLeaderboardEntry[]
}

export interface CompletedGameParticipantView extends GameParticipantViewBase {
	phase: 'completed'
	result: GameResult
	leaderboard: GameLeaderboardEntry[]
}

export type GameParticipantView =
	| OpenGameParticipantView
	| RevealedGameParticipantView
	| LeaderboardGameParticipantView
	| CompletedGameParticipantView

export type ActiveGameParticipantView =
	| OpenGameParticipantView
	| RevealedGameParticipantView
	| LeaderboardGameParticipantView

export type GameView = GameParticipantView | GameHostView

export interface GameViewOptions {
	includeAllSubmissions?: boolean
}

export function toViewerSubmissionView(
	submission: LockedSubmission,
): ViewerSubmissionView {
	return {
		countryId: submission.countryId,
		submittedAt: submission.submittedAt,
	}
}

export function toEvaluatedViewerSubmissionView(
	submission: EvaluatedSubmission,
): EvaluatedViewerSubmissionView {
	return {
		countryId: submission.countryId,
		submittedAt: submission.submittedAt,
		isCorrect: submission.isCorrect,
		scoreAwarded: submission.score,
	}
}

export function toGameParticipantView(
	state: GameState,
	viewerId: MemberId,
): GameParticipantView {
	const leaderboard = getGameLeaderboard(state)
	const canShowLeaderboard =
		state.phase === 'leaderboard' || state.phase === 'completed'
	const viewerParticipant = state.participantsById[viewerId]
	const viewerLeaderboardEntry =
		leaderboard.find(entry => entry.participantId === viewerId) ?? null

	const base = {
		gameId: state.gameId,
		phase: state.phase,
		viewerParticipantId: viewerId,
		questionCount: getGameQuestionCount(state),
		currentQuestionNumber: getGameCurrentQuestionNumber(state),
		scope: state.session.config.scope,
		eligibleCountryIds: state.session.eligibleIds,
		participantCount: getGameParticipantCount(state),
		viewerScore:
			viewerParticipant?.score ?? viewerLeaderboardEntry?.score ?? 0,
		viewerCorrectCount:
			viewerParticipant?.correctCount ??
			viewerLeaderboardEntry?.correctCount ??
			0,
		viewerRank: canShowLeaderboard
			? (viewerLeaderboardEntry?.rank ?? null)
			: null,
		leaderboard: canShowLeaderboard ? leaderboard : null,
	}

	switch (state.phase) {
		case 'open': {
			const viewerSubmission = state.currentRound.submissions[viewerId]

			return {
				...base,
				phase: 'open',
				startedAt: state.currentRound.startedAt,
				deadlineAt: state.currentRound.deadlineAt,
				answeredCount: getAnsweredParticipantCount(state),
				questionCountryId: state.currentRound.questionId,
				viewerSubmission: viewerSubmission
					? toViewerSubmissionView(viewerSubmission)
					: null,
			}
		}

		case 'revealed': {
			const viewerSubmission = state.currentRound.submissions[viewerId]
			return {
				...base,
				phase: 'revealed',
				startedAt: state.currentRound.startedAt,
				revealedAt: state.currentRound.revealedAt,
				deadlineAt: state.currentRound.deadlineAt,
				answeredCount: getAnsweredParticipantCount(state),
				questionCountryId: state.currentRound.questionId,
				correctCountryId: state.currentRound.questionId,
				viewerSubmission:
					viewerSubmission && 'isCorrect' in viewerSubmission
						? toEvaluatedViewerSubmissionView(viewerSubmission)
						: null,
			}
		}

		case 'leaderboard': {
			const viewerSubmission = state.currentRound.submissions[viewerId]
			return {
				...base,
				phase: 'leaderboard',
				startedAt: state.currentRound.startedAt,
				deadlineAt: state.currentRound.deadlineAt,
				answeredCount: getAnsweredParticipantCount(state),
				questionCountryId: state.currentRound.questionId,
				revealedAt: state.currentRound.revealedAt,
				leaderboardShownAt: state.currentRound.leaderboardShownAt,
				correctCountryId: state.currentRound.questionId,
				viewerSubmission:
					viewerSubmission && 'isCorrect' in viewerSubmission
						? toEvaluatedViewerSubmissionView(viewerSubmission)
						: null,
				leaderboard: getGameLeaderboard(state),
			}
		}

		case 'completed':
			return {
				...base,
				phase: 'completed',
				result: state.result,
				leaderboard: state.result.leaderboard,
			}
	}
}

interface GameHostViewBase {
	gameId: string
	phase: GamePhase
	viewerParticipantId: MemberId
	questionCount: number
	currentQuestionNumber: number
	scope: GameScope
	participantCount: number
}

interface ActiveGameHostViewBase extends GameHostViewBase {
	startedAt: number
	deadlineAt: number | null
	answeredCount: number
	questionCountryId: CountryId
}

export interface GameParticipantsEntry {
	participantId: MemberId
	rank: number
	score: number
	correctCount: number
	submittedAt: number | null
}

export interface GameHostSubmissionView {
	countryId: CountryId | null
	isCorrect: boolean
	scoreAwarded: number
	submittedAt: number | null
}

export interface GameEvaluatedParticipantsEntry {
	participantId: MemberId
	rank: number
	score: number
	correctCount: number
	submission: GameHostSubmissionView | null
}

export interface GameHostOpenView extends ActiveGameHostViewBase {
	phase: 'open'
	questionCountryId: CountryId
	participants: GameParticipantsEntry[]
}

export interface GameHostRevealedView extends ActiveGameHostViewBase {
	phase: 'revealed'
	revealedAt: number
	correctCountryId: CountryId
	participants: GameEvaluatedParticipantsEntry[]
}

export interface GameHostLeaderboardView extends ActiveGameHostViewBase {
	phase: 'leaderboard'
	revealedAt: number
	correctCountryId: CountryId
	participants: GameEvaluatedParticipantsEntry[]
}

export interface GameHostCompletedView extends GameHostViewBase {
	phase: 'completed'
	result: GameResult
}

export type ActiveGameHostView =
	GameHostOpenView | GameHostRevealedView | GameHostLeaderboardView

export type GameHostView =
	| GameHostOpenView
	| GameHostRevealedView
	| GameHostLeaderboardView
	| GameHostCompletedView

export function toGameHostView(
	state: GameState,
	viewerId: MemberId,
): GameHostView {
	const base: GameHostViewBase = {
		gameId: state.gameId,
		phase: state.phase,
		viewerParticipantId: viewerId,
		questionCount: getGameQuestionCount(state),
		currentQuestionNumber: getGameCurrentQuestionNumber(state),
		scope: state.session.config.scope,
		participantCount: getGameParticipantCount(state),
	}
	switch (state.phase) {
		case 'open':
			return {
				...base,
				phase: 'open',
				startedAt: state.currentRound.startedAt,
				deadlineAt: state.currentRound.deadlineAt,
				answeredCount: getAnsweredParticipantCount(state),
				questionCountryId: state.currentRound.questionId,
				participants: toOpenHostParticipants(
					state,
					getGameLeaderboard(state),
				),
			}

		case 'revealed':
		case 'leaderboard':
			return {
				...base,
				phase: state.phase,
				startedAt: state.currentRound.startedAt,
				revealedAt: state.currentRound.revealedAt,
				deadlineAt: state.currentRound.deadlineAt,
				answeredCount: getAnsweredParticipantCount(state),
				questionCountryId: state.currentRound.questionId,
				correctCountryId: state.currentRound.questionId,
				participants: toEvaluatedHostParticipants(
					state,
					getGameLeaderboard(state),
				),
			}

		case 'completed': {
			return {
				...base,
				phase: 'completed',
				result: state.result,
			}
		}
	}
}

export function toOpenHostParticipants(
	state: Extract<ActiveGameState, { phase: 'open' }>,
	leaderboard: readonly GameLeaderboardEntry[],
): GameParticipantsEntry[] {
	return leaderboard.map(leaderboardEntry => {
		const participantSubmission =
			state.currentRound.submissions[leaderboardEntry.participantId]
		return {
			participantId: leaderboardEntry.participantId,
			rank: leaderboardEntry.rank,
			score: leaderboardEntry.score,
			correctCount: leaderboardEntry.correctCount,
			submittedAt: participantSubmission
				? participantSubmission.submittedAt
				: null,
		}
	})
}

export function toEvaluatedHostParticipants(
	state: Exclude<ActiveGameState, { phase: 'open' }>,
	leaderboard: readonly GameLeaderboardEntry[],
): GameEvaluatedParticipantsEntry[] {
	return leaderboard.map(leaderboardEntry => {
		const participantSubmission =
			state.currentRound.submissions[leaderboardEntry.participantId]
		return {
			participantId: leaderboardEntry.participantId,
			rank: leaderboardEntry.rank,
			score: leaderboardEntry.score,
			correctCount: leaderboardEntry.correctCount,
			submission: participantSubmission
				? {
						isCorrect: participantSubmission.isCorrect,
						countryId: participantSubmission.countryId,
						scoreAwarded: participantSubmission.score,
						submittedAt: participantSubmission.submittedAt,
					}
				: null,
		}
	})
}
