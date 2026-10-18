# Connection lifecycle

How a multiplayer client stays connected to a room, and which part of the stack is responsible for what. The short version: Socket.IO keeps a _connection_ alive; GeoRally keeps a _player in a room_ alive. A reconnected socket is not a returned player until the client re-identifies itself.

- [The layers](#the-layers)
- [Layer 1: Engine.IO (the connection)](#layer-1-engineio-the-connection)
- [Layer 2: Manager (client reconnection loop)](#layer-2-manager-client-reconnection-loop)
- [Layer 3: Socket.IO socket](#layer-3-socketio-socket)
- [Layer 4: Game session](#layer-4-game-session)
- [Layer 5: UI runtime](#layer-5-ui-runtime)
- [Scenarios](#scenarios)
- [Who handles what](#who-handles-what)

## The layers

```
┌────────────────────────────────────────────────────────────┐
│ 5. UI runtime        connecting / ready / reconnecting /   │  GeoRally (client)
│                      closed / error                        │
├────────────────────────────────────────────────────────────┤
│ 4. Game session      memberSessionToken → member,          │  GeoRally (server + client)
│                      member channel, connected flag, TTLs  │
├────────────────────────────────────────────────────────────┤
│ 3. Socket.IO socket  namespace /game, socket.id,           │  Socket.IO
│                      socket.data, events + acks            │
├────────────────────────────────────────────────────────────┤
│ 2. Manager           reconnection loop with backoff        │  Socket.IO (client)
├────────────────────────────────────────────────────────────┤
│ 1. Engine.IO         HTTP polling → WebSocket upgrade,     │  Socket.IO
│                      heartbeat (ping/pong)                 │
└────────────────────────────────────────────────────────────┘
```

Socket.IO owns layers 1–3 and knows nothing about players, GeoRally rooms, or session tokens. Layers 4–5 are ours.

## Layer 1: Engine.IO (the connection)

- Opens the physical connection: an HTTP long-polling handshake (this is what nginx proxies under `/socket.io/`), then an upgrade to WebSocket.
- Detects dead connections with a heartbeat: the server pings every `pingInterval` (default 25 s) and expects a pong within `pingTimeout` (default 20 s).
- A dropped Wi-Fi connection often does not close the TCP socket, so the heartbeat is the only way either side notices. **A member can therefore appear connected for up to ~45 s after their network dies.**

**We handle:** nothing. `pingInterval` / `pingTimeout` can be tuned for faster disconnect detection, at the cost of more traffic and more false disconnects on mobile devices.

## Layer 2: Manager (client reconnection loop)

- `io(url)` creates a Manager that owns the Engine.IO connection.
- With `reconnection: true` it retries forever with backoff (defaults: 1 s initial delay, 5 s maximum, randomized so a whole classroom does not reconnect in lockstep).
- It does **not** retry after an intentional disconnect: the client calling `socket.disconnect()` (reason `'io client disconnect'`) or the server calling `socket.disconnect(true)` (reason `'io server disconnect'`).

**We handle:** nothing. We never run our own retry timer on top of this loop.

## Layer 3: Socket.IO socket

The object we call `.on` / `.emit` on, scoped to the `/game` namespace.

- **Client:** `'connect'` fires on the first connection _and on every reconnection_. `'disconnect'` fires with a reason (`'transport close'`, `'ping timeout'`, `'io server disconnect'`, `'io client disconnect'`, …).
- **`socket.id` changes on every reconnection.** To the server, a reconnected client is a brand-new socket.
- **Server:** each connection is a fresh `socket` with empty `socket.data`. On disconnect, `'disconnect'` fires and that socket's `socket.data` is discarded.

`connectionStateRecovery` is deliberately **not** enabled. It only restores a socket when the same in-memory client reconnects within a time window, so it cannot cover page refreshes, discarded mobile tabs, or long outages, which the token-based resume (layer 4) already covers. Its missed-packet replay also adds nothing here. Every reconnection goes through resume, and the resume ack carries the full room state at the current revision, which supersedes anything missed. On a live connection, every commit publishes one `room:update` with a consecutive revision, so a missed update shows up as a gap and the client resumes again ([`multiplayer.md`](multiplayer.md#room-updates)).

Socket.IO also has its own "rooms" (`socket.join(...)`, broadcast groups of socket ids), called **channels** here to avoid confusion with GeoRally rooms. Every socket that serves a member joins `member:<memberId>` and `room:<roomId>` (`channels.ts`). Per-viewer and host-only parts go to the member channel; the shared `room:update` and `room:closed` go to the room channel, so each is serialized once per room. The server never stores socket ids. On tab takeover the new socket joins the channel first and then evicts every other socket in it.

## Layer 4: Game session

Socket.IO cannot tell which member a socket belongs to. The server keeps that mapping in `RoomsRepository`:

```
memberSessionToken ──(sessionsByToken)──▶ { roomId, memberId, role }
socket.data.memberSessionToken / memberId   ← set on join/resume
channel member:<memberId>                   ← sockets currently serving that member
RoomState.membersById[memberId].connected   ← what other members see
```

`RoomsService` never sees a socket: join and resume take a token or a room code, and the socket layer calls `disconnectMember(roomId, memberId)` from `socket.data`.

| Event                                                   | Server behavior                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `POST /api/rooms` (HTTP)                                | Create the host's session with no socket; the host stays disconnected until it resumes.                                 |
| New socket connects                                     | Nothing. The socket is anonymous until it joins or resumes.                                                             |
| `room:join` / `room:host-resume` / `room:player-resume` | Mark the member connected, broadcast, set `socket.data`, join the member and room channels, return the full room state. |
| A second socket resumes the same token                  | Join the member channel, then `disconnect(true)` every other socket in it (tab takeover).                               |
| A bound socket resumes a _different_ token              | Rejected with `unauthorized`; one socket serves at most one session.                                                    |
| Socket `'disconnect'`                                   | If no other socket is in the member channel, mark the member disconnected, broadcast, start expiry TTLs.                |
| Room expires / is terminated / server stops             | Emit `room:closed`, delete the room and its sessions.                                                                   |

The `memberSessionToken`, persisted in `localStorage`, is the only identity that outlives a socket. It is what lets a member survive a refresh, a crash, or any reconnection.

Join before evict is the one ordering rule. Socket.IO removes a socket from its channels before firing `'disconnect'`, so anything still in the channel is a different socket. Evicting first would let the old socket's handler find an empty channel and mark the member disconnected, and everyone in the room would see a "disconnected → connected" flicker. The same check covers a refresh where the new page resumes before the server notices that the old socket died (up to ~45 s, layer 1). `hasMemberSockets` reads the local adapter only; with the Redis adapter it would have to become `fetchSockets()`.

## Layer 5: UI runtime

`useRoomRuntime` translates layer-3 events into screen states: `reconnecting` while the transport is down, `ready` only once the session is bound again.

- On `'disconnect'` with reason `'io server disconnect'`: the session was taken over by another tab. Stop and show an error; do not resume (resuming would evict the other tab, which would then do the same, forever).
- On any other `'disconnect'`: show `reconnecting` and wait. The Manager is already retrying.
- On `'connect'` after the session was established: send the resume request once. Success → `ready`; a rejected token → session expired; any other failure → error (a later `'connect'` will try again). Host and player pages both do this.
- On a `room:update` whose revision skips one: show `reconnecting` and resume on the same socket. The resume ack replaces the whole client state.

## Scenarios

**Network blip**

```
L1  network drops ─ heartbeat times out ────────────── Manager reconnects ─▶
L3  client: 'disconnect' (ping timeout)                'connect' (new socket.id)
L4  server: disconnectMember → connected=false         ← resume(token) → join channel, connected=true
L5  ready ─▶ reconnecting ───────────────────────────────────────────────▶ ready
```

**Page refresh**

```
L3  old socket: 'disconnect' (transport close)   new page: new Manager + socket
L4  server: connected=false                      client reads token from localStorage → resume
L5  (page reloads) ────────────────────────────▶ connecting ─▶ ready
```

**Second tab takes over**

```
L4  tab B resumes the token → B joins the member channel, server disconnect(true)s A
L3  tab A: 'disconnect' ('io server disconnect') → Manager does NOT retry
L5  tab A shows "session opened elsewhere" and stops
```

**Server restart / deploy**

```
L4  shutdown emits room:closed (server_shutdown); all in-memory state is lost
L5  closed screen. A later resume would get member_session_not_found.
```

## Who handles what

| Concern                                                       | Owner                                             |
| ------------------------------------------------------------- | ------------------------------------------------- |
| Connection setup, WebSocket upgrade, heartbeat                | Socket.IO (Engine.IO)                             |
| Retrying with backoff after a drop                            | Socket.IO (Manager)                               |
| Reporting that a drop or reconnect happened, and why          | Socket.IO (`'disconnect'` reason, `'connect'`)    |
| Knowing which member a socket belongs to                      | GeoRally: join / resume with the token            |
| Re-identifying after every reconnect (`socket.id` changes)    | GeoRally: resume on `'connect'`                   |
| Marking members connected / disconnected and notifying others | GeoRally: `disconnectMember`, `RECONNECT_MEMBER`  |
| Tab-takeover policy                                           | GeoRally: evict on the server, stop on the client |
| When a room dies                                              | GeoRally: expiry TTLs                             |
| What the user sees                                            | GeoRally: `useRoomRuntime`                        |

See [`multiplayer.md`](multiplayer.md) for the room/game model and protocol, and [`persistence.md`](persistence.md) for what survives a restart.
