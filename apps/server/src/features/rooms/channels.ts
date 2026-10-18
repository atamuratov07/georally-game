import type { MemberId, RoomId } from '@georally/game-domain/multiplayer/room'

import type { GameNamespace } from './types.js'

export function memberChannel(memberId: MemberId): string {
	return `member:${memberId}`
}

export function roomChannel(roomId: RoomId): string {
	return `room:${roomId}`
}

export function hasMemberSockets(
	namespace: GameNamespace,
	memberId: MemberId,
): boolean {
	return (namespace.adapter.rooms.get(memberChannel(memberId))?.size ?? 0) > 0
}
