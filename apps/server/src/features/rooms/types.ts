import type {
	MemberId,
	RoomId,
	RoomMemberRole,
} from '@georally/game-domain/multiplayer/room'
import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
} from '@georally/game-protocol'
import type { Namespace, Socket } from 'socket.io'

export type MemberSessionToken = string

export interface GameSocketData {
	role?: RoomMemberRole
	roomId?: RoomId
	memberId?: MemberId
	memberSessionToken?: MemberSessionToken
}

export type GameNamespace = Namespace<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	GameSocketData
>

export type GameSocket = Socket<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	GameSocketData
>
