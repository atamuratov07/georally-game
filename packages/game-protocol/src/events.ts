import type { AckCallback, EmptyAckData } from './ack'
import type {
	JoinRoomRequest,
	AdvanceRoundRequest,
	ResumeHostRoomRequest,
	ResumePlayerRoomRequest,
	ReturnToLobbyRequest,
	RevealRoundRequest,
	StartGameRequest,
	SubmitAnswerRequest,
	TerminateRoomRequest,
} from './requests'
import type {
	HostRoomSnapshotEvent,
	JoinRoomResponse,
	PlayerRoomSnapshotEvent,
	ResumeHostRoomResponse,
	ResumePlayerRoomResponse,
	RoomClosedEvent,
	SubmitAnswerResponse,
} from './responses'

export const GAME_NAMESPACE = '/game' as const

export interface ClientToServerEvents {
	'room:join': (
		payload: JoinRoomRequest,
		ack: AckCallback<JoinRoomResponse>,
	) => void
	'room:host-resume': (
		payload: ResumeHostRoomRequest,
		ack: AckCallback<ResumeHostRoomResponse>,
	) => void
	'room:player-resume': (
		payload: ResumePlayerRoomRequest,
		ack: AckCallback<ResumePlayerRoomResponse>,
	) => void
	'room:return-to-lobby': (
		payload: ReturnToLobbyRequest,
		ack: AckCallback<EmptyAckData>,
	) => void
	'room:terminate': (
		payload: TerminateRoomRequest,
		ack: AckCallback<EmptyAckData>,
	) => void
	'game:start': (
		payload: StartGameRequest,
		ack: AckCallback<EmptyAckData>,
	) => void
	'game:reveal-round': (
		payload: RevealRoundRequest,
		ack: AckCallback<EmptyAckData>,
	) => void
	'game:advance-round': (
		payload: AdvanceRoundRequest,
		ack: AckCallback<EmptyAckData>,
	) => void
	'game:submit-answer': (
		payload: SubmitAnswerRequest,
		ack: AckCallback<SubmitAnswerResponse>,
	) => void
}

export interface ServerToClientEvents {
	'room:host-snapshot': (payload: HostRoomSnapshotEvent) => void
	'room:player-snapshot': (payload: PlayerRoomSnapshotEvent) => void
	'room:closed': (payload: RoomClosedEvent) => void
}

export interface InterServerEvents {}
