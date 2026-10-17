import type { GameLeaderboardEntry, GameResult } from '../game/types'
import {
	toGameHostView,
	toGameParticipantView,
	type GameHostView,
	type GameParticipantView,
} from '../game/visibility'
import {
	getConnectedMemberCount,
	getMember,
	getMembers,
	isRoomInGroupMode,
} from './selectors'
import type {
	MemberId,
	RoomMemberRole,
	RoomMode,
	RoomPhase,
	RoomState,
} from './types'

export interface VisibleMemberInfo {
	memberId: MemberId
	name: string
	role: RoomMemberRole
	connected: boolean
	isHost: boolean
}

interface RoomViewBase {
	roomId: string
	roomCode: string
	roomMode: RoomMode
	phase: RoomPhase
	hostId: MemberId
	viewerMemberId: MemberId
	viewerRole: RoomMemberRole
	createdAt: number
	members: VisibleMemberInfo[]
	connectedMemberCount: number
	gameHistoryCount: number
}

interface RoomPlayerViewBase extends RoomViewBase {
	viewerRole: 'player'
}

export interface RoomPlayerLobbyView extends RoomPlayerViewBase {
	phase: 'lobby'
	activeGame: null
	lastGameResult: null
}

export interface RoomPlayerActiveView extends RoomPlayerViewBase {
	phase: 'active'
	activeGame: GameParticipantView
	lastGameResult: null
}

export interface RoomPlayerFinishedView extends RoomPlayerViewBase {
	phase: 'finished'
	activeGame: null
	finishedAt: number
	lastGameResult: GameResult
	viewerLeaderboardEntry: GameLeaderboardEntry | null
}

export type RoomPlayerView =
	RoomPlayerLobbyView | RoomPlayerActiveView | RoomPlayerFinishedView

interface RoomHostViewBase extends RoomViewBase {
	viewerRole: 'host'
}

interface GroupHostRoomViewBase extends RoomHostViewBase {
	roomMode: 'group'
}

export interface GroupHostRoomLobbyView extends GroupHostRoomViewBase {
	phase: 'lobby'
	activeGame: null
	lastGameResult: null
}

export interface GroupHostRoomActiveView extends GroupHostRoomViewBase {
	phase: 'active'
	activeGame: GameParticipantView
	lastGameResult: null
}

export interface GroupHostRoomFinishedView extends GroupHostRoomViewBase {
	phase: 'finished'
	activeGame: null
	finishedAt: number
	lastGameResult: GameResult
	viewerLeaderboardEntry: GameLeaderboardEntry | null
}

export type GroupHostRoomView =
	GroupHostRoomLobbyView | GroupHostRoomActiveView | GroupHostRoomFinishedView

interface ClassroomHostRoomViewBase extends RoomHostViewBase {
	roomMode: 'classroom'
}

export interface ClassroomHostRoomLobbyView extends ClassroomHostRoomViewBase {
	phase: 'lobby'
	activeGame: null
	lastGameResult: null
}

export interface ClassroomHostRoomActiveView extends ClassroomHostRoomViewBase {
	phase: 'active'
	activeGame: GameHostView
	lastGameResult: null
}

export interface ClassroomHostRoomFinishedView extends ClassroomHostRoomViewBase {
	phase: 'finished'
	activeGame: null
	finishedAt: number
	lastGameResult: GameResult
}

export type ClassroomHostRoomView =
	| ClassroomHostRoomActiveView
	| ClassroomHostRoomLobbyView
	| ClassroomHostRoomFinishedView

export type RoomView =
	ClassroomHostRoomView | GroupHostRoomView | RoomPlayerView
export type ClassroomView = RoomPlayerView | ClassroomHostRoomView
export type GroupRoomView = RoomPlayerView | GroupHostRoomView

export type RoomHostView = GroupHostRoomView | ClassroomHostRoomView

export type RoomFinishedView =
	| ClassroomHostRoomFinishedView
	| GroupHostRoomFinishedView
	| RoomPlayerFinishedView

function toVisibleMembers(state: RoomState): VisibleMemberInfo[] {
	return getMembers(state).map(member => ({
		memberId: member.id,
		name: member.name,
		role: member.role,
		connected: member.connected,
		isHost: member.id === state.hostId,
	}))
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

function getRoomViewBase(
	state: RoomState,
	viewerMemberId: MemberId,
): RoomViewBase | undefined {
	const viewer = getMember(state, viewerMemberId)
	if (!viewer) {
		return undefined
	}

	return {
		roomId: state.roomId,
		roomCode: state.roomCode,
		roomMode: state.roomMode,
		phase: state.phase,
		hostId: state.hostId,
		viewerMemberId,
		viewerRole: viewer.role,
		createdAt: state.createdAt,
		members: toVisibleMembers(state),
		connectedMemberCount: getConnectedMemberCount(state),
		gameHistoryCount: state.gameHistory.length,
	}
}

function getGroupHostRoomViewBase(
	state: RoomState,
	viewerMemberId: MemberId,
): GroupHostRoomViewBase | undefined {
	const base = getRoomViewBase(state, viewerMemberId)
	return base?.viewerRole === 'host' && base?.roomMode === 'group'
		? {
				...base,
				viewerRole: 'host',
				roomMode: 'group',
			}
		: undefined
}

export function toGroupHostRoomView(
	state: RoomState,
	viewerMemberId: MemberId,
): GroupHostRoomView | undefined {
	const base = getGroupHostRoomViewBase(state, viewerMemberId)
	if (!base) {
		return undefined
	}

	switch (state.phase) {
		case 'lobby':
			return {
				...base,
				phase: 'lobby',
				activeGame: null,
				lastGameResult: null,
			}

		case 'active':
			return {
				...base,
				phase: 'active',
				activeGame: toGameParticipantView(state.activeGame, viewerMemberId),
				lastGameResult: null,
			}

		case 'finished':
			return {
				...base,
				phase: 'finished',
				activeGame: null,
				finishedAt: state.finishedAt,
				lastGameResult: state.lastGameResult,
				viewerLeaderboardEntry: getViewerLeaderboardEntry(
					state.lastGameResult,
					viewerMemberId,
				),
			}
	}
}

function getClassroomHostRoomViewBase(
	state: RoomState,
	viewerMemberId: MemberId,
): ClassroomHostRoomViewBase | undefined {
	const base = getRoomViewBase(state, viewerMemberId)
	return base?.viewerRole === 'host' && base?.roomMode === 'classroom'
		? {
				...base,
				viewerRole: 'host',
				roomMode: 'classroom',
			}
		: undefined
}

export function toClassroomHostRoomView(
	state: RoomState,
	viewerMemberId: MemberId,
): ClassroomHostRoomView | undefined {
	const base = getClassroomHostRoomViewBase(state, viewerMemberId)
	if (!base) {
		return undefined
	}

	switch (state.phase) {
		case 'lobby':
			return {
				...base,
				phase: 'lobby',
				activeGame: null,
				lastGameResult: null,
			}

		case 'active':
			return {
				...base,
				phase: 'active',
				activeGame: toGameHostView(state.activeGame, viewerMemberId),
				lastGameResult: null,
			}

		case 'finished':
			return {
				...base,
				phase: 'finished',
				activeGame: null,
				finishedAt: state.finishedAt,
				lastGameResult: state.lastGameResult,
			}
	}
}

export function toHostRoomView(
	state: RoomState,
	viewerMemberId: MemberId,
): RoomHostView | undefined {
	return isRoomInGroupMode(state)
		? toGroupHostRoomView(state, viewerMemberId)
		: toClassroomHostRoomView(state, viewerMemberId)
}

function getPlayerRoomViewBase(
	state: RoomState,
	viewerMemberId: MemberId,
): RoomPlayerViewBase | undefined {
	const base = getRoomViewBase(state, viewerMemberId)
	return base?.viewerRole === 'player'
		? {
				...base,
				viewerRole: 'player',
			}
		: undefined
}

export function toPlayerRoomView(
	state: RoomState,
	viewerMemberId: MemberId,
): RoomPlayerView | undefined {
	const base = getPlayerRoomViewBase(state, viewerMemberId)
	if (!base) {
		return undefined
	}

	switch (state.phase) {
		case 'lobby':
			return {
				...base,
				phase: 'lobby',
				activeGame: null,
				lastGameResult: null,
			}

		case 'active':
			return {
				...base,
				phase: 'active',
				activeGame: toGameParticipantView(state.activeGame, viewerMemberId),
				lastGameResult: null,
			}

		case 'finished':
			return {
				...base,
				phase: 'finished',
				activeGame: null,
				finishedAt: state.finishedAt,
				lastGameResult: state.lastGameResult,
				viewerLeaderboardEntry: getViewerLeaderboardEntry(
					state.lastGameResult,
					viewerMemberId,
				),
			}
	}
}
