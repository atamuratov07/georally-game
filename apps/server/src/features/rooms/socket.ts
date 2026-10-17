import type {
	AckCallback,
	ClientToServerEvents,
	ResumeHostRoomResponse,
	ResumePlayerRoomResponse,
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
import type {
	BoundServiceResponse,
	GameNamespace,
	GameSocket,
	MemberSessionToken,
} from './types.js'
import { err, ok, type Result } from '@georally/game-domain'
import type { Logger } from '../../observability/logger.js'
import type { ProtocolErrorReporter } from '../../observability/protocolErrors.js'

export interface RegisterRoomHandlersOptions {
	namespace: GameNamespace
	roomsService: RoomsService
	reportProtocolError: ProtocolErrorReporter
	logger: Logger
}

type SocketEvent = keyof ClientToServerEvents | 'disconnect'

type CommandResult<T> = Result<T, RoomProtocolError>

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

export function registerRoomHandlers({
	namespace,
	roomsService,
	reportProtocolError,
	logger,
}: RegisterRoomHandlersOptions): void {
	function reportHandlerFailure(
		socket: GameSocket,
		socketEvent: SocketEvent,
		error: unknown,
	): void {
		logger.error(
			{ err: error, socketEvent, roomId: socket.data.roomId },
			'socket_handler_failed',
		)
	}

	function runSocketCommand<TResult>(
		socket: GameSocket,
		socketEvent: SocketEvent,
		ack: AckCallback<TResult>,
		command: () => CommandResult<TResult>,
	): void {
		try {
			const result = command()
			if (!result.ok) {
				reportProtocolError('ack_error', result.error, {
					socketEvent,
					roomId: socket.data.roomId,
				})
				return respondWithError(ack, result.error)
			}

			respondWithSuccess(ack, result.value)
		} catch (error) {
			reportHandlerFailure(socket, socketEvent, error)
			respondWithError(ack, { code: 'internal_error' })
		}
	}

	function handleSessionCommand<TPayload, TResult>(
		socket: GameSocket,
		socketEvent: SocketEvent,
		schema: ZodType<TPayload>,
		payload: unknown,
		ack: AckCallback<TResult>,
		run: (
			memberSessionToken: string,
			value: TPayload,
		) => CommandResult<TResult>,
		onSuccess?: (result: TResult) => void,
	): void {
		runSocketCommand(socket, socketEvent, ack, () => {
			const auth = requireAuthenticated(socket)
			if (!auth.ok) {
				return err({ code: 'unauthorized' })
			}

			const parsed = parsePayload(schema, payload)
			if (!parsed.ok) {
				return err({ code: 'invalid_payload' })
			}

			const result = run(auth.value, parsed.value)
			if (result.ok) {
				onSuccess?.(result.value)
			}

			return result
		})
	}

	function resumeSession<
		TResponse extends ResumeHostRoomResponse | ResumePlayerRoomResponse,
	>(
		socket: GameSocket,
		socketEvent: SocketEvent,
		schema: ZodType<{ memberSessionToken: MemberSessionToken }>,
		payload: unknown,
		ack: AckCallback<TResponse>,
		role: RoomMemberRole,
		resume: (input: {
			memberSessionToken: MemberSessionToken
			socketId: string
		}) => CommandResult<BoundServiceResponse<TResponse>>,
	): void {
		runSocketCommand(socket, socketEvent, ack, () => {
			const parsed = parsePayload(schema, payload)
			if (!parsed.ok) {
				return err({ code: 'invalid_payload' })
			}

			const { memberSessionToken } = parsed.value
			const auth = requireAuthenticated(socket)
			if (auth.ok && auth.value !== memberSessionToken) {
				return err({ code: 'unauthorized' })
			}

			const resumed = resume({ memberSessionToken, socketId: socket.id })
			if (!resumed.ok) {
				return resumed
			}

			bindSocketIdentity(socket, {
				role,
				roomId: resumed.value.response.roomId,
				memberId: resumed.value.response.memberId,
				memberSessionToken,
			})
			disconnectReplacedSocket(
				namespace,
				resumed.value.replacedSocketId,
				socket.id,
			)

			return ok(resumed.value.response)
		})
	}

	namespace.on('connection', socket => {
		socket.use((packet, next) => {
			if (typeof packet[2] !== 'function') {
				reportProtocolError('ack_error', { code: 'invalid_payload' })
				return
			}

			next()
		})

		socket.on('room:join', (payload, ack) => {
			runSocketCommand(socket, 'room:join', ack, () => {
				const auth = requireAuthenticated(socket)
				if (auth.ok) {
					return err({ code: 'unauthorized' })
				}

				const parsed = parsePayload(joinRoomRequestSchema, payload)
				if (!parsed.ok) {
					return err({ code: 'invalid_payload' })
				}

				const joinedRoom = roomsService.joinRoom({
					roomCode: parsed.value.roomCode,
					memberName: parsed.value.memberName,
					socketId: socket.id,
				})
				if (!joinedRoom.ok) {
					return joinedRoom
				}

				bindSocketIdentity(socket, joinedRoom.value.response)

				return ok(joinedRoom.value.response)
			})
		})

		socket.on('room:host-resume', (payload, ack) => {
			resumeSession(
				socket,
				'room:host-resume',
				resumeHostRoomRequestSchema,
				payload,
				ack,
				'host',
				input => roomsService.resumeHostRoom(input),
			)
		})

		socket.on('room:player-resume', (payload, ack) => {
			resumeSession(
				socket,
				'room:player-resume',
				resumePlayerRoomRequestSchema,
				payload,
				ack,
				'player',
				input => roomsService.resumePlayerRoom(input),
			)
		})

		socket.on('room:return-to-lobby', (payload, ack) => {
			handleSessionCommand(
				socket,
				'room:return-to-lobby',
				returnToLobbyRequestSchema,
				payload,
				ack,
				token => roomsService.returnToLobby({ memberSessionToken: token }),
			)
		})

		socket.on('room:terminate', (payload, ack) => {
			handleSessionCommand(
				socket,
				'room:terminate',
				terminateRoomRequestSchema,
				payload,
				ack,
				token => roomsService.terminateRoom({ memberSessionToken: token }),
				() => clearSocketIdentity(socket),
			)
		})

		socket.on('game:start', (payload, ack) => {
			handleSessionCommand(
				socket,
				'game:start',
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
			handleSessionCommand(
				socket,
				'game:reveal-round',
				revealRoundRequestSchema,
				payload,
				ack,
				token =>
					roomsService.revealGameRound({ memberSessionToken: token }),
			)
		})

		socket.on('game:advance-round', (payload, ack) => {
			handleSessionCommand(
				socket,
				'game:advance-round',
				advanceRoundRequestSchema,
				payload,
				ack,
				token =>
					roomsService.advanceGameRound({ memberSessionToken: token }),
			)
		})

		socket.on('game:submit-answer', (payload, ack) => {
			handleSessionCommand(
				socket,
				'game:submit-answer',
				submitAnswerRequestSchema,
				payload,
				ack,
				(token, value) =>
					roomsService.submitAnswer({
						memberSessionToken: token,
						countryId: value.countryId,
					}),
			)
		})

		socket.on('disconnect', () => {
			try {
				roomsService.disconnectSocket(socket.id)
			} catch (error) {
				reportHandlerFailure(socket, 'disconnect', error)
			}
			clearSocketIdentity(socket)
		})
	})
}
