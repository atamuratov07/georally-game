import type {
	Ack,
	AckCallback,
	RoomProtocolError,
} from '@georally/game-protocol'
import {
	advanceRoundRequestSchema,
	joinRoomRequestSchema,
	resumeHostRoomRequestSchema,
	resumePlayerRoomRequestSchema,
	returnToLobbyRequestSchema,
	revealRoundRequestSchema,
	startGameRequestSchema,
	submitAnswerRequestSchema,
	terminateRoomRequestSchema,
} from '@georally/game-protocol'
import type { ZodType } from 'zod'

import type { RoomMemberRole } from '@georally/game-domain/multiplayer/room'
import type { RoomsService } from './service.js'
import type { GameNamespace, GameSocket } from './types.js'
import type { Result } from '@georally/game-domain'
import type { ProtocolErrorReporter } from '../../observability/protocolErrors.js'

export interface RegisterRoomHandlersOptions {
	namespace: GameNamespace
	roomsService: RoomsService
	reportProtocolError: ProtocolErrorReporter
}

function respondWithError<T>(
	ack: AckCallback<T>,
	error: RoomProtocolError,
): void {
	ack({
		ok: false,
		error,
	})
}

function respondWithSuccess<T>(ack: AckCallback<T>, data: T): void {
	ack({
		ok: true,
		data,
	})
}

function parsePayload<T>(
	schema: ZodType<T>,
	payload: unknown,
): { ok: true; value: T } | { ok: false } {
	const parsed = schema.safeParse(payload)
	if (!parsed.success) {
		return {
			ok: false,
		}
	}

	return {
		ok: true,
		value: parsed.data,
	}
}

function requireAuthenticated(
	socket: GameSocket,
): { ok: true; value: string } | { ok: false } {
	return socket.data.memberSessionToken
		? {
				ok: true,
				value: socket.data.memberSessionToken,
			}
		: {
				ok: false,
			}
}

function bindSocketIdentity(
	socket: GameSocket,
	identity: {
		role: RoomMemberRole
		roomId: string
		memberId: string
		memberSessionToken: string
	},
): void {
	socket.data.roomId = identity.roomId
	socket.data.role = identity.role
	socket.data.memberId = identity.memberId
	socket.data.memberSessionToken = identity.memberSessionToken
}

function clearSocketIdentity(socket: GameSocket): void {
	socket.data.roomId = undefined
	socket.data.memberId = undefined
	socket.data.memberSessionToken = undefined
	socket.data.role = undefined
}

function disconnectReplacedSocket(
	namespace: GameNamespace,
	socketId: string | undefined,
	currentSocketId: string,
): void {
	if (!socketId || socketId === currentSocketId) {
		return
	}

	namespace.sockets.get(socketId)?.disconnect(true)
}

function handleSessionCommand<TPayload, TResult>(
	socket: GameSocket,
	schema: ZodType<TPayload>,
	payload: unknown,
	ack: AckCallback<TResult>,
	run: (
		memberSessionToken: string,
		value: TPayload,
	) => Result<TResult, RoomProtocolError>,
): void {
	const auth = requireAuthenticated(socket)
	if (!auth.ok)
		return respondWithError(ack, {
			code: 'unauthorized',
		})

	const parsed = parsePayload(schema, payload)
	if (!parsed.ok)
		return respondWithError(ack, {
			code: 'invalid_payload',
		})

	const result = run(auth.value, parsed.value)
	if (!result.ok) return respondWithError(ack, result.error)

	respondWithSuccess(ack, result.value)
}

export function registerRoomHandlers({
	namespace,
	roomsService,
	reportProtocolError,
}: RegisterRoomHandlersOptions): void {
	namespace.on('connection', socket => {
		socket.use((packet, next) => {
			const [socketEvent, , ack] = packet
			if (typeof ack !== 'function') {
				reportProtocolError('ack_error', { code: 'invalid_payload' })
				return
			}

			packet[2] = (response: Ack<unknown>) => {
				if (!response.ok) {
					reportProtocolError('ack_error', response.error, {
						socketEvent,
						roomId: socket.data.roomId,
					})
				}
				ack(response)
			}
			next()
		})

		socket.on('room:join', (payload, ack) => {
			const auth = requireAuthenticated(socket)
			if (auth.ok) {
				return respondWithError(ack, {
					code: 'unauthorized',
				})
			}

			const parsed = parsePayload(joinRoomRequestSchema, payload)
			if (!parsed.ok) {
				return respondWithError(ack, {
					code: 'invalid_payload',
				})
			}

			const joinedRoom = roomsService.joinRoom({
				roomCode: parsed.value.roomCode,
				memberName: parsed.value.memberName,
				socketId: socket.id,
			})

			if (!joinedRoom.ok) {
				return respondWithError(ack, joinedRoom.error)
			}

			bindSocketIdentity(socket, joinedRoom.value.response)

			return respondWithSuccess(ack, joinedRoom.value.response)
		})

		socket.on('room:host-resume', (payload, ack) => {
			const parsed = parsePayload(resumeHostRoomRequestSchema, payload)
			if (!parsed.ok) {
				return respondWithError(ack, {
					code: 'invalid_payload',
				})
			}

			const auth = requireAuthenticated(socket)
			if (auth.ok && auth.value !== parsed.value.memberSessionToken) {
				return respondWithError(ack, { code: 'unauthorized' })
			}

			const resumedRoom = roomsService.resumeHostRoom({
				memberSessionToken: parsed.value.memberSessionToken,
				socketId: socket.id,
			})

			if (!resumedRoom.ok) {
				return respondWithError(ack, resumedRoom.error)
			}

			bindSocketIdentity(socket, {
				role: 'host',
				roomId: resumedRoom.value.response.roomId,
				memberId: resumedRoom.value.response.memberId,
				memberSessionToken: parsed.value.memberSessionToken,
			})
			disconnectReplacedSocket(
				namespace,
				resumedRoom.value.replacedSocketId,
				socket.id,
			)

			return respondWithSuccess(ack, resumedRoom.value.response)
		})

		socket.on('room:player-resume', (payload, ack) => {
			const parsed = parsePayload(resumePlayerRoomRequestSchema, payload)
			if (!parsed.ok) {
				return respondWithError(ack, {
					code: 'invalid_payload',
				})
			}

			const auth = requireAuthenticated(socket)
			if (auth.ok && auth.value !== parsed.value.memberSessionToken) {
				return respondWithError(ack, { code: 'unauthorized' })
			}

			const resumedRoom = roomsService.resumePlayerRoom({
				memberSessionToken: parsed.value.memberSessionToken,
				socketId: socket.id,
			})

			if (!resumedRoom.ok) {
				return respondWithError(ack, resumedRoom.error)
			}

			bindSocketIdentity(socket, {
				role: 'player',
				roomId: resumedRoom.value.response.roomId,
				memberId: resumedRoom.value.response.memberId,
				memberSessionToken: parsed.value.memberSessionToken,
			})
			disconnectReplacedSocket(
				namespace,
				resumedRoom.value.replacedSocketId,
				socket.id,
			)

			return respondWithSuccess(ack, resumedRoom.value.response)
		})

		socket.on('room:return-to-lobby', (payload, ack) => {
			handleSessionCommand(
				socket,
				returnToLobbyRequestSchema,
				payload,
				ack,
				token => roomsService.returnToLobby({ memberSessionToken: token }),
			)
		})

		socket.on('room:terminate', (payload, ack) => {
			const auth = requireAuthenticated(socket)
			if (!auth.ok) {
				return respondWithError(ack, { code: 'unauthorized' })
			}

			const parsed = parsePayload(terminateRoomRequestSchema, payload)
			if (!parsed.ok) {
				return respondWithError(ack, {
					code: 'invalid_payload',
				})
			}

			const terminatedRoomResult = roomsService.terminateRoom({
				memberSessionToken: auth.value,
			})

			if (!terminatedRoomResult.ok) {
				return respondWithError(ack, terminatedRoomResult.error)
			}

			clearSocketIdentity(socket)

			return respondWithSuccess(ack, terminatedRoomResult.value)
		})

		socket.on('game:start', (payload, ack) => {
			handleSessionCommand(
				socket,
				startGameRequestSchema,
				payload,
				ack,
				(token, value) =>
					roomsService.startGame({
						memberSessionToken: token,
						gameConfig: value.gameConfig,
					}),
			)
		})

		socket.on('game:reveal-round', (payload, ack) => {
			const auth = requireAuthenticated(socket)
			if (!auth.ok) {
				return respondWithError(ack, {
					code: 'unauthorized',
				})
			}

			const parsed = parsePayload(revealRoundRequestSchema, payload)
			if (!parsed.ok) {
				return respondWithError(ack, {
					code: 'invalid_payload',
				})
			}

			const revealedGameRound = roomsService.revealGameRound({
				memberSessionToken: auth.value,
			})

			if (!revealedGameRound.ok) {
				return respondWithError(ack, revealedGameRound.error)
			}

			return respondWithSuccess(ack, revealedGameRound.value)
		})

		socket.on('game:advance-round', (payload, ack) => {
			const auth = requireAuthenticated(socket)
			if (!auth.ok) {
				return respondWithError(ack, {
					code: 'unauthorized',
				})
			}

			const parsed = parsePayload(advanceRoundRequestSchema, payload)
			if (!parsed.ok) {
				return respondWithError(ack, {
					code: 'invalid_payload',
				})
			}

			const advancedGameRound = roomsService.advanceGameRound({
				memberSessionToken: auth.value,
			})

			if (!advancedGameRound.ok) {
				return respondWithError(ack, advancedGameRound.error)
			}

			return respondWithSuccess(ack, advancedGameRound.value)
		})

		socket.on('game:submit-answer', (payload, ack) => {
			const auth = requireAuthenticated(socket)
			if (!auth.ok) {
				return respondWithError(ack, {
					code: 'unauthorized',
				})
			}

			const parsed = parsePayload(submitAnswerRequestSchema, payload)
			if (!parsed.ok) {
				return respondWithError(ack, {
					code: 'invalid_payload',
				})
			}

			const submittedAnswer = roomsService.submitAnswer({
				memberSessionToken: auth.value,
				countryId: parsed.value.countryId,
			})

			if (!submittedAnswer.ok) {
				return respondWithError(ack, submittedAnswer.error)
			}

			return respondWithSuccess(ack, submittedAnswer.value)
		})

		socket.on('disconnect', () => {
			roomsService.disconnectSocket(socket.id)
			clearSocketIdentity(socket)
		})
	})
}
