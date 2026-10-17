# Server logging

The server (`apps/server/src/observability/`) writes one JSON line per event to stdout. In production both the `server` and `nginx` containers use Docker's `json-file` log driver, rotated at 10 MB × 5 files (`docker-compose.yaml`), so each container keeps at most 50 MB of logs.

## Line format

- One JSON object per line: `level` (a label such as `info`, not a number), `time` (ISO 8601, UTC), the event's fields, then `event`. pino's `messageKey` is `event`, so `logger.info({ roomId }, 'room_created')` writes `"event":"room_created"`. There is no `pid` or `hostname`.
- `LOG_LEVEL` sets the level (default `info`; one of `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`).
- Room events come from a child logger bound to `{ roomId, roomMode }`.
- Errors are logged as `{ err }` and serialized as `{ type, message, stack }`.
- The destination is synchronous, so a fatal line is fully written before the process exits.
- Local development: `pnpm dev:server` pipes the output through `pino-pretty --messageKey event`.

## Events

| `event`                                      | Level                            | Where                                                                                        | Fields                                                                                                         |
| -------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `server_started`                             | info                             | `index.ts`, on `listen`                                                                      | `host`, `port`, `nodeVersion`, `logLevel`, `statsIntervalMs`, `roomCapacityLimit`                              |
| `server_stopping`                            | info                             | `index.ts`, on SIGINT/SIGTERM                                                                | `signal`                                                                                                       |
| `server_close_failed`                        | error                            | `index.ts`, if `httpServer.close` fails                                                      | `err`                                                                                                          |
| `room_created`                               | info                             | `RoomsService.createRoom` (only reached over HTTP)                                           | `roomId`, `roomMode`                                                                                           |
| `room_closed`                                | info                             | `RoomsService.closeRoom` (terminate, expiry, shutdown)                                       | `roomId`, `roomMode`, `reason`, `phase`, `memberCount` (everyone who joined), `connectedMemberCount`, `ageMs`  |
| `game_started`                               | info                             | `RoomsService.startGame`                                                                     | `roomId`, `roomMode`, `gameId`, `participantCount`, `questionCount`                                            |
| `game_finished`                              | info                             | `RoomsService.commitRoomState`, room phase active → finished (group timer or classroom host) | `roomId`, `roomMode`, `gameId`, `participantCount`, `questionCount`, `durationMs` (first round start → finish) |
| `ack_error`                                  | warn; error for `internal_error` | `runSocketCommand` in `socket.ts`, any `{ ok: false }` reply except `invalid_payload`        | `socketEvent`, `roomId` (if the socket is bound), `code`                                                       |
| `socket_handler_failed`                      | error                            | `runSocketCommand` and the `disconnect` handler, when a handler throws                       | `socketEvent`, `roomId` (if the socket is bound), `err`                                                        |
| `http_error`                                 | warn; error for `internal_error` | `http.ts` routes and the Express error handler, except `invalid_payload`                     | `method`, `route` (the pattern, e.g. `/rooms/:roomCode`), `code`, `err` for `internal_error`                   |
| `room_advance_failed` / `room_expire_failed` | error                            | the timer callbacks in `RoomsService`                                                        | `roomId`, `err`                                                                                                |
| `stats`                                      | info                             | every `STATS_INTERVAL_MS` (default 60 s)                                                     | see [Stats line and `/health`](#stats-line-and-health)                                                         |
| `uncaught_exception` / `unhandled_rejection` | fatal                            | `observability/process.ts`, followed by `process.exit(1)`                                    | `err`                                                                                                          |

Expected domain errors such as `room_not_found` are logged at `warn`, so `LOG_LEVEL=warn` keeps them while dropping the lifecycle events. `invalid_payload` is never logged per occurrence: a broken or hostile client can produce it as fast as it can send, so it only increments the counter in the stats line. Counted sources: HTTP body schema failures, malformed JSON bodies, socket payload schema failures, and socket packets without an ack callback. All error reporting goes through `createProtocolErrorReporter` (`observability/protocolErrors.ts`).

After a fatal error Docker restarts the container (`restart: unless-stopped`) and every room is gone; clients get `member_session_not_found` when they try to resume. An invalid environment fails before the logger exists, so Node prints the Zod error as plain text on stderr.

## What is never logged

Player names, room codes and `memberSessionToken` values:

- No log call passes them. Rooms are identified by `roomId`, a UUID that never reaches the join screen, and no event includes the member list.
- HTTP errors log the route pattern (`/rooms/:roomCode`), not the URL.
- Error messages don't contain tokens (`RoomsRepository.createMemberSession` names the member id).
- Safety net: pino `redact` replaces `memberSessionToken`, `*.memberSessionToken`, `hostName`, `memberName` and `name` with `[Redacted]`. It only covers those exact paths, so the first rule is the one that matters.

Tests serialize every log line of a full room lifecycle and search for the names, the room code and the tokens (`service.test.ts`, `tests/integration/app.test.ts`).

## Stats line and `/health`

Every `STATS_INTERVAL_MS` the server logs one `stats` line, and `GET /health` returns the same fields:

| Field                      | Meaning                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `roomCount`                | rooms in memory                                                                                              |
| `connectedSessionCount`    | member sessions bound to a socket                                                                            |
| `roomsByPhase`             | `{ lobby, active, finished }`                                                                                |
| `eventLoopDelayMs.p50/p99` | event-loop delay from `perf_hooks.monitorEventLoopDelay`, in ms, with its 10 ms sampling interval subtracted |
| `cpuMs.user/system`        | CPU time used, from `process.cpuUsage`, in ms                                                                |
| `cpuPercent`               | that CPU time divided by the elapsed wall time; 100 means one core fully busy                                |
| `rssMb`, `heapUsedMb`      | `process.memoryUsage()`, in MiB                                                                              |
| `invalidPayloadCount`      | `invalid_payload` errors                                                                                     |

The stats line resets the event-loop histogram, the CPU window and the counter after it is written. `/health` reads without resetting, so it reports the window since the last stats line.

## Reading the logs

All commands run on the server, in the directory with `docker-compose.yaml`. `--no-log-prefix` removes the `server-1  | ` prefix so each line is plain JSON. `jq -R 'fromjson? | …'` skips non-JSON lines, such as Node's own output if the process dies before the logger exists.

Everything from the last hour:

```sh
docker compose logs server --since 1h --no-log-prefix | jq -cR 'fromjson?'
```

Only warnings and errors:

```sh
docker compose logs server --since 1h --no-log-prefix \
  | jq -cR 'fromjson? | select(.level == "warn" or .level == "error" or .level == "fatal")'
```

One event type, or a quick count:

```sh
docker compose logs server --since 24h --no-log-prefix | jq -cR 'fromjson? | select(.event == "room_closed") | {time, reason, phase, memberCount}'
docker compose logs server --since 24h --no-log-prefix | grep -c '"event":"game_started"'
docker compose logs server --since 24h --no-log-prefix | jq -rR 'fromjson? | select(.event == "ack_error") | .code' | sort | uniq -c | sort -rn
```

Everything about one room (take the `roomId` from any earlier line):

```sh
docker compose logs server --since 24h --no-log-prefix | grep '"roomId":"<roomId>"'
```

Crashes, then the restart:

```sh
docker compose logs server --since 7d --no-log-prefix | jq -cR 'fromjson? | select(.level == "fatal" or .event == "server_started") | {time, event, err: .err.message}'
```

Peak connected session count over a time range, with the time of the peak. `--since`/`--until` accept RFC 3339 timestamps; keep the `Z`, because without a zone Docker uses the local time zone of the machine running the command:

```sh
docker compose logs server --since 2026-10-20T03:00:00Z --until 2026-10-20T10:00:00Z --no-log-prefix \
  | jq -nR '[inputs | fromjson? | select(.event == "stats")] | max_by(.connectedSessionCount) | {time, connectedSessionCount, roomCount, roomsByPhase}'
```

The stats line is a sample, so a peak shorter than `STATS_INTERVAL_MS` can fall between two lines. For the total `invalid_payload` count in a range, use the filter `[inputs | fromjson? | select(.event == "stats") | .invalidPayloadCount] | add`.

429 responses for room creation in the nginx access log. The `nginx:1.27-alpine` image uses the default `main` log format, in which the 7th space-separated field is the path and the 9th the status:

```sh
docker compose logs nginx --since 24h --no-log-prefix | awk '$7 == "/api/rooms" && $9 == 429' | wc -l
docker compose logs nginx --since 24h --no-log-prefix | awk '$7 == "/api/rooms" && $9 == 429 {print $1}' | sort | uniq -c | sort -rn | head
```

The second command lists the limited client addresses. nginx also writes one error-log line per rejected request:

```sh
docker compose logs nginx --since 24h --no-log-prefix | grep -c 'limiting requests.*zone "room_create"'
```

`docker compose logs --since` only sees what has not been rotated away; for longer history, ship the logs elsewhere.
