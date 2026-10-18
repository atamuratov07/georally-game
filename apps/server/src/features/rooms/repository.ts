import type { MemberId } from '@georally/game-domain/multiplayer'
import type {
	RoomCode,
	RoomId,
	RoomMemberRole,
	RoomState,
} from '@georally/game-domain/multiplayer/room'
import type { MemberSessionToken } from './types'

export interface MemberSessionRecord {
	token: MemberSessionToken
	roomId: RoomId
	memberId: MemberId
	role: RoomMemberRole
}

export interface ScheduledRoomAdvance {
	dueAt: number
	handle: NodeJS.Timeout
}

export interface ScheduledRoomExpire {
	dueAt: number
	handle: NodeJS.Timeout
}

export interface RoomContext {
	state: RoomState
	memberSessionTokensByMemberId: Map<MemberId, MemberSessionToken>
	scheduledAdvance: ScheduledRoomAdvance | null
	scheduledExpire: ScheduledRoomExpire | null
}

export class RoomsRepository {
	private readonly roomsById = new Map<RoomId, RoomContext>()
	private readonly roomIdsByCode = new Map<RoomCode, RoomId>()
	private readonly sessionsByToken = new Map<
		MemberSessionToken,
		MemberSessionRecord
	>()

	hasRoomCode(roomCode: RoomCode): boolean {
		return this.roomIdsByCode.has(roomCode)
	}

	createRoom(state: RoomState): RoomContext {
		if (
			this.roomsById.has(state.roomId) ||
			this.roomIdsByCode.has(state.roomCode)
		) {
			throw new Error(`Room ${state.roomId} already exists.`)
		}

		const context: RoomContext = {
			state,
			memberSessionTokensByMemberId: new Map(),
			scheduledAdvance: null,
			scheduledExpire: null,
		}

		this.roomsById.set(state.roomId, context)
		this.roomIdsByCode.set(state.roomCode, state.roomId)

		return context
	}

	getRoomById(roomId: RoomId): RoomContext | undefined {
		return this.roomsById.get(roomId)
	}

	getRoomByCode(roomCode: RoomCode): RoomContext | undefined {
		const roomId = this.roomIdsByCode.get(roomCode)
		return roomId ? this.roomsById.get(roomId) : undefined
	}

	listRooms(): RoomContext[] {
		return [...this.roomsById.values()]
	}

	getRoomCount(): number {
		return this.roomsById.size
	}

	setRoomState(roomId: RoomId, newState: RoomState): RoomContext | undefined {
		const context = this.roomsById.get(roomId)
		if (!context) {
			return undefined
		}

		if (context.state.roomCode !== newState.roomCode) {
			this.roomIdsByCode.delete(context.state.roomCode)
			this.roomIdsByCode.set(newState.roomCode, roomId)
		}

		context.state = newState
		return context
	}

	setScheduledRoomAdvance(
		roomId: RoomId,
		scheduledRoomAdvance: ScheduledRoomAdvance | null,
	): void {
		const context = this.roomsById.get(roomId)
		if (!context) {
			return
		}

		if (context.scheduledAdvance) {
			clearTimeout(context.scheduledAdvance.handle)
		}

		context.scheduledAdvance = scheduledRoomAdvance
	}

	setScheduledRoomExpire(
		roomId: RoomId,
		scheduledRoomExpire: ScheduledRoomExpire | null,
	) {
		const context = this.roomsById.get(roomId)
		if (!context) {
			return
		}

		if (context.scheduledExpire) {
			clearTimeout(context.scheduledExpire.handle)
		}

		context.scheduledExpire = scheduledRoomExpire
	}

	deleteRoom(roomId: RoomId): RoomContext | undefined {
		const context = this.roomsById.get(roomId)
		if (!context) {
			return undefined
		}

		if (context.scheduledAdvance) {
			clearTimeout(context.scheduledAdvance.handle)
		}
		if (context.scheduledExpire) {
			clearTimeout(context.scheduledExpire.handle)
		}

		for (const token of context.memberSessionTokensByMemberId.values()) {
			this.sessionsByToken.delete(token)
		}

		this.roomIdsByCode.delete(context.state.roomCode)
		this.roomsById.delete(roomId)

		return context
	}

	createMemberSession(session: MemberSessionRecord): MemberSessionRecord {
		if (this.sessionsByToken.has(session.token)) {
			throw new Error(
				`Member session for member ${session.memberId} already exists.`,
			)
		}

		this.sessionsByToken.set(session.token, session)
		const context = this.roomsById.get(session.roomId)
		context?.memberSessionTokensByMemberId.set(
			session.memberId,
			session.token,
		)

		return session
	}

	getMemberSession(
		memberSessionToken: MemberSessionToken,
	): MemberSessionRecord | undefined {
		return this.sessionsByToken.get(memberSessionToken)
	}

	listMemberSessions(roomId: RoomId): MemberSessionRecord[] {
		const context = this.roomsById.get(roomId)
		if (!context) {
			return []
		}

		return [...context.memberSessionTokensByMemberId.values()].flatMap(
			token => {
				const session = this.sessionsByToken.get(token)
				return session ? [session] : []
			},
		)
	}

	clearAllScheduledRoomAdvances(): void {
		for (const context of this.roomsById.values()) {
			if (context.scheduledAdvance) {
				clearTimeout(context.scheduledAdvance.handle)
				context.scheduledAdvance = null
			}
		}
	}
}
