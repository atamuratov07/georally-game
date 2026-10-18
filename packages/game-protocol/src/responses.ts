import {
	ROOM_PHASES,
	type MemberId,
	type RoomCode,
	type RoomId,
	type RoomMemberRole,
	type RoomSync,
	type RoomSyncHostDetailUpdate,
	type RoomSyncUpdate,
	type RoomSyncViewerUpdate,
} from '@georally/game-domain/multiplayer/room'

import { z } from 'zod'
export const roomPhaseSchema = z.enum(ROOM_PHASES)

export interface SessionIdentity {
	roomId: RoomId
	roomCode: RoomCode
	memberId: MemberId
	role: RoomMemberRole
	memberSessionToken: string
}

export type CreateRoomResponse = SessionIdentity

export const lookupRoomMissingResponseSchema = z.object({
	exists: z.literal(false),
	roomCode: z.string().trim().length(6),
})

export const lookupRoomFoundResponseSchema = z.object({
	exists: z.literal(true),
	roomCode: z.string().trim().length(6),
	phase: roomPhaseSchema,
	joinable: z.boolean(),
	memberCount: z.number().int().nonnegative(),
	hostName: z.string().trim().min(1),
})

export const lookupRoomResponseSchema = z.discriminatedUnion('exists', [
	lookupRoomMissingResponseSchema,
	lookupRoomFoundResponseSchema,
])

export type LookupRoomMissingResponse = z.infer<
	typeof lookupRoomMissingResponseSchema
>

export type LookupRoomFoundResponse = z.infer<
	typeof lookupRoomFoundResponseSchema
>

export type LookupRoomResponse = z.infer<typeof lookupRoomResponseSchema>

export interface JoinRoomResponse extends SessionIdentity {
	serverNow: number
	sync: RoomSync
}

export interface ResumeRoomResponse {
	roomId: RoomId
	memberId: MemberId
	serverNow: number
	sync: RoomSync
}

export type ResumeHostRoomResponse = ResumeRoomResponse

export type ResumePlayerRoomResponse = ResumeRoomResponse

export interface SubmitAnswerResponse {
	acceptedAt: number
}

export interface RoomUpdateEvent extends RoomSyncUpdate {
	roomId: RoomId
	serverNow: number
}

export interface RoomViewerEvent extends RoomSyncViewerUpdate {
	roomId: RoomId
	serverNow: number
}

export interface RoomHostDetailEvent extends RoomSyncHostDetailUpdate {
	roomId: RoomId
	serverNow: number
}

export interface RoomClosedEvent {
	roomId: RoomId
	serverNow: number
	reason: 'host_terminated' | 'expired' | 'server_shutdown'
}
