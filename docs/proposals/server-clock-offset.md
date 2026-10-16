# Server clock offset for countdowns

**Kind:** bug (user-facing) · **Priority:** high · **Effort:** small

Make round countdowns and timed UI gates use the server's clock instead of each device's own clock.

## Problem

Round timing is decided on the server (`RoomsService` uses `this.now()`; `deadlineAt`, `revealedAt`, `leaderboardShownAt` are server timestamps). The client compares those timestamps against its **local** `Date.now()`:

- `game/hooks/useCountdown.ts` — `deadlineAt - Date.now()`, used by `GameQuestionBar` for the seconds-left display.
- `game/hooks/useTimestampGate.ts` — `Date.now() - startedAt`, used by `LeaderboardOverlay` to delay the leaderboard list.

Nothing corrects for the difference between the two clocks. Device clocks drift, and school-managed Chromebooks and phones are often seconds to minutes off.

## Impact

- A device whose clock is **ahead** by 20 s shows 10 s left on a 30 s question, and can show 0 while the round is still open — players give up answering while they still could.
- A device **behind** shows more time than exists; the round "unexpectedly" closes.
- `useTimestampGate` delays are equally skewed (leaderboard list appears early or late).

Answer acceptance itself is unaffected — the server decides — so this is a display problem, but it directly changes how players behave.

## Proposal

Send the server's current time with every snapshot and session response, derive a clock offset on the client, and use "server now" in all timing hooks.

### Protocol (`packages/game-protocol/src/responses.ts`)

Add `serverNow: number` to the envelopes, not to the domain views:

```ts
export type HostRoomSnapshotEvent = {
	roomId: RoomId
	serverNow: number
	snapshot: ClassroomHostRoomView | GroupHostRoomView
}

export interface PlayerRoomSnapshotEvent {
	roomId: RoomId
	serverNow: number
	snapshot: RoomPlayerView
}
```

and likewise to `JoinRoomResponse`, `ResumeHostRoomResponse`, `ResumePlayerRoomResponse`.

### Server

- `createRoomPublisher` takes an injectable clock (`now?: () => number`, default `Date.now`) and adds `serverNow: now()` to every snapshot emit.
- `RoomsService.joinRoom` / `resumeHostRoom` / `resumePlayerRoom` add `serverNow: this.now()` to their responses (the service already has an injectable `now`).

### Client

A module-level clock is enough — there is one game server, and the timing hooks re-render on their own intervals anyway:

```ts
// apps/web/src/multiplayer-game/model/serverClock.ts
let clockOffsetMs = 0

export function syncServerClock(serverNow: number): void {
	clockOffsetMs = serverNow - Date.now()
}

export function getServerNow(): number {
	return Date.now() + clockOffsetMs
}
```

- Call `syncServerClock(payload.serverNow)` wherever a snapshot or session response arrives: `useRoomRuntime` (`onRoomSnapshot`, after `adapter.resume`) and `useRoomPlayerController.joinRoom` (join response).
- Replace every `Date.now()` in `useCountdown` and `useTimestampGate` with `getServerNow()`.

A React context would avoid the module-level state, but it adds a provider and prop plumbing for a value that is genuinely global.

### Optional refinement: latency bias

`serverNow - Date.now()` at receipt underestimates the offset by the one-way network delay (tens of ms), so countdowns show marginally more time than remains. If that ever matters, keep the last ~10 samples and use the **largest** offset: the sample with the least delay is the most accurate, and the true offset does not change between samples.

## Tests

- Integration (`app.test.ts`): snapshot events and join/resume responses include a numeric `serverNow`.
- Service unit tests: with an injected `now`, responses carry exactly that value.
- Client: no automated tests exist yet. Manually: set the OS clock 30 s ahead, join a room, and confirm the countdown matches a device with a correct clock.

## Risks

- Every place that receives a snapshot must call `syncServerClock`; missing one only means a stale (not wrong) offset.
- Analytics `responseTimeMs` already subtracts two server timestamps and needs no change.
