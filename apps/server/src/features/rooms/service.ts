import { err, ok, type CountryPool, type Result } from '@georally/game-domain'
import type {
	CreateRoomResponse,
	EmptyAckData,
	JoinRoomResponse,
	LookupRoomResponse,
	ResumeHostRoomResponse,
	ResumePlayerRoomResponse,
	RoomClosedEvent,
	RoomProtocolError,
	SubmitAnswerResponse,
} from '@georally/game-protocol'

import {
	advanceActiveRoomGame,
	advanceActiveRoomGameRound,
	getNextActiveRoomGameAdvanceAt,
	revealActiveRoomGameRound,
	startRoomGame,
	submitRoomGameAnswer,
} from '@georally/game-domain/multiplayer'
import {
	applyGameCommand,
	getAnsweredParticipantCount,
	getGameParticipantCount,
	getGameQuestionCount,
	type GameConfig,
} from '@georally/game-domain/multiplayer/game'
import {
	applyRoomCommand,
	createRoom,
	toPlayerRoomView,
	type MemberId,
	type RoomHostView,
	type RoomId,
	type RoomMemberRole,
	type RoomMode,
	type RoomPlayerView,
	type RoomState,
	toHostRoomView,
	getRoomExpireDueAt,
	type RoomExpireTTLConfig,
	getRoomOccupancy,
	getConnectedMemberCount,
	type RoomPhase,
} from '@georally/game-domain/multiplayer/room'
import {
	createGameId,
	createMemberId,
	createMemberSessionToken,
	createRoomCode,
	createRoomId,
} from './ids.js'
import type { MemberSessionRecord, RoomsRepository } from './repository.js'
import type { BoundServiceResponse, MemberSessionToken } from './types.js'
import { createSilentLogger, type Logger } from '../../observability/logger.js'

type ServiceResult<T> = Result<T, RoomProtocolError>

interface RoomUpdateOptions {
	excludeMemberId?: MemberId
}

interface RoomsServiceHooks {
	onRoomUpdated: (roomId: RoomId, options?: RoomUpdateOptions) => void
	onRoomClosed: (roomId: RoomId, reason: RoomClosedEvent['reason']) => void
}

export interface RoomsServiceOptions {
	countryPool: CountryPool
	repository: RoomsRepository
	revealDurationMs: number
	leaderboardDurationMs: number
	hooks: RoomsServiceHooks
	roomCapacityLimit: number
	roomExpireTTL: RoomExpireTTLConfig
	now?: () => number
	logger?: Logger
}

export interface CreateRoomInput {
	hostName: string
	roomMode: RoomMode
}

export interface JoinRoomInput {
	roomCode: string
	memberName: string
	socketId: string
}

export interface ResumeHostRoomInput {
	memberSessionToken: MemberSessionToken
	socketId: string
}
export interface ResumePlayerRoomInput {
	memberSessionToken: MemberSessionToken
	socketId: string
}

export interface StartGameInput {
	memberSessionToken: MemberSessionToken
	gameConfig: GameConfig
}

export interface RevealRoundInput {
	memberSessionToken: MemberSessionToken
}

export interface AdvanceRoundInput {
	memberSessionToken: MemberSessionToken
}

export interface SubmitAnswerInput {
	memberSessionToken: MemberSessionToken
	countryId: string
}

export interface ReturnToLobbyInput {
	memberSessionToken: MemberSessionToken
}

export interface TerminateRoomInput {
	memberSessionToken: MemberSessionToken
}

export class RoomsService {
	private readonly countryPool: CountryPool
	private readonly repository: RoomsRepository
	private readonly revealDurationMs: number
	private readonly leaderboardDurationMs: number
	private readonly hooks: RoomsServiceHooks
	private readonly roomCapacityLimit: number
	private readonly now: () => number
	private readonly roomExpireTTL: RoomExpireTTLConfig
	private readonly logger: Logger

	constructor(options: RoomsServiceOptions) {
		this.countryPool = options.countryPool
		this.repository = options.repository
		this.revealDurationMs = options.revealDurationMs
		this.leaderboardDurationMs = options.leaderboardDurationMs
		this.hooks = options.hooks
		this.roomCapacityLimit = options.roomCapacityLimit
		this.roomExpireTTL = options.roomExpireTTL
		this.now = options.now ?? Date.now
		this.logger = options.logger ?? createSilentLogger()
	}

	getHealthSnapshot() {
		const roomsByPhase: Record<RoomPhase, number> = {
			lobby: 0,
			active: 0,
			finished: 0,
		}
		for (const context of this.repository.listRooms()) {
			roomsByPhase[context.state.phase] += 1
		}

		return {
			roomCount: this.repository.getRoomCount(),
			connectedSessionCount: this.repository.getConnectedSessionCount(),
			roomsByPhase,
		}
	}

	lookupRoom(roomCode: string): LookupRoomResponse {
		const context = this.repository.getRoomByCode(roomCode)
		if (!context) {
			return {
				exists: false,
				roomCode,
			}
		}

		const host = context.state.membersById[context.state.hostId]

		return {
			exists: true,
			roomCode: context.state.roomCode,
			phase: context.state.phase,
			joinable: context.state.phase === 'lobby',
			memberCount: context.state.memberOrder.length,
			hostName: host?.name ?? 'Host',
		}
	}

	createRoom(input: CreateRoomInput): ServiceResult<CreateRoomResponse> {
		const roomId = createRoomId()
		const roomCode = createRoomCode(
			code => !this.repository.hasRoomCode(code),
		)
		const hostId = createMemberId()
		const roomResult = createRoom({
			roomId,
			roomCode,
			roomMode: input.roomMode,
			hostId,
			hostName: input.hostName,
			now: this.now(),
		})

		if (!roomResult.ok) {
			return roomResult
		}

		this.repository.createRoom(roomResult.value)

		const hostSessionToken = createMemberSessionToken()
		this.repository.createMemberSession({
			role: 'host',
			token: hostSessionToken,
			roomId,
			memberId: hostId,
			socketId: null,
		})
		this.rescheduleRoomExpire(roomId)
		this.getRoomLogger(roomResult.value).info('room_created')

		return ok({
			role: 'host',
			roomId,
			roomCode,
			memberId: hostId,
			memberSessionToken: hostSessionToken,
		})
	}

	joinRoom(
		input: JoinRoomInput,
	): ServiceResult<BoundServiceResponse<JoinRoomResponse>> {
		const context = this.repository.getRoomByCode(input.roomCode)
		if (!context) {
			return err({
				code: 'room_not_found',
			})
		}

		if (getRoomOccupancy(context.state) >= this.roomCapacityLimit) {
			return err({
				code: 'room_participant_capacity_limit_exceeded',
			})
		}

		const memberId = createMemberId()
		const nextState = applyRoomCommand(context.state, {
			type: 'JOIN_MEMBER',
			id: memberId,
			name: input.memberName,
			now: this.now(),
		})

		if (!nextState.ok) {
			return nextState
		}

		this.commitRoomState(context.state.roomId, nextState.value, {
			excludeMemberId: memberId,
		})

		const memberSessionToken = createMemberSessionToken()
		this.repository.createMemberSession({
			role: 'player',
			token: memberSessionToken,
			roomId: nextState.value.roomId,
			memberId,
			socketId: input.socketId,
		})

		const snapshot = this.buildRoomPlayerSnapshot(nextState.value, memberId)
		if (!snapshot.ok) {
			return snapshot
		}

		return ok({
			response: {
				role: 'player',
				roomId: nextState.value.roomId,
				roomCode: nextState.value.roomCode,
				memberId,
				memberSessionToken,
				snapshot: snapshot.value,
			},
		})
	}

	resumeHostRoom(
		input: ResumeHostRoomInput,
	): ServiceResult<BoundServiceResponse<ResumeHostRoomResponse>> {
		const resumed = this.resumeMember(input.memberSessionToken, 'host')
		if (!resumed.ok) {
			return resumed
		}

		const { state, memberId } = resumed.value
		const replacedSocketId = this.repository.bindSocketToSession(
			input.memberSessionToken,
			input.socketId,
		)

		const snapshot = this.buildHostRoomSnapshot(state, memberId)
		if (!snapshot.ok) {
			return snapshot
		}

		return ok({
			response: {
				roomId: state.roomId,
				memberId,
				snapshot: snapshot.value,
			},
			replacedSocketId,
		})
	}

	resumePlayerRoom(
		input: ResumePlayerRoomInput,
	): ServiceResult<BoundServiceResponse<ResumePlayerRoomResponse>> {
		const resumed = this.resumeMember(input.memberSessionToken, 'player')
		if (!resumed.ok) {
			return resumed
		}

		const { state, memberId } = resumed.value
		const replacedSocketId = this.repository.bindSocketToSession(
			input.memberSessionToken,
			input.socketId,
		)

		const snapshot = this.buildRoomPlayerSnapshot(state, memberId)
		if (!snapshot.ok) {
			return snapshot
		}

		return ok({
			response: {
				roomId: state.roomId,
				memberId,
				snapshot: snapshot.value,
			},
			replacedSocketId,
		})
	}

	returnToLobby(input: ReturnToLobbyInput): ServiceResult<EmptyAckData> {
		const sessionContext = this.getMemberSessionContext(
			input.memberSessionToken,
		)

		if (!sessionContext.ok) {
			return sessionContext
		}

		const nextStateResult = applyRoomCommand(sessionContext.value.state, {
			type: 'RETURN_TO_LOBBY',
			actorId: sessionContext.value.memberSession.memberId,
			now: this.now(),
		})

		if (!nextStateResult.ok) {
			return nextStateResult
		}

		this.commitRoomState(
			sessionContext.value.state.roomId,
			nextStateResult.value,
		)

		return ok({})
	}

	terminateRoom(input: TerminateRoomInput): ServiceResult<EmptyAckData> {
		const sessionContext = this.getMemberSessionContext(
			input.memberSessionToken,
		)

		if (!sessionContext.ok) {
			return sessionContext
		}

		const { memberSession, state } = sessionContext.value
		if (
			memberSession.role !== 'host' ||
			memberSession.memberId !== state.hostId
		) {
			return err({ code: 'only_host_can_manage_room' })
		}

		this.closeRoom(state.roomId, 'host_terminated')

		return ok({})
	}

	startGame(input: StartGameInput): ServiceResult<EmptyAckData> {
		const sessionContext = this.getMemberSessionContext(
			input.memberSessionToken,
		)
		if (!sessionContext.ok) {
			return sessionContext
		}

		const nextState = startRoomGame({
			gameId: createGameId(),
			actorId: sessionContext.value.memberSession.memberId,
			room: sessionContext.value.state,
			config: input.gameConfig,
			countryPool: this.countryPool,
			now: this.now(),
		})
		if (!nextState.ok) {
			return nextState
		}

		this.commitRoomState(sessionContext.value.state.roomId, nextState.value)

		if (nextState.value.phase === 'active') {
			const { activeGame } = nextState.value
			this.getRoomLogger(nextState.value).info(
				{
					gameId: activeGame.gameId,
					participantCount: getGameParticipantCount(activeGame),
					questionCount: getGameQuestionCount(activeGame),
				},
				'game_started',
			)
		}

		return ok({})
	}

	revealGameRound(input: RevealRoundInput): ServiceResult<EmptyAckData> {
		const sessionContext = this.getMemberSessionContext(
			input.memberSessionToken,
		)
		if (!sessionContext.ok) {
			return sessionContext
		}

		const { memberSession, state: room } = sessionContext.value
		const revealedResult = revealActiveRoomGameRound(
			room,
			memberSession.memberId,
			this.now(),
		)

		if (!revealedResult.ok) {
			return revealedResult
		}

		this.commitRoomState(room.roomId, revealedResult.value)

		return ok({})
	}

	advanceGameRound(input: AdvanceRoundInput): ServiceResult<EmptyAckData> {
		const sessionContext = this.getMemberSessionContext(
			input.memberSessionToken,
		)
		if (!sessionContext.ok) {
			return sessionContext
		}
		const { memberSession, state: room } = sessionContext.value
		const advancedResult = advanceActiveRoomGameRound(
			room,
			this.now(),
			memberSession.memberId,
		)

		if (!advancedResult.ok) {
			return advancedResult
		}

		this.commitRoomState(room.roomId, advancedResult.value)

		return ok({})
	}

	submitAnswer(input: SubmitAnswerInput): ServiceResult<SubmitAnswerResponse> {
		const sessionContext = this.getMemberSessionContext(
			input.memberSessionToken,
		)
		if (!sessionContext.ok) {
			return sessionContext
		}
		const { memberSession, state: room } = sessionContext.value

		const acceptedAt = this.now()
		const submittedState = submitRoomGameAnswer({
			room,
			memberId: memberSession.memberId,
			countryId: input.countryId,
			now: acceptedAt,
		})

		if (!submittedState.ok) {
			return submittedState
		}

		let nextState = submittedState.value
		if (
			this.shouldRevealImmediately(nextState) &&
			nextState.phase === 'active'
		) {
			const revealedGameState = applyGameCommand(nextState.activeGame, {
				type: 'REVEAL_ROUND',
				now: acceptedAt,
			})

			if (revealedGameState.ok) {
				nextState = {
					...nextState,
					activeGame: revealedGameState.value,
				}
			}
		}

		this.commitRoomState(room.roomId, nextState)

		return ok({
			acceptedAt,
		})
	}

	disconnectSocket(socketId: string): void {
		const session = this.repository.unbindSocketFromSession(socketId)
		if (!session) {
			return
		}

		const context = this.repository.getRoomById(session.roomId)
		if (!context) {
			return
		}

		const member = context.state.membersById[session.memberId]
		if (!member || !member.connected) {
			return
		}

		const disconnectedState = applyRoomCommand(context.state, {
			type: 'DISCONNECT_MEMBER',
			id: session.memberId,
			now: this.now(),
		})

		if (!disconnectedState.ok) {
			return
		}

		this.commitRoomState(context.state.roomId, disconnectedState.value)
	}

	shutdown(reason: RoomClosedEvent['reason'] = 'server_shutdown'): void {
		for (const context of this.repository.listRooms()) {
			this.closeRoom(context.state.roomId, reason)
		}
	}

	closeRoom(roomId: RoomId, reason: RoomClosedEvent['reason']): boolean {
		const context = this.repository.getRoomById(roomId)
		if (!context) {
			return false
		}

		this.hooks.onRoomClosed(context.state.roomId, reason)
		this.repository.deleteRoom(context.state.roomId)

		this.getRoomLogger(context.state).info(
			{
				reason,
				phase: context.state.phase,
				memberCount: context.state.memberOrder.length,
				connectedMemberCount: getConnectedMemberCount(context.state),
				ageMs: this.now() - context.state.createdAt,
			},
			'room_closed',
		)

		return true
	}

	private getMemberSessionContext(
		memberSessionToken: MemberSessionToken,
	): ServiceResult<{
		memberSession: MemberSessionRecord
		state: RoomState
	}> {
		const memberSession = this.repository.getMemberSession(memberSessionToken)
		if (!memberSession) {
			return err({
				code: 'member_session_not_found',
			})
		}

		const context = this.repository.getRoomById(memberSession.roomId)
		if (!context) {
			return err({
				code: 'room_not_found',
			})
		}

		return ok({
			memberSession,
			state: context.state,
		})
	}

	private resumeMember(
		memberSessionToken: MemberSessionToken,
		expectedRole: RoomMemberRole,
	): ServiceResult<{ state: RoomState; memberId: MemberId }> {
		const session = this.repository.getMemberSession(memberSessionToken)
		if (!session) {
			return err({ code: 'member_session_not_found' })
		}
		if (session.role !== expectedRole) {
			return err({ code: 'insufficient_permissions' })
		}

		const context = this.repository.getRoomById(session.roomId)
		if (!context) {
			return err({ code: 'room_not_found' })
		}

		const member = context.state.membersById[session.memberId]
		if (!member) {
			return err({ code: 'member_session_not_found' })
		}

		if (member.connected) {
			return ok({ state: context.state, memberId: session.memberId })
		}

		const reconnected = applyRoomCommand(context.state, {
			type: 'RECONNECT_MEMBER',
			id: session.memberId,
			now: this.now(),
		})
		if (!reconnected.ok) {
			return reconnected
		}

		this.commitRoomState(reconnected.value.roomId, reconnected.value, {
			excludeMemberId: session.memberId,
		})

		return ok({ state: reconnected.value, memberId: session.memberId })
	}

	private buildHostRoomSnapshot(
		state: RoomState,
		memberId: MemberId,
	): ServiceResult<RoomHostView> {
		const snapshot = toHostRoomView(state, memberId)

		return snapshot
			? ok(snapshot)
			: err({
					code: 'internal_error',
				})
	}

	private buildRoomPlayerSnapshot(
		state: RoomState,
		memberId: MemberId,
	): ServiceResult<RoomPlayerView> {
		const snapshot = toPlayerRoomView(state, memberId)

		return snapshot
			? ok(snapshot)
			: err({
					code: 'internal_error',
				})
	}

	private getRoomLogger(state: RoomState): Logger {
		return this.logger.child({
			roomId: state.roomId,
			roomMode: state.roomMode,
		})
	}

	private commitRoomState(
		roomId: RoomId,
		nextState: RoomState,
		options: RoomUpdateOptions = {},
	): void {
		const previousPhase = this.repository.getRoomById(roomId)?.state.phase

		this.repository.setRoomState(roomId, nextState)
		this.rescheduleRoomAdvance(roomId)
		this.rescheduleRoomExpire(roomId)
		this.hooks.onRoomUpdated(roomId, options)

		if (previousPhase === 'active' && nextState.phase === 'finished') {
			const { lastGameResult } = nextState
			this.getRoomLogger(nextState).info(
				{
					gameId: lastGameResult.gameId,
					participantCount: lastGameResult.leaderboard.length,
					questionCount: lastGameResult.rounds.length,
					durationMs:
						lastGameResult.finishedAt -
						(lastGameResult.rounds[0]?.startedAt ??
							lastGameResult.finishedAt),
				},
				'game_finished',
			)
		}
	}

	private rescheduleRoomAdvance(roomId: RoomId): void {
		const context = this.repository.getRoomById(roomId)
		if (!context) {
			return
		}

		const dueAt = getNextActiveRoomGameAdvanceAt(context.state, {
			revealDurationMs: this.revealDurationMs,
			leaderboardDurationMs: this.leaderboardDurationMs,
		})

		if (dueAt === null) {
			this.repository.setScheduledRoomAdvance(roomId, null)
			return
		}

		const delayMs = Math.max(0, dueAt - this.now())
		const handle = setTimeout(() => {
			try {
				this.executeScheduledRoomAdvance(roomId, dueAt)
			} catch (error) {
				this.logger.error({ err: error, roomId }, 'room_advance_failed')
			}
		}, delayMs)

		this.repository.setScheduledRoomAdvance(roomId, {
			dueAt,
			handle,
		})
	}

	private executeScheduledRoomAdvance(roomId: RoomId, dueAt: number): void {
		const context = this.repository.getRoomById(roomId)
		if (!context || context.scheduledAdvance?.dueAt !== dueAt) {
			return
		}

		const transitionedState = advanceActiveRoomGame(context.state, this.now())

		if (!transitionedState.ok) {
			this.rescheduleRoomAdvance(roomId)
			return
		}

		this.commitRoomState(roomId, transitionedState.value)
	}

	private rescheduleRoomExpire(roomId: RoomId): void {
		const context = this.repository.getRoomById(roomId)
		if (!context) {
			return
		}

		const dueAt = getRoomExpireDueAt(context.state, this.roomExpireTTL)

		if (dueAt === null) {
			this.repository.setScheduledRoomExpire(roomId, null)
			return
		}

		const ttlMs = Math.max(0, dueAt - this.now())
		const handle = setTimeout(() => {
			try {
				this.executeScheduledRoomExpire(roomId, dueAt)
			} catch (error) {
				this.logger.error({ err: error, roomId }, 'room_expire_failed')
			}
		}, ttlMs)

		this.repository.setScheduledRoomExpire(roomId, {
			dueAt,
			handle,
		})
	}

	private executeScheduledRoomExpire(roomId: RoomId, dueAt: number): void {
		const context = this.repository.getRoomById(roomId)
		if (!context || context.scheduledExpire?.dueAt !== dueAt) {
			return
		}

		this.closeRoom(roomId, 'expired')
	}

	private shouldRevealImmediately(state: RoomState): boolean {
		if (state.phase !== 'active') {
			return false
		}

		if (state.activeGame.phase !== 'open') {
			return false
		}

		const connectedParticipantCount = Object.keys(
			state.activeGame.participantsById,
		).filter(participantId => {
			return state.membersById[participantId]?.connected
		}).length

		if (connectedParticipantCount < 1) {
			return false
		}

		return (
			getAnsweredParticipantCount(state.activeGame) >=
			getGameParticipantCount(state.activeGame)
		)
	}
}
