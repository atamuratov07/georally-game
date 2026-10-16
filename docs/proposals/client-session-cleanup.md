# Client session cleanup

**Kind:** simplification · **Priority:** low · **Effort:** small

Small simplifications in `apps/web/src/multiplayer-game/session/`.

## 1. Fold the host action hooks into the controller

`useGroupHostActions` and `useClassroomHostActions` (~90 lines together) each wrap one or two gateway calls. To make that possible, `useRoomHostController` exports its `gateway` and `runAction`, and `RoomHostPage` wires all three hooks together.

Move the three actions (`submitAnswer`, `revealRound`, `advanceRound`) into `useRoomHostController` next to `startGame` / `returnToLobby` / `terminateRoom`, delete the two files, and stop exporting `gateway` and `runAction` from the controller.

## 2. Gate "ready" in one place

Every action (in both controllers and both helper hooks) repeats:

```ts
if (runtime.state.status !== 'ready') {
	return
}
await runAction('x', async () => { ... })
```

Wrap it once per controller:

```ts
const runReadyAction = useCallback(
	async (action: RoomHostAction, task: () => Promise<unknown>) => {
		if (runtime.state.status !== 'ready') {
			return
		}

		await runAction(action, async () => {
			await task()
		})
	},
	[runAction, runtime.state.status],
)

const revealRound = useCallback(
	() => runReadyAction('reveal', () => gateway.revealRound({})),
	[gateway, runReadyAction],
)
```

`startGame` still needs its custom body (it reads `roomMode` / `connectedMemberCount` from the ready state for analytics) but can call `runReadyAction` too.

## 3. Remove dead code

- **`step: 'lookup' | 'resume'`** in `useRoomPlayerController`'s entry state is written in three places and never read. (It disappears anyway with the [lookup extraction](player-room-lookup-extraction.md).)
- **`delete store[roomCode.toUpperCase()]`** in `sessionStorage.clearRoomSession` cleans up a storage key format that predates the `role:code` keys. `readStore` drops entries older than `SESSION_TTL_MS` (7 days) regardless of key shape, so legacy entries are long gone.

## Tests

No client test suite exists. Verify manually: host a group room (answer as host), host a classroom room (reveal / advance), and confirm actions are ignored while the runtime shows "reconnecting".
