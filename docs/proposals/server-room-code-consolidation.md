# Server room code consolidation

**Kind:** simplification · **Priority:** low · **Effort:** medium

Remove the remaining duplication in the server's room feature: repeated socket-handler boilerplate, two near-identical resume methods, and room-view projection done in two places.

Do this together with the [Socket.IO member channels](socketio-member-channels.md) refactor if both are planned — they touch the same resume handlers and service methods.

## 1. Finish the socket handler helper

`socket.ts` has `handleSessionCommand` (auth → parse → run → ack), but only `room:return-to-lobby` and `game:start` use it. `room:terminate`, `game:reveal-round`, `game:advance-round`, and `game:submit-answer` still repeat the same ~25 lines each.

`room:terminate` is the only one with extra work (it clears the socket identity on success). Give the helper an optional success callback:

```ts
function handleSessionCommand<TPayload, TResult>(
	socket: GameSocket,
	schema: ZodType<TPayload>,
	payload: unknown,
	ack: AckCallback<TResult>,
	run: (
		memberSessionToken: string,
		value: TPayload,
	) => Result<TResult, RoomProtocolError>,
	onSuccess?: (result: TResult) => void,
): void {
	const auth = requireAuthenticated(socket)
	if (!auth.ok) return respondWithError(ack, { code: 'unauthorized' })

	const parsed = parsePayload(schema, payload)
	if (!parsed.ok) return respondWithError(ack, { code: 'invalid_payload' })

	const result = run(auth.value, parsed.value)
	if (!result.ok) return respondWithError(ack, result.error)

	onSuccess?.(result.value)
	respondWithSuccess(ack, result.value)
}

socket.on('room:terminate', (payload, ack) =>
	handleSessionCommand(
		socket,
		terminateRoomRequestSchema,
		payload,
		ack,
		token => roomsService.terminateRoom({ memberSessionToken: token }),
		() => clearSocketIdentity(socket),
	),
)

socket.on('game:submit-answer', (payload, ack) =>
	handleSessionCommand(
		socket,
		submitAnswerRequestSchema,
		payload,
		ack,
		(token, value) =>
			roomsService.submitAnswer({
				memberSessionToken: token,
				countryId: value.countryId,
			}),
	),
)
```

`room:join` and the two resume handlers keep custom logic (they authenticate the socket rather than require it).

## 2. One resume path in the service

`resumeHostRoom` and `resumePlayerRoom` are ~65 nearly identical lines each; they differ only in the expected role and which view is built. Extract the shared part and keep the two public methods as thin, typed wrappers:

```ts
private resumeMember(
	memberSessionToken: MemberSessionToken,
	expectedRole: RoomMemberRole,
): ServiceResult<{ state: RoomState; memberId: MemberId }> {
	const session = this.repository.getMemberSession(memberSessionToken)
	if (!session) {
		return err({ code: 'member_session_not_found' })
	}
	if (session.role !== expectedRole) {
		return err({ code: 'insufficient_permissions' })
	}

	const context = this.repository.getRoomById(session.roomId)
	if (!context) {
		return err({ code: 'room_not_found' })
	}

	const member = context.state.membersById[session.memberId]
	if (!member) {
		return err({ code: 'member_session_not_found' })
	}

	if (member.connected) {
		return ok({ state: context.state, memberId: session.memberId })
	}

	const reconnected = applyRoomCommand(context.state, {
		type: 'RECONNECT_MEMBER',
		id: session.memberId,
		now: this.now(),
	})
	if (!reconnected.ok) {
		return reconnected
	}

	this.commitRoomState(reconnected.value.roomId, reconnected.value, {
		excludeMemberId: session.memberId,
	})

	return ok({ state: reconnected.value, memberId: session.memberId })
}
```

(Socket binding — `bindSocketToSession` / `replacedSocketId` — stays in the wrappers until the member-channels refactor removes it.)

## 3. One place that picks the host view

Both the service (`buildGroupHostRoomSnapshot` / `buildClassroomHostRoomSnapshot`) and `publisher.ts` decide between `toGroupHostRoomView` and `toClassroomHostRoomView`. Add one domain function next to the views in `room/visibility.ts`:

```ts
export function toHostRoomView(
	state: RoomState,
	memberId: MemberId,
): RoomHostView | null {
	return isRoomInGroupMode(state)
		? toGroupHostRoomView(state, memberId)
		: toClassroomHostRoomView(state, memberId)
}
```

The publisher and the service both call it; the two `build*HostRoomSnapshot` helpers collapse into one (or disappear, with the `internal_error` mapping inlined).

## Tests

Pure refactor: the existing `service.test.ts` and `app.test.ts` suites must pass unchanged. No new tests needed.
