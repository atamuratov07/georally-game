import type { RoomClosedEvent } from '@georally/game-protocol'
import type {
	MemberId,
	RoomView,
	VisibleMemberInfo,
} from '@georally/game-domain/multiplayer/room'
import { i18n } from '../../shared/i18n/setup'

type MembersById = ReadonlyMap<MemberId, VisibleMemberInfo>

const membersByIdCache = new WeakMap<
	readonly VisibleMemberInfo[],
	MembersById
>()

export function getMembersById(
	members: readonly VisibleMemberInfo[],
): MembersById {
	let membersById = membersByIdCache.get(members)
	if (!membersById) {
		membersById = new Map(members.map(member => [member.memberId, member]))
		membersByIdCache.set(members, membersById)
	}
	return membersById
}

export function getViewerMember(room: RoomView): VisibleMemberInfo | null {
	return getMembersById(room.members).get(room.viewerMemberId) ?? null
}

export function getMemberName(
	members: readonly VisibleMemberInfo[],
	memberId: string,
): string {
	return getMembersById(members).get(memberId)?.name ?? memberId
}

export function formatClosedReason(reason: RoomClosedEvent['reason']): string {
	if (reason === 'host_terminated') {
		return i18n.t('multiplayer.closed.hostTerminated')
	}

	if (reason === 'expired') {
		return i18n.t('multiplayer.closed.expired')
	}

	return i18n.t('multiplayer.closed.default')
}
