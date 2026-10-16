# Socket.IO member channels

**Kind:** refactor · **Priority:** low · **Effort:** large (touches repository, service, publisher, socket handlers, and most service unit tests)

Replace the server's hand-rolled socket bookkeeping with Socket.IO rooms, so `RoomsService` stops knowing about sockets entirely.

To avoid confusion with GeoRally rooms, Socket.IO rooms are called **channels** below.

## Problem

The server tracks which socket serves which member by hand:

- `MemberSessionRecord.socketId` and `RoomsRepository.sessionTokensBySocketId` (with `bindSocketToSession`, `unbindSocketFromSession`, `getMemberSessionBySocketId`, `getConnectedSessionCount`).
- `RoomsService.joinRoom` / `resumeHostRoom` / `resumePlayerRoom` take a `socketId`, and the resume methods return `replacedSocketId` (via `BoundServiceResponse`) so `socket.ts` can evict the previous tab.
- `RoomsService.disconnectSocket(socketId)` maps a socket back to a session through the reverse map.
- The publisher sends to `namespace.to(session.socketId)`.

It works, but transport identity leaks into the application service, and the reverse map duplicates what `socket.data` already holds.

## Why it is not urgent

There is no user-facing bug here. The current bookkeeping correctly handles the tricky case (a stale socket's late `disconnect` must not mark the member offline after a newer socket took over) in one place. The main payoffs are a transport-agnostic service and readiness for multiple server instances with the Redis adapter — which also requires shared game state, see [`persistence.md`](../architecture/persistence.md).

## Design

One channel per **member**: `member:<memberId>`. Not one per GeoRally room: every member receives a different projection of the room, so per-member addressing is needed anyway, and `room:closed` can go to the same channels.

| Concern                                      | Now                                                        | After                                                                |
| -------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- |
| Which socket serves a member                 | `session.socketId` + `sessionTokensBySocketId`             | Membership in `member:<memberId>`                                    |
| Delivery of snapshots / `room:closed`        | `namespace.to(session.socketId)`                           | `namespace.to(memberChannel(memberId))`                              |
| Socket → member on disconnect                | Reverse map `unbindSocketFromSession(socket.id)`           | `socket.data` (already holds the token)                              |
| Tab takeover                                 | Service returns `replacedSocketId`, socket layer evicts it | Socket layer joins the channel, then evicts every other socket in it |
| Late disconnect must not mark member offline | `session.socketId === socketId` check                      | "Is another socket still in the channel?" check                      |
| Service knows about sockets                  | Yes                                                        | **No** — tokens only                                                 |

## Implementation

Commit any in-progress work first.

### 1. Channel helpers

New `apps/server/src/features/rooms/channels.ts`:

```ts
import type { MemberId } from '@georally/game-domain/multiplayer/room'

import type { GameNamespace } from './types.js'

export function memberChannel(memberId: MemberId): string {
	return `member:${memberId}`
}

export function hasMemberSockets(
	namespace: GameNamespace,
	memberId: MemberId,
): boolean {
	return (namespace.adapter.rooms.get(memberChannel(memberId))?.size ?? 0) > 0
}
```

`adapter.rooms` is local to this process. With the Redis adapter this check must become the async `namespace.in(channel).fetchSockets()`.

### 2. Repository: drop socket tracking

```ts
export interface MemberSessionRecord {
	token: MemberSessionToken
	roomId: RoomId
	memberId: MemberId
	role: RoomMemberRole
}
```

Delete `sessionTokensBySocketId`, `getMemberSessionBySocketId`, `bindSocketToSession`, `unbindSocketFromSession`, `getConnectedSessionCount`. Remove the `socketId` branch from `createMemberSession`. The session loop in `deleteRoom` becomes:

```ts
for (const token of context.memberSessionTokensByMemberId.values()) {
	this.sessionsByToken.delete(token)
}
```

### 3. Service: socket-free

1. Remove `socketId` from `JoinRoomInput`, `ResumeHostRoomInput`, `ResumePlayerRoomInput` and from every `createMemberSession` call.
2. Return responses directly from `joinRoom`, `resumeHostRoom`, `resumePlayerRoom` (`ServiceResult<JoinRoomResponse>` etc.); delete the `bindSocketToSession` calls and `BoundServiceResponse` in `types.ts`.
3. Replace `disconnectSocket(socketId)`:

   ```ts
   disconnectMember(memberSessionToken: MemberSessionToken): void {
   	const sessionContext = this.getMemberSessionContext(memberSessionToken)
   	if (!sessionContext.ok) {
   		return
   	}

   	const { memberSession, state } = sessionContext.value
   	const member = state.membersById[memberSession.memberId]
   	if (!member?.connected) {
   		return
   	}

   	const disconnectedState = applyRoomCommand(state, {
   		type: 'DISCONNECT_MEMBER',
   		id: member.id,
   		now: this.now(),
   	})

   	if (!disconnectedState.ok) {
   		return
   	}

   	this.commitRoomState(state.roomId, disconnectedState.value)
   }
   ```

4. Health: count connected members instead of bound sockets (key name kept for compatibility):

   ```ts
   getHealthSnapshot() {
   	return {
   		roomCount: this.repository.getRoomCount(),
   		connectedSessionCount: this.repository
   			.listRooms()
   			.reduce((sum, context) => sum + getConnectedMemberCount(context.state), 0),
   	}
   }
   ```

### 4. Publisher: send to channels

Skip members who are not connected (saves building views nobody receives):

```ts
for (const session of repository.listMemberSessions(roomId)) {
	if (session.memberId === options.excludeMemberId) {
		continue
	}

	if (!context.state.membersById[session.memberId]?.connected) {
		continue
	}

	const channel = memberChannel(session.memberId)

	if (session.role === 'host') {
		const snapshot = isRoomInGroupMode(context.state)
			? toGroupHostRoomView(context.state, session.memberId)
			: toClassroomHostRoomView(context.state, session.memberId)

		if (snapshot) {
			namespace.to(channel).emit('room:host-snapshot', { roomId, snapshot })
		}
		continue
	}

	const snapshot = toPlayerRoomView(context.state, session.memberId)
	if (snapshot) {
		namespace.to(channel).emit('room:player-snapshot', { roomId, snapshot })
	}
}
```

```ts
function publishRoomClosed(
	roomId: RoomId,
	reason: RoomClosedEvent['reason'],
): void {
	for (const session of repository.listMemberSessions(roomId)) {
		namespace
			.to(memberChannel(session.memberId))
			.emit('room:closed', { roomId, reason })
	}
}
```

`closeRoom` calls the hook before `deleteRoom`, so sessions are still listed.

### 5. Socket layer: attach and take over

Delete `disconnectReplacedSocket`; add:

```ts
function attachSocketToMember(
	namespace: GameNamespace,
	socket: GameSocket,
	identity: {
		role: RoomMemberRole
		roomId: string
		memberId: string
		memberSessionToken: string
	},
): void {
	bindSocketIdentity(socket, identity)

	const channel = memberChannel(identity.memberId)
	void socket.join(channel)

	// Tab takeover: evict any other socket serving this member. Join first, so the
	// evicted socket's 'disconnect' handler still sees a socket in the channel and
	// leaves the member connected.
	namespace.in(channel).except(socket.id).disconnectSockets(true)
}
```

**Order matters:** evicting before joining would let the old socket's disconnect handler find an empty channel and mark the member disconnected, producing a "disconnected → connected" flicker for everyone in the room.

Use it after a successful `joinRoom` / `resumeHostRoom` / `resumePlayerRoom`:

```ts
const resumedRoom = roomsService.resumeHostRoom({
	memberSessionToken: parsed.value.memberSessionToken,
})
if (!resumedRoom.ok) {
	return respondWithError(ack, resumedRoom.error)
}

attachSocketToMember(namespace, socket, {
	role: 'host',
	roomId: resumedRoom.value.roomId,
	memberId: resumedRoom.value.memberId,
	memberSessionToken: parsed.value.memberSessionToken,
})

return respondWithSuccess(ack, resumedRoom.value)
```

Disconnect handler:

```ts
socket.on('disconnect', () => {
	const { memberId, memberSessionToken } = socket.data
	if (!memberId || !memberSessionToken) {
		return
	}

	// Another socket (a newer tab, or a reconnect that arrived before this
	// socket's death was detected) still serves this member.
	if (hasMemberSockets(namespace, memberId)) {
		return
	}

	roomsService.disconnectMember(memberSessionToken)
})
```

Socket.IO removes a socket from all its channels before firing `'disconnect'`, so anything left in the channel is a different socket. Besides tab takeover, this covers the common refresh race where the new page resumes before the server has noticed the old socket died (up to ~45 s with a heartbeat timeout).

## Tests

**`service.test.ts`** — mostly mechanical:

- Remove `socketId: 'socket-N'` from `joinRoom` / `resume*` calls; drop the `socketId` parameter from `createHostedRoom`.
- `joined.value.response.X` → `joined.value.X` (same for resume results).
- `service.disconnectSocket('socket-N')` → `service.disconnectMember(token)`: `socket-1` is the host (`created.memberSessionToken`), `socket-2` the first joined player, `socket-3` the second.
- Delete the four `replacedSocketId` tests ("…still rebinds the socket" and "returns the previous socket id…" for host and player). Takeover is now a socket-layer concern covered by integration tests.
- Rename the `disconnectSocket` describe block to `disconnectMember` ("is a no-op for an unknown token", etc.).

**`app.test.ts`** — the existing eviction test stays; add:

```ts
it('keeps the member connected when another socket takes over its session', async () => {
	const { hostSocket, created } = await server.createRoomAsHost({
		hostName: 'Alice',
		roomMode: 'classroom',
	})
	await joinAsPlayer(created.roomCode, 'Bob')

	const evictedPromise = new Promise<string>(resolve => {
		hostSocket.once('disconnect', resolve)
	})

	const newHostSocket = await server.connectClient()
	const resumed = await newHostSocket.emitWithAck('room:host-resume', {
		memberSessionToken: created.memberSessionToken,
	})
	if (!resumed.ok) throw new Error('setup failed')

	await evictedPromise

	const health = await request(server.httpServer).get('/health').expect(200)
	expect(health.body).toMatchObject({ connectedSessionCount: 2 })
})

it('delivers snapshots to the socket that took over', async () => {
	const { created } = await server.createRoomAsHost({
		hostName: 'Alice',
		roomMode: 'classroom',
	})

	const newHostSocket = await server.connectClient()
	const resumed = await newHostSocket.emitWithAck('room:host-resume', {
		memberSessionToken: created.memberSessionToken,
	})
	if (!resumed.ok) throw new Error('setup failed')

	const hostSnapshotPromise = nextHostSnapshot(newHostSocket)

	await joinAsPlayer(created.roomCode, 'Bob')

	const hostSnapshotEvent = await hostSnapshotPromise
	expect(
		hostSnapshotEvent.snapshot.members.map(member => member.name),
	).toEqual(['Alice', 'Bob'])
})
```

Swapping join and evict in `attachSocketToMember` makes the first test fail with `connectedSessionCount: 1` — a good way to confirm the guard works. Awaiting the client-side `'disconnect'` is safe because the server runs the evicted socket's handler synchronously inside `disconnectSockets`, before the packet reaches the client.

## Docs to update afterwards

In [`connection-lifecycle.md`](../architecture/connection-lifecycle.md):

- Layer 3: replace the "Socket.IO rooms are unused" paragraph — each socket serving a member joins `member:<memberId>`; snapshots and `room:closed` go to that channel; takeover evicts the channel's other sockets.
- Layer 4: replace the mapping diagram with:

   ```
   memberSessionToken ──(sessionsByToken)──▶ { roomId, memberId, role }
   socket.data.memberSessionToken / memberId   ← set on join/resume
   channel member:<memberId>                   ← sockets currently serving that member
   RoomState.membersById[memberId].connected   ← what other members see
   ```

   and in the event table: "bind socket ⇄ session" → "set `socket.data`, join the member channel"; "unbind" → "if no other socket is in the channel, mark the member disconnected".

## Risks

- **Join-before-evict ordering** is the one subtle invariant; the first integration test above guards it.
- **Multi-instance:** `hasMemberSockets` reads the local adapter only. Revisit it if the Redis adapter is introduced.
