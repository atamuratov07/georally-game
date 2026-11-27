# Persistence model

GeoRally has no server database. The server keeps rooms in memory. The browser keeps sessions, saved games and personal bests in `localStorage`, and review progress in IndexedDB.

## Browser persistence

- `multiplayer-game/session/sessionStorage.ts` saves host/player room sessions in `localStorage` — room code, member ID, role, and `memberSessionToken`.
- `multiplayer-game/model/gameConfig.ts` saves the host's last multiplayer game config, keyed by room code.
- `shared/feedback/useReactionPrompt.ts` saves how many games the player has finished and when the game reaction was last shown in each mode (see [`feedback.md`](feedback.md)).
- `shared/layout/sky.ts` saves the page sky (`georally.sky`: evening or night; day is the default and isn't saved). An inline script in `index.html` sets `data-sky` on `<html>` from it before the first paint.
- Singleplayer saves the game in progress (one per mode, discarded after 7 days) and personal bests in `localStorage` (see [`singleplayer.md`](singleplayer.md#saved-games)).

## Review progress

Review keeps the player's progress in IndexedDB (database `georally-mastery`). Its stores and rules are in [`mastery.md`](mastery.md#data).

- **IndexedDB, not `localStorage`:** the review log grows by about 30 entries a day for a daily player, and writing a card, its log entry and a cleared recheck must happen in one transaction.
- **It can still be lost.** Browsers clear it in private browsing, when the player clears site data, under low disk space, and in Safari after seven days without a visit; an app added to the iOS home screen has its own separate storage. To lower the risk, `navigator.storage.persist()` is requested on the session summary, once the player has stored progress. Each browser decides whether to grant it.
- **Invalid records are kept.** Unlike the saved games, which are discarded when invalid, an unreadable review record is skipped and left in place, since it may come from a newer version of the app.

## Server persistence

- `RoomsRepository` stores rooms, member sessions, socket bindings, and scheduled timers in memory only.
- A server restart invalidates all live rooms and member sessions.
- On shutdown, the service emits `room:closed` with reason `server_shutdown` to connected clients before closing Socket.IO.

## Implications

- Reconnect only works while the in-memory room/session still exists on the same server process.
- Horizontal scaling would require a shared backing store and a cross-instance event strategy.
- There is no persisted history of past multiplayer games; once a room is closed, its state is gone.
- Review progress exists on one device only. There is no account, export or sync.

See [`multiplayer.md`](multiplayer.md) for how sessions and rooms are used day to day.
