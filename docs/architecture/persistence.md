# Persistence model

GeoRally currently has no database. There are two persistence layers, both non-durable across restarts.

## Browser persistence

- `multiplayer-game/session/sessionStorage.ts` saves host/player room sessions in `localStorage` — room code, member ID, role, and `memberSessionToken`.
- `multiplayer-game/model/gameConfig.ts` saves the host's last multiplayer game config, keyed by room code.
- `shared/feedback/useReactionPrompt.ts` saves how many games the player has finished and when the game reaction was last shown in each mode (see [`feedback.md`](feedback.md)).
- Singleplayer config is represented entirely in the `/singleplayer/play` URL query string (see [`singleplayer.md`](singleplayer.md)) — nothing is written to `localStorage` for singleplayer.

## Server persistence

- `RoomsRepository` stores rooms, member sessions, socket bindings, and scheduled timers in memory only.
- A server restart invalidates all live rooms and member sessions.
- On shutdown, the service emits `room:closed` with reason `server_shutdown` to connected clients before closing Socket.IO.

## Implications

- Reconnect only works while the in-memory room/session still exists on the same server process.
- Horizontal scaling would require a shared backing store and a cross-instance event strategy.
- There is no persisted history of past games; once a room is closed, its state is gone.

See [`multiplayer.md`](multiplayer.md) for how sessions and rooms are used day to day.
