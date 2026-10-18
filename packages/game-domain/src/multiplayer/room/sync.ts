import type { CountryId, GameScope } from '../../shared/types'
import {
	getAnsweredParticipantCount,
	getGameCurrentQuestionNumber,
	getGameLeaderboard,
	getGameParticipantCount,
	getGameQuestionCount,
} from '../game/selectors'
import type { GameLeaderboardEntry, GameResult, GameState } from '../game/types'
import {
	toEvaluatedHostParticipants,
	toEvaluatedViewerSubmissionView,
	toOpenHostParticipants,
	toViewerSubmissionView,
	type EvaluatedViewerSubmissionView,
	type GameEvaluatedParticipantsEntry,
	type GameHostView,
	type GameParticipantView,
	type GameParticipantsEntry,
	type ViewerSubmissionView,
} from '../game/visibility'
import { getConnectedMemberCount, getMember } from './selectors'
import type { MemberId, RoomMode, RoomState } from './types'
import {
	toVisibleMembers,
	type ClassroomHostRoomView,
	type GroupHostRoomView,
	type RoomHostView,
	type RoomPlayerView,
	type VisibleMemberInfo,
} from './visibility'

export interface RoomGameInfo {
	gameId: string
	questionCount: number
	scope: GameScope
	eligibleCountryIds: readonly CountryId[]
	participantCount: number
}

interface GameSharedViewBase {
	gameId: string
	currentQuestionNumber: number
}

interface ActiveGameSharedViewBase extends GameSharedViewBase {
	startedAt: number
	deadlineAt: number | null
	answeredCount: number
	questionCountryId: CountryId
}

export interface OpenGameSharedView extends ActiveGameSharedViewBase {
	phase: 'open'
	leaderboard: null
}

export interface RevealedGameSharedView extends ActiveGameSharedViewBase {
	phase: 'revealed'
	revealedAt: number
	correctCountryId: CountryId
	leaderboard: null
}

export interface LeaderboardGameSharedView extends ActiveGameSharedViewBase {
	phase: 'leaderboard'
	revealedAt: number
	leaderboardShownAt: number
	correctCountryId: CountryId
	leaderboard: GameLeaderboardEntry[]
}

export interface CompletedGameSharedView extends GameSharedViewBase {
	phase: 'completed'
	result: GameResult
	leaderboard: GameLeaderboardEntry[]
}

export type GameSharedView =
	| OpenGameSharedView
	| RevealedGameSharedView
	| LeaderboardGameSharedView
	| CompletedGameSharedView

interface RoomSharedViewBase {
	roomId: string
	roomCode: string
	roomMode: RoomMode
	hostId: MemberId
	createdAt: number
	connectedMemberCount: number
	gameHistoryCount: number
}

export interface RoomLobbySharedView extends RoomSharedViewBase {
	phase: 'lobby'
	activeGame: null
}

export interface RoomActiveSharedView extends RoomSharedViewBase {
	phase: 'active'
	activeGame: GameSharedView
}

export interface RoomFinishedSharedView extends RoomSharedViewBase {
	phase: 'finished'
	activeGame: null
	finishedAt: number
}

export type RoomSharedView =
	RoomLobbySharedView | RoomActiveSharedView | RoomFinishedSharedView

export interface GameViewerView {
	gameId: string
	viewerScore: number
	viewerCorrectCount: number
	viewerRank: number | null
	viewerSubmission: ViewerSubmissionView | EvaluatedViewerSubmissionView | null
}

export type GameHostDetail =
	| {
			gameId: string
			phase: 'open'
			participants: GameParticipantsEntry[]
	  }
	| {
			gameId: string
			phase: 'revealed' | 'leaderboard'
			participants: GameEvaluatedParticipantsEntry[]
	  }

export interface RoomSync {
	revision: number
	shared: RoomSharedView
	members: VisibleMemberInfo[]
	game: RoomGameInfo | null
	lastGameResult: GameResult | null
	viewer: GameViewerView | null
	hostDetail: GameHostDetail | null
}

export interface RoomSyncUpdate {
	revision: number
	shared: RoomSharedView
	members?: VisibleMemberInfo[]
	game?: RoomGameInfo
	lastGameResult?: GameResult
}

export interface RoomSyncViewerUpdate {
	revision: number
	viewer: GameViewerView
}

export interface RoomSyncHostDetailUpdate {
	revision: number
	hostDetail: GameHostDetail
}

export interface RoomSyncState {
	sync: RoomSync
	pendingViewer: RoomSyncViewerUpdate | null
	pendingHostDetail: RoomSyncHostDetailUpdate | null
	outOfSync: boolean
}

export function getRoomLeaderboard(
	state: RoomState,
): GameLeaderboardEntry[] | null {
	return state.phase === 'active' ? getGameLeaderboard(state.activeGame) : null
}

export function toRoomGameInfo(state: GameState): RoomGameInfo {
	return {
		gameId: state.gameId,
		questionCount: getGameQuestionCount(state),
		scope: state.session.config.scope,
		eligibleCountryIds: state.session.eligibleIds,
		participantCount: getGameParticipantCount(state),
	}
}

function toGameSharedView(
	state: GameState,
	leaderboard: GameLeaderboardEntry[],
): GameSharedView {
	const base = {
		gameId: state.gameId,
		currentQuestionNumber: getGameCurrentQuestionNumber(state),
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
				leaderboard: null,
			}

		case 'revealed':
			return {
				...base,
				phase: 'revealed',
				startedAt: state.currentRound.startedAt,
				revealedAt: state.currentRound.revealedAt,
				deadlineAt: state.currentRound.deadlineAt,
				answeredCount: getAnsweredParticipantCount(state),
				questionCountryId: state.currentRound.questionId,
				correctCountryId: state.currentRound.questionId,
				leaderboard: null,
			}

		case 'leaderboard':
			return {
				...base,
				phase: 'leaderboard',
				startedAt: state.currentRound.startedAt,
				revealedAt: state.currentRound.revealedAt,
				leaderboardShownAt: state.currentRound.leaderboardShownAt,
				deadlineAt: state.currentRound.deadlineAt,
				answeredCount: getAnsweredParticipantCount(state),
				questionCountryId: state.currentRound.questionId,
				correctCountryId: state.currentRound.questionId,
				leaderboard,
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

export function toRoomSharedView(
	state: RoomState,
	leaderboard: GameLeaderboardEntry[] | null,
): RoomSharedView {
	const base: RoomSharedViewBase = {
		roomId: state.roomId,
		roomCode: state.roomCode,
		roomMode: state.roomMode,
		hostId: state.hostId,
		createdAt: state.createdAt,
		connectedMemberCount: getConnectedMemberCount(state),
		gameHistoryCount: state.gameHistory.length,
	}

	switch (state.phase) {
		case 'lobby':
			return { ...base, phase: 'lobby', activeGame: null }

		case 'active':
			return {
				...base,
				phase: 'active',
				activeGame: toGameSharedView(state.activeGame, leaderboard ?? []),
			}

		case 'finished':
			return {
				...base,
				phase: 'finished',
				activeGame: null,
				finishedAt: state.finishedAt,
			}
	}
}

export function toGameViewerView(
	state: GameState,
	viewerId: MemberId,
	viewerLeaderboardEntry: GameLeaderboardEntry | null,
): GameViewerView {
	const canShowLeaderboard =
		state.phase === 'leaderboard' || state.phase === 'completed'
	const viewerParticipant = state.participantsById[viewerId]
	const viewerSubmission =
		state.phase === 'completed'
			? undefined
			: state.currentRound.submissions[viewerId]

	return {
		gameId: state.gameId,
		viewerScore:
			viewerParticipant?.score ?? viewerLeaderboardEntry?.score ?? 0,
		viewerCorrectCount:
			viewerParticipant?.correctCount ??
			viewerLeaderboardEntry?.correctCount ??
			0,
		viewerRank: canShowLeaderboard
			? (viewerLeaderboardEntry?.rank ?? null)
			: null,
		viewerSubmission: !viewerSubmission
			? null
			: 'isCorrect' in viewerSubmission
				? toEvaluatedViewerSubmissionView(viewerSubmission)
				: toViewerSubmissionView(viewerSubmission),
	}
}

export function isSameGameViewerView(
	left: GameViewerView | undefined,
	right: GameViewerView,
): boolean {
	if (
		!left ||
		left.gameId !== right.gameId ||
		left.viewerScore !== right.viewerScore ||
		left.viewerCorrectCount !== right.viewerCorrectCount ||
		left.viewerRank !== right.viewerRank
	) {
		return false
	}

	const leftSubmission = left.viewerSubmission
	const rightSubmission = right.viewerSubmission
	if (!leftSubmission || !rightSubmission) {
		return leftSubmission === rightSubmission
	}

	const leftEvaluated = 'isCorrect' in leftSubmission
	const rightEvaluated = 'isCorrect' in rightSubmission
	if (leftEvaluated !== rightEvaluated) {
		return false
	}
	if (leftEvaluated && rightEvaluated) {
		return (
			leftSubmission.countryId === rightSubmission.countryId &&
			leftSubmission.submittedAt === rightSubmission.submittedAt &&
			leftSubmission.isCorrect === rightSubmission.isCorrect &&
			leftSubmission.scoreAwarded === rightSubmission.scoreAwarded
		)
	}

	return (
		leftSubmission.countryId === rightSubmission.countryId &&
		leftSubmission.submittedAt === rightSubmission.submittedAt
	)
}

export function toGameHostDetail(
	state: GameState,
	leaderboard: GameLeaderboardEntry[],
): GameHostDetail | null {
	switch (state.phase) {
		case 'open':
			return {
				gameId: state.gameId,
				phase: 'open',
				participants: toOpenHostParticipants(state, leaderboard),
			}

		case 'revealed':
		case 'leaderboard':
			return {
				gameId: state.gameId,
				phase: state.phase,
				participants: toEvaluatedHostParticipants(state, leaderboard),
			}

		case 'completed':
			return null
	}
}

export function receivesHostDetail(
	state: RoomState,
	memberId: MemberId,
): boolean {
	return state.roomMode === 'classroom' && memberId === state.hostId
}

export function toRoomSync(
	state: RoomState,
	revision: number,
	viewerMemberId: MemberId,
): RoomSync | undefined {
	if (!getMember(state, viewerMemberId)) {
		return undefined
	}

	const leaderboard = getRoomLeaderboard(state)
	const sync: RoomSync = {
		revision,
		shared: toRoomSharedView(state, leaderboard),
		members: toVisibleMembers(state),
		game: null,
		lastGameResult: null,
		viewer: null,
		hostDetail: null,
	}

	if (state.phase === 'finished') {
		sync.lastGameResult = state.lastGameResult
	}

	if (state.phase === 'active') {
		const game = state.activeGame
		sync.game = toRoomGameInfo(game)
		if (receivesHostDetail(state, viewerMemberId)) {
			sync.hostDetail = toGameHostDetail(game, leaderboard ?? [])
		} else {
			sync.viewer = toGameViewerView(
				game,
				viewerMemberId,
				leaderboard?.find(
					entry => entry.participantId === viewerMemberId,
				) ?? null,
			)
		}
	}

	return sync
}

export function createRoomSyncState(sync: RoomSync): RoomSyncState {
	return {
		sync,
		pendingViewer: null,
		pendingHostDetail: null,
		outOfSync: false,
	}
}

export function applyRoomSyncUpdate(
	state: RoomSyncState,
	update: RoomSyncUpdate,
): RoomSyncState {
	if (update.revision <= state.sync.revision) {
		return state
	}
	if (update.revision !== state.sync.revision + 1) {
		return { ...state, outOfSync: true }
	}

	const { pendingViewer, pendingHostDetail } = state

	return {
		sync: {
			revision: update.revision,
			shared: update.shared,
			members: update.members ?? state.sync.members,
			game: update.game ?? state.sync.game,
			lastGameResult: update.lastGameResult ?? state.sync.lastGameResult,
			viewer:
				pendingViewer?.revision === update.revision
					? pendingViewer.viewer
					: state.sync.viewer,
			hostDetail:
				pendingHostDetail?.revision === update.revision
					? pendingHostDetail.hostDetail
					: state.sync.hostDetail,
		},
		pendingViewer: null,
		pendingHostDetail: null,
		outOfSync: false,
	}
}

export function applyRoomSyncViewerUpdate(
	state: RoomSyncState,
	update: RoomSyncViewerUpdate,
): RoomSyncState {
	return update.revision > state.sync.revision
		? { ...state, pendingViewer: update }
		: state
}

export function applyRoomSyncHostDetailUpdate(
	state: RoomSyncState,
	update: RoomSyncHostDetailUpdate,
): RoomSyncState {
	return update.revision > state.sync.revision
		? { ...state, pendingHostDetail: update }
		: state
}

function composeGameParticipantView(
	shared: GameSharedView,
	game: RoomGameInfo,
	viewerPart: GameViewerView | null,
	viewerMemberId: MemberId,
): GameParticipantView {
	const viewer = viewerPart?.gameId === shared.gameId ? viewerPart : null
	const submission = viewer?.viewerSubmission ?? null
	const base = {
		gameId: shared.gameId,
		viewerParticipantId: viewerMemberId,
		questionCount: game.questionCount,
		currentQuestionNumber: shared.currentQuestionNumber,
		scope: game.scope,
		eligibleCountryIds: game.eligibleCountryIds,
		participantCount: game.participantCount,
		viewerScore: viewer?.viewerScore ?? 0,
		viewerCorrectCount: viewer?.viewerCorrectCount ?? 0,
		viewerRank: viewer?.viewerRank ?? null,
	}

	switch (shared.phase) {
		case 'open':
			return {
				...base,
				phase: 'open',
				leaderboard: null,
				startedAt: shared.startedAt,
				deadlineAt: shared.deadlineAt,
				answeredCount: shared.answeredCount,
				questionCountryId: shared.questionCountryId,
				viewerSubmission:
					submission && !('isCorrect' in submission) ? submission : null,
			}

		case 'revealed':
			return {
				...base,
				phase: 'revealed',
				leaderboard: null,
				startedAt: shared.startedAt,
				revealedAt: shared.revealedAt,
				deadlineAt: shared.deadlineAt,
				answeredCount: shared.answeredCount,
				questionCountryId: shared.questionCountryId,
				correctCountryId: shared.correctCountryId,
				viewerSubmission:
					submission && 'isCorrect' in submission ? submission : null,
			}

		case 'leaderboard':
			return {
				...base,
				phase: 'leaderboard',
				leaderboard: shared.leaderboard,
				startedAt: shared.startedAt,
				revealedAt: shared.revealedAt,
				leaderboardShownAt: shared.leaderboardShownAt,
				deadlineAt: shared.deadlineAt,
				answeredCount: shared.answeredCount,
				questionCountryId: shared.questionCountryId,
				correctCountryId: shared.correctCountryId,
				viewerSubmission:
					submission && 'isCorrect' in submission ? submission : null,
			}

		case 'completed':
			return {
				...base,
				phase: 'completed',
				result: shared.result,
				leaderboard: shared.leaderboard,
			}
	}
}

function composeGameHostView(
	shared: GameSharedView,
	game: RoomGameInfo,
	hostDetail: GameHostDetail | null,
	viewerMemberId: MemberId,
): GameHostView {
	const detail = hostDetail?.gameId === shared.gameId ? hostDetail : null
	const base = {
		gameId: shared.gameId,
		viewerParticipantId: viewerMemberId,
		questionCount: game.questionCount,
		currentQuestionNumber: shared.currentQuestionNumber,
		scope: game.scope,
		participantCount: game.participantCount,
	}

	switch (shared.phase) {
		case 'open':
			return {
				...base,
				phase: 'open',
				startedAt: shared.startedAt,
				deadlineAt: shared.deadlineAt,
				answeredCount: shared.answeredCount,
				questionCountryId: shared.questionCountryId,
				participants: detail?.phase === 'open' ? detail.participants : [],
			}

		case 'revealed':
		case 'leaderboard':
			return {
				...base,
				phase: shared.phase,
				startedAt: shared.startedAt,
				revealedAt: shared.revealedAt,
				deadlineAt: shared.deadlineAt,
				answeredCount: shared.answeredCount,
				questionCountryId: shared.questionCountryId,
				correctCountryId: shared.correctCountryId,
				participants:
					detail && detail.phase !== 'open' ? detail.participants : [],
			}

		case 'completed':
			return {
				...base,
				phase: 'completed',
				result: shared.result,
			}
	}
}

function getComposeBase(sync: RoomSync, viewerMemberId: MemberId) {
	const viewer = sync.members.find(
		member => member.memberId === viewerMemberId,
	)
	if (!viewer) {
		return undefined
	}

	const { shared } = sync
	return {
		roomId: shared.roomId,
		roomCode: shared.roomCode,
		hostId: shared.hostId,
		viewerMemberId,
		viewerRole: viewer.role,
		createdAt: shared.createdAt,
		members: sync.members,
		connectedMemberCount: shared.connectedMemberCount,
		gameHistoryCount: shared.gameHistoryCount,
	}
}

function getGameInfo(sync: RoomSync, gameId: string): RoomGameInfo | undefined {
	return sync.game?.gameId === gameId ? sync.game : undefined
}

function getViewerLeaderboardEntry(
	result: GameResult,
	viewerMemberId: MemberId,
): GameLeaderboardEntry | null {
	return (
		result.leaderboard.find(
			entry => entry.participantId === viewerMemberId,
		) ?? null
	)
}

export function composePlayerRoomView(
	sync: RoomSync,
	viewerMemberId: MemberId,
): RoomPlayerView | undefined {
	const base = getComposeBase(sync, viewerMemberId)
	if (base?.viewerRole !== 'player') {
		return undefined
	}

	const { shared } = sync
	const playerBase = {
		...base,
		viewerRole: 'player' as const,
		roomMode: shared.roomMode,
	}

	switch (shared.phase) {
		case 'lobby':
			return {
				...playerBase,
				phase: 'lobby',
				activeGame: null,
				lastGameResult: null,
			}

		case 'active': {
			const game = getGameInfo(sync, shared.activeGame.gameId)
			if (!game) {
				return undefined
			}
			return {
				...playerBase,
				phase: 'active',
				activeGame: composeGameParticipantView(
					shared.activeGame,
					game,
					sync.viewer,
					viewerMemberId,
				),
				lastGameResult: null,
			}
		}

		case 'finished':
			if (!sync.lastGameResult) {
				return undefined
			}
			return {
				...playerBase,
				phase: 'finished',
				activeGame: null,
				finishedAt: shared.finishedAt,
				lastGameResult: sync.lastGameResult,
				viewerLeaderboardEntry: getViewerLeaderboardEntry(
					sync.lastGameResult,
					viewerMemberId,
				),
			}
	}
}

function composeGroupHostRoomView(
	sync: RoomSync,
	base: NonNullable<ReturnType<typeof getComposeBase>>,
): GroupHostRoomView | undefined {
	const { shared } = sync
	const hostBase = {
		...base,
		viewerRole: 'host' as const,
		roomMode: 'group' as const,
	}

	switch (shared.phase) {
		case 'lobby':
			return {
				...hostBase,
				phase: 'lobby',
				activeGame: null,
				lastGameResult: null,
			}

		case 'active': {
			const game = getGameInfo(sync, shared.activeGame.gameId)
			if (!game) {
				return undefined
			}
			return {
				...hostBase,
				phase: 'active',
				activeGame: composeGameParticipantView(
					shared.activeGame,
					game,
					sync.viewer,
					base.viewerMemberId,
				),
				lastGameResult: null,
			}
		}

		case 'finished':
			if (!sync.lastGameResult) {
				return undefined
			}
			return {
				...hostBase,
				phase: 'finished',
				activeGame: null,
				finishedAt: shared.finishedAt,
				lastGameResult: sync.lastGameResult,
				viewerLeaderboardEntry: getViewerLeaderboardEntry(
					sync.lastGameResult,
					base.viewerMemberId,
				),
			}
	}
}

function composeClassroomHostRoomView(
	sync: RoomSync,
	base: NonNullable<ReturnType<typeof getComposeBase>>,
): ClassroomHostRoomView | undefined {
	const { shared } = sync
	const hostBase = {
		...base,
		viewerRole: 'host' as const,
		roomMode: 'classroom' as const,
	}

	switch (shared.phase) {
		case 'lobby':
			return {
				...hostBase,
				phase: 'lobby',
				activeGame: null,
				lastGameResult: null,
			}

		case 'active': {
			const game = getGameInfo(sync, shared.activeGame.gameId)
			if (!game) {
				return undefined
			}
			return {
				...hostBase,
				phase: 'active',
				activeGame: composeGameHostView(
					shared.activeGame,
					game,
					sync.hostDetail,
					base.viewerMemberId,
				),
				lastGameResult: null,
			}
		}

		case 'finished':
			if (!sync.lastGameResult) {
				return undefined
			}
			return {
				...hostBase,
				phase: 'finished',
				activeGame: null,
				finishedAt: shared.finishedAt,
				lastGameResult: sync.lastGameResult,
			}
	}
}

export function composeHostRoomView(
	sync: RoomSync,
	viewerMemberId: MemberId,
): RoomHostView | undefined {
	const base = getComposeBase(sync, viewerMemberId)
	if (base?.viewerRole !== 'host') {
		return undefined
	}

	return sync.shared.roomMode === 'group'
		? composeGroupHostRoomView(sync, base)
		: composeClassroomHostRoomView(sync, base)
}
