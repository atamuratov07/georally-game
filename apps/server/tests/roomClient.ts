import {
	applyRoomSyncHostDetailUpdate,
	applyRoomSyncUpdate,
	applyRoomSyncViewerUpdate,
	composeHostRoomView,
	composePlayerRoomView,
	createRoomSyncState,
	type MemberId,
	type RoomMemberRole,
	type RoomSync,
	type RoomSyncState,
} from '@georally/game-domain/multiplayer/room'
import type {
	RoomHostDetailEvent,
	RoomUpdateEvent,
	RoomViewerEvent,
} from '@georally/game-protocol'

import type { RoomClientSocket } from './setup'

export interface ReceivedEvent {
	event: string
	payload: Record<string, unknown>
}

export function trackRoomClient(role: RoomMemberRole) {
	const received: ReceivedEvent[] = []
	const listeners = new Set<() => void>()
	let memberId: MemberId = ''
	let state: RoomSyncState | null = null

	function notify() {
		for (const listener of listeners) {
			listener()
		}
	}

	function apply(event: string, payload: unknown) {
		if (!state) {
			return
		}
		if (event === 'room:update') {
			state = applyRoomSyncUpdate(state, payload as RoomUpdateEvent)
		}
		if (event === 'room:viewer') {
			state = applyRoomSyncViewerUpdate(state, payload as RoomViewerEvent)
		}
		if (event === 'room:host-detail') {
			state = applyRoomSyncHostDetailUpdate(
				state,
				payload as RoomHostDetailEvent,
			)
		}
	}

	const client = {
		received,
		get state() {
			return state
		},
		listen(socket: RoomClientSocket) {
			socket.onAny((event: string, payload: Record<string, unknown>) => {
				received.push({ event, payload })
				apply(event, payload)
				notify()
			})
		},
		start(viewerMemberId: MemberId, sync: RoomSync) {
			memberId = viewerMemberId
			state = createRoomSyncState(sync)
			notify()
		},
		view() {
			if (!state) {
				return undefined
			}
			return role === 'host'
				? composeHostRoomView(state.sync, memberId)
				: composePlayerRoomView(state.sync, memberId)
		},
		waitFor(predicate: () => boolean) {
			return new Promise<void>(resolve => {
				const check = () => {
					if (predicate()) {
						listeners.delete(check)
						resolve()
					}
				}
				listeners.add(check)
				check()
			})
		},
	}

	return client
}

export type TrackedRoomClient = ReturnType<typeof trackRoomClient>
