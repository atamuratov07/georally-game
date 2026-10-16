# Player room lookup extraction

**Kind:** simplification · **Priority:** medium · **Effort:** medium

Move the room lookup out of `useRoomPlayerController` and into the join screen, and stop running it before every resume.

## Problem

`useRoomPlayerController.bootstrap` always runs **lookup → resume**. The lookup does three jobs:

1. Checks the room exists before resuming.
2. Provides `hostName` / `joinable` for the join screen.
3. Clears a stale stored session when the room is gone.

Job 1 is redundant: `deleteRoom` deletes a room's sessions, so resuming into a deleted room already fails with `member_session_not_found`, which `useRoomRuntime` treats as `rejected` — and the controller then clears the stored session itself, which makes job 3 redundant too. Only job 2 is needed, and only by the join screen.

Because the lookup sits in front of resume, the controller carries:

- a `try/catch` that exists only for the lookup (`runtime.connect` already catches and returns a result kind),
- the `!exists` branch and its session clearing,
- `roomInfo` inside the idle entry state, and a dependency on `LookupRoomFoundResponse`,
- a `step: 'lookup' | 'resume'` field that is written in three places and never read.

## Proposal

### Controller: session only

```ts
type RoomPlayerEntryState =
	| { status: 'connecting'; roomCode: string }
	| { status: 'idle'; roomCode: string; resumeMessage: string | null }
	| { status: 'error'; roomCode: string; message: string }

const bootstrap = useCallback(
	async () => {
		const runId = beginEntryRun()
		setRuntimeStarted(false)
		clearActionError()

		if (roomCode.length !== 6) {
			setEntryState({
				status: 'error',
				roomCode,
				message: i18n.t('multiplayer.error.roomCodeLength'),
			})
			return
		}

		const storedSession = loadRoomSession(roomCode, 'player')
		if (!storedSession) {
			setEntryState({ status: 'idle', roomCode, resumeMessage: null })
			return
		}

		setEntryState({ status: 'connecting', roomCode })

		const result = await runtime.connect(storedSession)
		if (!isActiveEntryRun(runId)) {
			return
		}

		switch (result.kind) {
			case 'connected':
				saveRoomSession(result.session)
				setRuntimeStarted(true)
				return
			case 'rejected':
				clearRoomSession(roomCode, 'player')
				setEntryState({
					status: 'idle',
					roomCode,
					resumeMessage: i18n.t('multiplayer.error.playerSessionExpired'),
				})
				return
			case 'error':
				setRuntimeStarted(true)
				return
			case 'aborted':
				return
		}
	},
	[/* ... */],
)
```

### Lookup: owned by the join branch

```ts
type RoomLookupState =
	| { status: 'loading' }
	| { status: 'found'; roomInfo: LookupRoomFoundResponse }
	| { status: 'error'; message: string }

export function useRoomLookup(roomCode: string) {
	const [state, setState] = useState<RoomLookupState>({ status: 'loading' })
	const [attempt, setAttempt] = useState(0)

	useEffect(() => {
		let cancelled = false
		setState({ status: 'loading' })

		lookupRoom({ roomCode }).then(
			response => {
				if (cancelled) return
				setState(
					response.exists
						? { status: 'found', roomInfo: response }
						: {
								status: 'error',
								message: i18n.t('gatewayErrors.room_not_found'),
							},
				)
			},
			error => {
				if (cancelled) return
				setState({
					status: 'error',
					message: formatGatewayErrorMessage(error),
				})
			},
		)

		return () => {
			cancelled = true
		}
	}, [roomCode, attempt])

	const retry = useCallback(() => setAttempt(n => n + 1), [])

	return { state, retry }
}
```

In `RoomPlayerPage`, the `idle` branch renders a small `PlayerJoinGate` that calls `useRoomLookup(roomCode)` and shows `RoomLoadingScreen` / `RoomErrorScreen` (with the hook's `retry`) / `PlayerJoinScreen`, passing through the controller's `resumeMessage`, pending state, submit error, and `joinRoom`.

## Effects

- **Fewer requests.** Refresh with a stored session: socket connect + resume (was connect + lookup + resume). Link without a session: one HTTP request; no socket until the player submits a name.
- **Single-purpose pieces.** The hook answers "which room is this", the controller "my session in it".
- **Two retry paths** instead of one combined `bootstrap` retry — each simpler.
- **One more component** with loading/error states.

This depends on lookup being HTTP (done): with socket lookup the join gate would need the gateway, meaning a second socket or a shared gateway.

## Caveat

A player whose resume is `rejected` briefly sees a loading state while the join gate looks the room up; today the room info is already loaded at that point. It is one fast HTTP request — not worth working around.
