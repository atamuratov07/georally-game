# Member departure and room capacity

**Kind:** bug (user-facing) · **Priority:** high · **Effort:** small (option A) to medium (options B/C)

Players never leave a room, so absent players keep using capacity and keep their names reserved.

## Problem

There is no "leave" command. The player's **Leave** button on the finished screen (`RoomFinishedScreen`, `canLeaveRoom`) only navigates away. A member who disconnects stays in `RoomState.memberOrder` for the life of the room, marked `connected: false`.

Two rules count those absent members:

- **Capacity** — `getRoomOccupancy` (`room/selectors.ts`) returns `memberOrder.length` (minus the host in classroom mode), i.e. everyone who has _ever_ joined. `joinRoom` rejects with `room_participant_capacity_limit_exceeded` once that reaches `ROOM_CAPACITY_LIMIT`.
- **Names** — `canUseMemberName` (`room/member.ts`) checks all members, so an absent player's name stays taken.

The README documents this current behavior for `ROOM_CAPACITY_LIMIT` (everyone who has joined counts, including disconnected members).

## Impact

- A class where a few students rejoin from another device, an incognito window, or after clearing storage each creates an extra member. Enough of that and the 40-seat room refuses students who are actually present.
- "Bob" on a new device cannot join as "Bob"; he has to pick a new name, and the leaderboard shows both.

## Options

### A. Count only connected members toward capacity (recommended first step)

```ts
export function getRoomOccupancy(state: RoomState): number {
	return getMembers(state).filter(
		member =>
			member.connected &&
			!(isRoomInClassroomMode(state) && member.role === 'host'),
	).length
}
```

- Matches what people expect from a capacity limit.
- `resume*` does not check capacity, so a returning member can push a full room one over the limit. That is the right trade-off (never lock out a returning student), but it makes the limit soft — document it.
- Does not fix the reserved-name problem.

### B. Prune disconnected players in the lobby after a grace period

Add a `REMOVE_MEMBER` room command and remove players who have been disconnected in the **lobby** for longer than a grace period (e.g. 60 s), deleting their session token.

- Frees names and capacity.
- A pruned player who comes back gets `member_session_not_found` on resume; the client already treats that as `rejected` and shows the join screen with "session expired".
- **Lobby only.** During `active` / `finished`, game participants and results reference `memberId`s, and the views read names from `membersById`. Before pruning after a returned-to-lobby game, check whether anything still renders `gameHistory` names.
- Needs a timer per disconnected member (or a sweep piggybacked on `rescheduleRoomExpire`).

### C. Explicit leave

A `room:leave` socket event (or `DELETE /api/rooms/:roomCode/members/me` with the token) sent by the Leave button: removes the member in the lobby/finished phases, deletes the session, and clears the client's stored session.

- Best UX for intentional departures, and makes the Leave button honest.
- Does not help with tabs that are simply closed — that is what A/B cover.

## Recommendation

Do **A** now (one function plus tests). Add **C** when touching the finished/lobby screens. Do **B** only if reserved names turn out to be a real complaint.

## Tests (option A)

`service.test.ts`, `RoomsService.joinRoom`:

```ts
it('does not count disconnected players toward the limit', () => {
	const { service, createHostedRoom } = createService({ roomCapacityLimit: 1 })
	const created = createHostedRoom({
		hostName: 'Alice',
		roomMode: 'classroom',
	})

	const joinedOne = service.joinRoom({
		roomCode: created.roomCode,
		memberName: 'Bob',
		socketId: 'socket-2',
	})
	if (!joinedOne.ok) throw new Error('setup failed')

	service.disconnectSocket('socket-2')

	const joinedTwo = service.joinRoom({
		roomCode: created.roomCode,
		memberName: 'Tom',
		socketId: 'socket-3',
	})

	expect(joinedTwo.ok).toBe(true)
})
```

(Adjust `socketId` / `disconnectSocket` if the [member channels](socketio-member-channels.md) refactor has landed.) The existing "counts the host toward the limit in group mode" and "excludes the host from the limit in classroom mode" tests must keep passing.

Also update the README configuration row to say the limit counts connected members and is soft for returning members.
