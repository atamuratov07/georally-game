import type { CommandError } from '../errors'
import { err, ok, type Result } from '../../shared/result'
import type { MemberId, RoomCode, RoomId, RoomMode, RoomState } from './types'

export function normalizeMemberName(name: string): string {
	return name.trim()
}

export interface CreateRoomInput {
	roomId: RoomId
	roomCode: RoomCode
	roomMode: RoomMode
	hostId: MemberId
	hostName: string
	now: number
}

export function createRoom(
	input: CreateRoomInput,
): Result<RoomState, CommandError> {
	const hostName = normalizeMemberName(input.hostName)
	if (hostName.length === 0) {
		return err({
			code: 'member_name_required',
		})
	}

	return ok({
		phase: 'lobby',
		roomId: input.roomId,
		roomCode: input.roomCode,
		roomMode: input.roomMode,
		hostId: input.hostId,
		membersById: {
			[input.hostId]: {
				id: input.hostId,
				name: hostName,
				role: 'host',
				connected: false,
				joinedAt: input.now,
				lastConnectedAt: input.now,
				lastDisconnectedAt: input.now,
			},
		},
		memberOrder: [input.hostId],
		createdAt: input.now,
		gameHistory: [],
	})
}
