import {
	GAME_NAMESPACE,
	type Ack,
	type AckCallback,
	type AdvanceRoundRequest,
	type ClientToServerEvents,
	type EmptyAckData,
	type JoinRoomRequest,
	type JoinRoomResponse,
	type ResumeHostRoomRequest,
	type ResumeHostRoomResponse,
	type ResumePlayerRoomRequest,
	type ResumePlayerRoomResponse,
	type ReturnToLobbyRequest,
	type RevealRoundRequest,
	type RoomClosedEvent,
	type RoomHostDetailEvent,
	type RoomUpdateEvent,
	type RoomViewerEvent,
	type ServerToClientEvents,
	type StartGameRequest,
	type SubmitAnswerRequest,
	type SubmitAnswerResponse,
	type TerminateRoomRequest,
} from '@georally/game-protocol'
import { io, type Socket } from 'socket.io-client'
import { toGatewayError } from './errors'
import { i18n } from '../../shared/i18n/setup'

type RoomSocket = Socket<ServerToClientEvents, ClientToServerEvents>
type ClientEventName = keyof ClientToServerEvents

type ClientEventPayloadMap = {
	[TEvent in ClientEventName]: Parameters<ClientToServerEvents[TEvent]>[0]
}

type ClientEventResponseMap = {
	[TEvent in ClientEventName]: Parameters<
		ClientToServerEvents[TEvent]
	>[1] extends AckCallback<infer TResponse>
		? TResponse
		: never
}

interface TimedAckEmitter {
	emitWithAck<TEvent extends ClientEventName>(
		eventName: TEvent,
		payload: ClientEventPayloadMap[TEvent],
	): Promise<Ack<ClientEventResponseMap[TEvent]>>
}

export interface RoomSubscriptionHandlers {
	onRoomUpdate?: (payload: RoomUpdateEvent) => void
	onRoomViewer?: (payload: RoomViewerEvent) => void
	onRoomHostDetail?: (payload: RoomHostDetailEvent) => void
	onRoomClosed?: (payload: RoomClosedEvent) => void
	onSocketDisconnect?: (reason: string) => void
	onSocketReconnect?: () => void
}

export interface SocketGateway {
	joinRoom: (payload: JoinRoomRequest) => Promise<JoinRoomResponse>
	resumeHostRoom: (
		payload: ResumeHostRoomRequest,
	) => Promise<ResumeHostRoomResponse>
	resumePlayerRoom: (
		payload: ResumePlayerRoomRequest,
	) => Promise<ResumePlayerRoomResponse>
	returnToLobby: (payload: ReturnToLobbyRequest) => Promise<EmptyAckData>
	terminateRoom: (payload: TerminateRoomRequest) => Promise<EmptyAckData>
	startGame: (payload: StartGameRequest) => Promise<EmptyAckData>
	submitAnswer: (payload: SubmitAnswerRequest) => Promise<SubmitAnswerResponse>
	revealRound: (payload: RevealRoundRequest) => Promise<EmptyAckData>
	advanceRound: (payload: AdvanceRoundRequest) => Promise<EmptyAckData>
	subscribeRoom: (handlers: RoomSubscriptionHandlers) => () => void
	disconnect: () => void
}

const CONNECT_TIMEOUT_MS = 5000
const REQUEST_TIMEOUT_MS = 5000

function buildSocketUrl(): string {
	const envUrl = import.meta.env.VITE_GAME_SERVER_ORIGIN?.trim()
	if (envUrl) {
		return `${envUrl.replace(/\/$/, '')}${GAME_NAMESPACE}`
	}

	return GAME_NAMESPACE
}

function unwrapAck<TResponse>(response: Ack<TResponse>): TResponse {
	if (response.ok) {
		return response.data
	}

	throw response.error
}

export function createSocketGateway(): SocketGateway {
	let socket: RoomSocket | null = null
	let intentionalDisconnect = false

	function getSocket(): RoomSocket {
		if (!socket) {
			socket = io(buildSocketUrl(), {
				autoConnect: false,
				reconnection: true,
			})
		}

		return socket
	}

	async function ensureConnected(): Promise<RoomSocket> {
		const currentSocket = getSocket()
		if (currentSocket.connected) {
			return currentSocket
		}

		intentionalDisconnect = false

		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				cleanup()
				reject(
					toGatewayError(
						new Error(i18n.t('gatewayErrors.transport_error')),
					),
				)
			}, CONNECT_TIMEOUT_MS)

			const cleanup = () => {
				clearTimeout(timeoutId)
				currentSocket.off('connect', handleConnect)
				currentSocket.off('connect_error', handleConnectError)
			}

			const handleConnect = () => {
				cleanup()
				resolve(currentSocket)
			}

			const handleConnectError = (error: Error) => {
				cleanup()
				reject(toGatewayError(error))
			}

			currentSocket.once('connect', handleConnect)
			currentSocket.once('connect_error', handleConnectError)
			currentSocket.connect()
		})
	}

	async function request<TEvent extends ClientEventName>(
		eventName: TEvent,
		payload: ClientEventPayloadMap[TEvent],
	): Promise<ClientEventResponseMap[TEvent]> {
		const currentSocket = await ensureConnected()
		const timedSocket = currentSocket.timeout(
			REQUEST_TIMEOUT_MS,
		) as unknown as TimedAckEmitter

		try {
			const response = await timedSocket.emitWithAck(eventName, payload)
			return unwrapAck(response)
		} catch (error) {
			throw toGatewayError(error)
		}
	}

	return {
		joinRoom(payload) {
			return request('room:join', payload)
		},

		resumePlayerRoom(payload) {
			return request('room:player-resume', payload)
		},

		resumeHostRoom(payload) {
			return request('room:host-resume', payload)
		},

		returnToLobby(payload) {
			return request('room:return-to-lobby', payload)
		},

		terminateRoom(payload) {
			return request('room:terminate', payload)
		},

		startGame(payload) {
			return request('game:start', payload)
		},

		submitAnswer(payload) {
			return request('game:submit-answer', payload)
		},

		revealRound(payload) {
			return request('game:reveal-round', payload)
		},

		advanceRound(payload) {
			return request('game:advance-round', payload)
		},

		subscribeRoom(handlers) {
			const currentSocket = getSocket()

			const handleRoomUpdate = (payload: RoomUpdateEvent) => {
				handlers.onRoomUpdate?.(payload)
			}

			const handleRoomViewer = (payload: RoomViewerEvent) => {
				handlers.onRoomViewer?.(payload)
			}

			const handleRoomHostDetail = (payload: RoomHostDetailEvent) => {
				handlers.onRoomHostDetail?.(payload)
			}

			const handleRoomClosed = (payload: RoomClosedEvent) => {
				handlers.onRoomClosed?.(payload)
			}

			const handleSocketDisconnect = (reason: string) => {
				if (intentionalDisconnect) {
					return
				}

				handlers.onSocketDisconnect?.(reason)
			}

			const handleSocketReconnect = () => {
				handlers.onSocketReconnect?.()
			}

			currentSocket.on('room:update', handleRoomUpdate)
			currentSocket.on('room:viewer', handleRoomViewer)
			currentSocket.on('room:host-detail', handleRoomHostDetail)
			currentSocket.on('room:closed', handleRoomClosed)
			currentSocket.on('disconnect', handleSocketDisconnect)
			currentSocket.on('connect', handleSocketReconnect)

			return () => {
				currentSocket.off('room:update', handleRoomUpdate)
				currentSocket.off('room:viewer', handleRoomViewer)
				currentSocket.off('room:host-detail', handleRoomHostDetail)
				currentSocket.off('room:closed', handleRoomClosed)
				currentSocket.off('disconnect', handleSocketDisconnect)
				currentSocket.off('connect', handleSocketReconnect)
			}
		},

		disconnect() {
			intentionalDisconnect = true
			const currentSocket = socket
			socket = null
			currentSocket?.disconnect()
		},
	}
}
