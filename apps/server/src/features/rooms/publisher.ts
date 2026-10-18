import type { RoomClosedEvent, RoomUpdateEvent } from '@georally/game-protocol'

import {
	getRoomLeaderboard,
	isSameGameViewerView,
	receivesHostDetail,
	toGameHostDetail,
	toGameViewerView,
	toRoomGameInfo,
	toRoomSharedView,
	toVisibleMembers,
	type GameViewerView,
	type MemberId,
	type RoomId,
	type RoomState,
} from '@georally/game-domain/multiplayer/room'
import { memberChannel, roomChannel } from './channels.js'
import type { RoomsRepository } from './repository.js'
import type { GameNamespace } from './types.js'

interface RoomPublisherOptions {
	namespace: GameNamespace
	repository: RoomsRepository
	now?: () => number
}

interface PublishedRoom {
	state: RoomState
	viewerParts: Map<MemberId, GameViewerView>
}

function haveMembersChanged(previous: RoomState, next: RoomState): boolean {
	return (
		previous.membersById !== next.membersById ||
		previous.memberOrder !== next.memberOrder
	)
}

function hasGameStarted(previous: RoomState | undefined, next: RoomState) {
	return (
		next.phase === 'active' &&
		(previous?.phase !== 'active' ||
			previous.activeGame.gameId !== next.activeGame.gameId)
	)
}

export function createRoomPublisher({
	namespace,
	repository,
	now = Date.now,
}: RoomPublisherOptions) {
	const publishedRooms = new Map<RoomId, PublishedRoom>()

	function publishRoomUpdate(roomId: RoomId): void {
		const context = repository.getRoomById(roomId)
		if (!context) {
			return
		}

		const { state, revision } = context
		const previous = publishedRooms.get(roomId)
		const serverNow = now()
		const leaderboard = getRoomLeaderboard(state)
		const viewerParts = new Map<MemberId, GameViewerView>()

		if (state.phase === 'active') {
			const leaderboardById = new Map(
				leaderboard?.map(entry => [entry.participantId, entry]),
			)

			for (const memberId of state.memberOrder) {
				if (!state.membersById[memberId]?.connected) {
					continue
				}

				const channel = memberChannel(memberId)

				if (receivesHostDetail(state, memberId)) {
					const hostDetail = toGameHostDetail(
						state.activeGame,
						leaderboard ?? [],
					)
					if (hostDetail) {
						namespace.to(channel).emit('room:host-detail', {
							roomId,
							revision,
							serverNow,
							hostDetail,
						})
					}
					continue
				}

				const viewer = toGameViewerView(
					state.activeGame,
					memberId,
					leaderboardById.get(memberId) ?? null,
				)
				viewerParts.set(memberId, viewer)
				if (
					!isSameGameViewerView(
						previous?.viewerParts.get(memberId),
						viewer,
					)
				) {
					namespace.to(channel).emit('room:viewer', {
						roomId,
						revision,
						serverNow,
						viewer,
					})
				}
			}
		}

		publishedRooms.set(roomId, { state, viewerParts })

		const update: RoomUpdateEvent = {
			roomId,
			revision,
			serverNow,
			shared: toRoomSharedView(state, leaderboard),
		}
		if (!previous || haveMembersChanged(previous.state, state)) {
			update.members = toVisibleMembers(state)
		}
		if (state.phase === 'active' && hasGameStarted(previous?.state, state)) {
			update.game = toRoomGameInfo(state.activeGame)
		}
		if (state.phase === 'finished' && previous?.state.phase !== 'finished') {
			update.lastGameResult = state.lastGameResult
		}

		namespace.to(roomChannel(roomId)).emit('room:update', update)
	}

	function publishRoomClosed(
		roomId: RoomId,
		reason: RoomClosedEvent['reason'],
	): void {
		publishedRooms.delete(roomId)
		namespace.to(roomChannel(roomId)).emit('room:closed', {
			roomId,
			serverNow: now(),
			reason,
		})
	}

	return {
		publishRoomUpdate,
		publishRoomClosed,
	}
}
