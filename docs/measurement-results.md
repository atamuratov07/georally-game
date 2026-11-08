# Measurement results

How to read the tables:

- **Before** is the slowest state measured for that benchmark, **after** the fastest. Where a benchmark has several runs of the same state, the run used is named.
- Every number comes from a result file in `apps/server/bench/results/` or `packages/country-build/bench/results/`, produced by the command listed with the table. Percentages and ratios are arithmetic on those numbers. Nothing is estimated.
- KiB and MiB are 1 024 and 1 048 576 bytes. Times are in ms unless the column says otherwise.

Contents:

- [Environment](#environment)
- [1. Payload per update](#1-payload-per-update)
- [2. Load: single-room sweep](#2-load-single-room-sweep)
- [3. Load: concurrent rooms](#3-load-concurrent-rooms)
- [4. Load: ramp](#4-load-ramp)
- [5. Load: reconnect storms](#5-load-reconnect-storms)
- [6. Load: idle memory](#6-load-idle-memory)
- [7. permessage-deflate](#7-permessage-deflate)
- [8. Data pipeline time and size](#8-data-pipeline-time-and-size)
- [Not benchmarked](#not-benchmarked)

## Environment

Every benchmark ran on the same machine:

| Field   | Value                                                                            |
| ------- | -------------------------------------------------------------------------------- |
| Machine | Apple M5, 10 cores, 16 GiB RAM                                                   |
| OS      | macOS 26.6.2 (Darwin 25.6.0 arm64)                                               |
| Node    | v26.0.0                                                                          |
| Docker  | 29.6.2, image `tippecanoe:latest` `sha256:0a76a062…` (data pipeline only)        |
| Network | Load bench: server and generator on the same machine, over `127.0.0.1`, no nginx |

## 1. Payload per update

What one state change costs in messages, JSON serializations and bytes, built through the real `RoomsService` and publisher with a recording namespace (no network, fake clock, deterministic sizes). World scope, difficulty `hard`, 10 questions.

|         |                                                                                     |
| ------- | ----------------------------------------------------------------------------------- |
| Command | `pnpm -F @georally/server bench:payload -- --label before` / `--label after`        |
| Before  | `payload-before.json`, code at `a9d637d6` (`dev` + Phase 1), committed in `a49e59f` |
| After   | `payload-after.json`, code at `c26d7de` (Phase 3), committed in `42c16f3`           |

**Optimizations between before and after (Phase 3):**

1. One Socket.IO channel per member and one per room; the service no longer addresses sockets.
2. Each update is split into a shared part, sent once to the room channel (serialized once for every recipient), and a small per-viewer part (`viewerSubmission`, `viewerScore`, `viewerCorrectCount`, `viewerRank`) sent to the member channel only when it changed.
3. Per-game constants (`eligibleCountryIds`, `questionCount`, `scope`, `participantCount`) sent once at game start and in join/resume responses, cached by `gameId` on the client.
4. `members` sent only when membership or a connection flag changed.
5. `lastGameResult` sent once, in the finishing commit, instead of in every update after the game ends.
6. Leaderboard and visible member list computed once per commit instead of once per viewer.

| Metric                                           | Mode / N     |      Before |      After | Change |
| ------------------------------------------------ | ------------ | ----------: | ---------: | -----: |
| Messages per answer (incl. the ack)              | group 30     |          32 |          3 |        |
|                                                  | group 40     |          42 |          3 |        |
|                                                  | group 80     |          82 |          3 |        |
| JSON serializations per answer                   | group 30     |          32 |          3 |        |
|                                                  | group 40     |          42 |          3 |        |
|                                                  | group 80     |          82 |          3 |        |
| Bytes a non-answering player gets per answer     | group 30     |       5 805 |        576 | −90.1% |
|                                                  | group 40     |       7 007 |        576 | −91.8% |
|                                                  | group 80     |      11 801 |        576 | −95.1% |
| Server bytes per answer                          | group 30     |     179 337 |     18 218 | −89.8% |
|                                                  | group 40     |     286 444 |     23 980 | −91.6% |
|                                                  | group 80     |     954 130 |     47 020 | −95.1% |
|                                                  | classroom 30 |     181 738 |     22 115 | −87.8% |
|                                                  | classroom 40 |     290 070 |     29 102 | −90.0% |
| Server bytes per round (round 9)                 | group 30     |   6 014 329 |    723 328 | −88.0% |
|                                                  | group 40     |  12 482 930 |  1 231 458 | −90.1% |
|                                                  | group 80     |  79 824 492 |  4 603 292 | −94.2% |
|                                                  | classroom 30 |   5 635 798 |    705 080 | −87.5% |
|                                                  | classroom 40 |  11 895 040 |  1 218 915 | −89.8% |
| JSON serializations per round (round 9)          | group 30     |       1 054 |        187 |        |
|                                                  | group 40     |       1 804 |        247 |        |
|                                                  | group 80     |       6 804 |        487 |        |
| Server bytes per game (start + 10 rounds)        | group 30     |  62 057 888 |  9 066 627 | −85.4% |
|                                                  | group 40     | 128 146 981 | 15 476 688 | −87.9% |
|                                                  | group 80     | 810 996 520 | 58 098 619 | −92.8% |
| JSON serializations per game                     | group 30     |      10 580 |      1 880 | −82.2% |
| Server bytes for the lobby (host resume + joins) | group 30     |   1 473 188 |  1 440 653 |  −2.2% |

Notes:

- After the change a non-answering player's bytes per answer no longer depend on N (573–580 bytes for N = 5 to 80).
- The lobby barely changed: every join changes `members`, and `members` still goes to everyone. Left as is because joins happen once per game.
- Round 10 is still dominated by the game result (2 493 553 server bytes at group N = 30, against 723 328 for round 9), now sent once instead of on every later disconnect.

## 2. Load: single-room sweep

One `group` room of N players plus the host, 10 questions of 10 s, a separate production server process per run (`ROOM_CAPACITY_LIMIT=1000`). `spread`: each answer at a random 1–8 s; `burst`: all answers within about 10 ms.

|          |                                                                                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Command  | `caffeinate -i pnpm -F @georally/server bench:load -- --label before` / `--label after` (all scenarios; sections 2–6 come from these two runs)                                                                           |
| Before   | `load-sweep-before.json`, code at `3fa5b3ab` (`dev` + Phase 1), run 2026-10-17 from 17:33 UTC, committed in `768c8cb`                                                                                                    |
| After    | `load-sweep-after.json`, code at `aa6368a` (Phase 3), run 2026-10-18 from 07:06 UTC, committed in `4aeec80`                                                                                                              |
| Validity | Every run valid (generator event-loop p99 ≤ 3.74 ms, limit 50 ms) and passed every correctness check: every answer accepted once, `answeredCount == participantCount` at reveal, identical final results on every client |

**Optimizations between before and after:** the Phase 3 changes listed in [section 1](#1-payload-per-update).

Each cell is before → after (change).

|   N | Timing | answer→reveal p95       | submit ack p95 | server CPU ms per round  | MiB sent by server per round | KiB per client per round | server ELD p99 (max 1 s window) |
| --: | ------ | ----------------------- | -------------- | ------------------------ | ---------------------------- | ------------------------ | ------------------------------- |
|  30 | spread | 5.45 → 5.26 (−3.5%)     | 5.95 → 3.84    | 206.5 → 113.17 (−45.2%)  | 5.92 → 0.86 (−85.5%)         | 195.5 → 28.4 (−85.5%)    | 5.44 → 2.58                     |
|  40 | spread | 6.88 → 5.53 (−19.6%)    | 7.5 → 4.1      | 319.69 → 151.98 (−52.5%) | 12.21 → 1.47 (−88.0%)        | 305.1 → 36.7 (−88.0%)    | 6.1 → 3.93                      |
|  80 | spread | 12.91 → 8.83 (−31.6%)   | 17.29 → 6.4    | 975.72 → 284.08 (−70.9%) | 77.44 → 5.52 (−92.9%)        | 979.0 → 69.7 (−92.9%)    | 15.49 → 6.16                    |
|  30 | burst  | 43.3 → 16.62 (−61.6%)   | 40.45 → 16.09  | 96.58 → 60.21 (−37.7%)   | 5.91 → 0.86                  | 195.2 → 28.4             | 11.79 → 4.04                    |
|  40 | burst  | 67.47 → 29.49 (−56.3%)  | 61.71 → 25.09  | 136.72 → 80.31 (−41.3%)  | 12.26 → 1.47                 | 306.2 → 36.7             | 21.46 → 6.56                    |
|  80 | burst  | 233.22 → 53.28 (−77.2%) | 208.5 → 46.4   | 315.35 → 106.78 (−66.1%) | 77.4 → 5.52                  | 978.5 → 69.7 (−92.9%)    | 14.53 → 18.85                   |

The slowest state measured is N = 80 `burst` before (answer→reveal p95 233.22 ms); after the change the same state is 53.28 ms.

Notes:

- **Two cells got worse:** the worst event-loop p99 window at N = 80 `burst` (14.53 → 18.85 ms, above) and at N = 10 `spread` (1.91 → 9.43 ms). Both are the maximum of a single one-second window; latency and CPU in the same runs improved. Not explained by any measurement; repeating those two runs showed they don't recur.
- **Clients receive slightly more messages** (33.1 → 36.97 per round at N = 30): the per-viewer parts at reveal, leaderboard and round open are extra messages, each under 1 KiB.

## 3. Load: concurrent rooms

R rooms of 30 players plus host at the same time; all rooms join first, then every host starts at the same moment.

|                |                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Before / after | `load-concurrent-before.json` / `load-concurrent-after.json`, same runs and commits as [section 2](#2-load-single-room-sweep) |
| Optimizations  | Phase 3 (section 1)                                                                                                           |

|   R | Timing | answer→reveal p95 | submit ack p95 | server CPU ms per round | server CPU % (max 1 s window) | server ELD p99 (max window) | server RSS MB (max) |
| --: | ------ | ----------------: | -------------: | ----------------------: | ----------------------------: | --------------------------: | ------------------: |
|   1 | spread |          6.37 → 5 |     6.06 → 3.8 |         196.29 → 114.38 |                    7.01 → 5.3 |                 4.67 → 2.98 |        95.5 → 92.56 |
|   5 | spread |       5.48 → 3.76 |    5.85 → 2.95 |         625.44 → 279.29 |                 15.51 → 10.35 |                 4.49 → 3.19 |     157.66 → 112.73 |
|  10 | spread |       5.56 → 3.55 |     6.61 → 2.7 |        1 450.3 → 433.03 |                 29.75 → 15.24 |                12.36 → 4.04 |     171.91 → 127.63 |
|  15 | spread |       5.43 → 3.61 |    7.02 → 2.63 |       2 146.09 → 607.28 |                 40.97 → 20.37 |                17.57 → 5.35 |      224.2 → 152.08 |
|   1 | burst  |     48.19 → 17.58 |  39.72 → 15.12 |           95.29 → 61.39 |                   7.71 → 5.89 |                 16.8 → 3.35 |      117.47 → 94.14 |
|   5 | burst  |    107.28 → 48.83 |  83.65 → 38.42 |         226.67 → 124.85 |                 19.84 → 10.07 |               52.91 → 19.44 |     201.67 → 118.45 |
|  10 | burst  |    189.38 → 62.82 | 123.31 → 51.12 |          450.1 → 169.69 |                 32.67 → 15.66 |                  74.28 → 27 |     280.22 → 126.33 |
|  15 | burst  |    259.26 → 77.05 | 201.02 → 63.94 |         563.19 → 231.81 |                 42.76 → 20.91 |               71.85 → 28.83 |     321.23 → 191.41 |

The slowest state measured in the whole load bench is R = 15 `burst` before: 15 rooms answering in sync, answer→reveal p95 259.26 ms, just above the ramp's 250 ms limit. After: 77.05 ms (−70.3%), event-loop p99 71.85 → 28.83 ms (−59.9%), CPU per round −58.8%, max RSS −40.4%. With `spread`, 15 rooms use 71.7% less CPU per round (2 146.09 → 607.28 ms).

## 4. Load: ramp

A room of 30 players is added every 20 s, until a 20-second step's answer→reveal p95 exceeds 250 ms, an ack error appears, or 30 rooms (930 sockets) are reached. Rooms play games back to back, so their rounds drift apart.

|                |                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Before / after | `load-ramp-before.json` / `load-ramp-after.json`, same runs and commits as [section 2](#2-load-single-room-sweep) |
| Optimizations  | Phase 3 (section 1)                                                                                               |

| Metric                                     | Timing |         Before |          After | Change |
| ------------------------------------------ | ------ | -------------: | -------------: | -----: |
| Stop point                                 | spread | 30 rooms (cap) | 30 rooms (cap) |        |
|                                            | burst  | 30 rooms (cap) | 30 rooms (cap) |        |
| Highest step answer→reveal p95             | spread |           10.1 |           5.39 | −46.6% |
|                                            | burst  |          58.86 |          17.76 | −69.8% |
| Highest step server CPU % (max 1 s window) | spread |          37.16 |          15.43 | −58.5% |
|                                            | burst  |          30.13 |          16.51 | −45.2% |
| Highest step server ELD p99 (max window)   | spread |           6.81 |           5.63 |        |
|                                            | burst  |           30.3 |           5.79 |        |
| Server RSS MB at 30 rooms (930 sockets)    | spread |         272.41 |          163.3 | −40.1% |
|                                            | burst  |         223.63 |         172.59 | −22.8% |
| Ack errors over all steps                  | both   |              0 |              0 |        |

Neither label reached the 250 ms limit, so the ramp does not show a capacity ceiling for this machine, only headroom at 930 sockets.

## 5. Load: reconnect storms

One room of 30 players, `spread`. 250 ms after question 3 is revealed the transports of 10 players are dropped (TCP destroyed, no close frame); after question 6, all 30. Clients reconnect with `socket.io-client`'s default backoff and send `room:player-resume`.

|                |                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Before / after | `load-reconnect-before.json` / `load-reconnect-after.json`, same runs and commits as [section 2](#2-load-single-room-sweep) |
| Optimizations  | Phase 3 (section 1); the resume response now carries a `RoomSync` with every part for that member at the current revision   |

| Metric                                        | Dropped |             Before |              After | Change |
| --------------------------------------------- | ------: | -----------------: | -----------------: | -----: |
| Resume ack (connect → ack) p50 / p95 / max    |      10 | 3.63 / 4.66 / 4.66 | 3.12 / 4.43 / 4.43 |        |
|                                               |      30 | 2.35 / 4.31 / 5.44 | 1.41 / 3.28 / 3.66 |        |
| Drop → all resumed                            |      10 |           1 460.93 |           1 402.69 |        |
|                                               |      30 |           1 505.97 |           1 496.14 |        |
| Bytes sent by the server during the storm     |      10 |          2 799 006 |          2 083 763 | −25.6% |
|                                               |      30 |          3 098 301 |          2 337 554 | −24.6% |
| Messages received by clients during the storm |      10 |                475 |                465 |        |
|                                               |      30 |                525 |                495 |        |

Both games passed every check (310 of 310 answers verified, identical final results). Drop → all resumed is almost entirely the client's reconnection backoff (1 000 ms ± 50%); the server's share is the resume ack, a few ms. On a local connection the server notices the drop at once; on real Wi-Fi it may take up to the ping timeout, which these runs do not cover.

## 6. Load: idle memory

Server started with `--expose-gc`; GC forced twice before each reading. 100 rooms created over HTTP with no socket; separately, 10 lobby rooms with host + 30 players connected (310 sockets). Three attempts per label, each on a fresh server; the table gives the range over the three.

|                |                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Before / after | `load-idle-before.json` / `load-idle-after.json`, same runs and commits as [section 2](#2-load-single-room-sweep) |
| Optimizations  | Phase 3 (section 1); no change aimed at memory                                                                    |

| Metric                                                       |          Before |          After |
| ------------------------------------------------------------ | --------------: | -------------: |
| Heap per idle room, KiB                                      |           14.47 |          14.41 |
| RSS per idle room, KiB                                       |     48.8 – 55.2 |   46.56 – 54.4 |
| Heap per connected socket (incl. its share of the room), KiB |   20.75 – 20.84 |  20.97 – 21.03 |
| Heap per connected socket without the room, KiB              |   20.28 – 20.37 |   20.5 – 20.56 |
| RSS per connected socket, KiB                                | 110.86 – 115.46 | 95.12 – 100.95 |

Heap per connected socket went **up** by about 0.2 KiB. Two Phase 3 changes could account for it, the two channel memberships per socket and the publisher's per-room cache of the last published state; they were not measured separately. RSS is noisy (it depends on when the allocator takes and returns pages); heap is stable to 0.1 KiB across attempts.

## 7. permessage-deflate

Not a before/after optimization: Phase 5 made WebSocket compression configurable (`SOCKET_PER_MESSAGE_DEFLATE`, `SOCKET_PER_MESSAGE_DEFLATE_THRESHOLD`) and measured four settings on the Phase 3 code. The phase was paused after the 30-player single room; the production default stays **off**, and no setting has been chosen.

|          |                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Commands | `pnpm -F @georally/server bench:load -- --scenario sweep --players 30 --label deflate-<setting> --skip-build [--per-message-deflate-threshold <bytes>]` |
| Code     | `e01756e` (clean tree), committed in `de6a761`; on battery, started 2026-10-18 12:40 UTC                                                                |
| Files    | `load-sweep-deflate-off.json`, `-1024.json`, `-512.json`, `-0.json`                                                                                     |
| Validity | Every run valid (generator ELD p99 1.08–1.23 ms) and passed every correctness check                                                                     |

| Setting        | Threshold / context takeover | Timing | Wire KiB per client per round | Wire bytes sent by server per round | Server CPU ms per round | answer→reveal p95 | submit ack p95 | Server RSS MB (max) |
| -------------- | ---------------------------- | ------ | ----------------------------: | ----------------------------------: | ----------------------: | ----------------: | -------------: | ------------------: |
| `deflate-off`  | (production today)           | spread |                         28.56 |                             906 586 |                  126.85 |              6.11 |           4.53 |               92.72 |
| `deflate-1024` | 1024 / no                    | spread |                         20.95 |                             664 937 |                  158.56 |              6.27 |           4.37 |              106.31 |
| `deflate-512`  | 512 / no                     | spread |                         13.67 |                             433 788 |                  267.53 |              8.24 |           7.03 |              107.05 |
| `deflate-0`    | 0 / yes                      | spread |                          1.52 |                              48 297 |                  271.58 |              9.43 |           7.15 |              110.45 |
| `deflate-off`  | (production today)           | burst  |                         28.56 |                             906 481 |                   67.19 |             24.47 |          22.18 |               93.77 |
| `deflate-1024` | 1024 / no                    | burst  |                         20.84 |                             661 569 |                   83.14 |             19.75 |          17.74 |              119.33 |
| `deflate-512`  | 512 / no                     | burst  |                         13.57 |                             430 762 |                  133.56 |             45.73 |          42.14 |              116.52 |
| `deflate-0`    | 0 / yes                      | burst  |                          1.31 |                              41 587 |                  146.21 |             47.59 |          44.29 |              117.64 |

The trade-off as measured: fewest bytes with `deflate-0` (28.56 → 1.52 KiB per client per round with `spread`, −94.7%, because context takeover turns the repeated keys and values into back-references), but server CPU per round more than doubles (126.85 → 271.58 ms, +114.1%) and `burst` answer→reveal p95 roughly doubles (24.47 → 47.59 ms). A threshold above 0 only takes effect with `server_no_context_takeover`, which the setting turns on for that reason.

Not measured, and needed before a recommendation: RSS per connection (the idle scenario), 15 concurrent rooms, and the ramp stop point. The RSS column is the whole process's maximum during one game, not a per-connection figure. One run per setting, on battery.

## 8. Data pipeline time and size

Wall time per stage of `packages/country-build` (01, 02, 03, 04 incl. 05, 06).

|         |                                                                                                                                                                                                                                                                                                       |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Command | `pnpm -F @georally/country-build bench:pipeline -- --mode <cold\|warm> [--repeat 3] [--keep-build] [--online] --label <label> --worktree <wt> --reference <wt>/bench-output/cold`                                                                                                                     |
| Before  | Worktree at `c55c329` (before any pipeline change). `pipeline-cold.json` (empty cache, 10 API requests) and `pipeline-warm.json` (3 runs, cache filled, every request blocked by the bench). Committed in `304df65`                                                                                   |
| After   | Worktree at `04e0d4e` (A, B, C): `pipeline-after-warm.json` (3 runs, `build/` cleared except the cache), `pipeline-after-warm-kept.json` (3 runs, `build/` kept), committed in `6ed3bfc`. Worktree at `83dd56d` (A, B, C, G): `pipeline-after-g.json` (3 runs, `build/` kept), committed in `503eb45` |

**Optimizations between before and after (Phase 7):**

- **A** — stage 02b runs its 2 323 per-tile `tippecanoe-decode` calls in parallel (`xargs -P "$(nproc)"` inside one container) instead of one after another.
- **B** — stage 02 is skipped when a stamp (hash of `upstream/maplibre.mbtiles`, the 02 scripts, `tools/tippecanoe-decode` and the tippecanoe image id) matches and its outputs exist.
- **C** — both API clients read `build/cache/` first and call Wikidata / REST Countries only with `COUNTRY_BUILD_REFRESH=1` or when the response is missing. Before, they requested the APIs on every run and used the cache only when a request failed.
- **G** — correctness, not speed: currency labels no longer depend on Wikidata's row order (prefer the item that is an instance of currency, then the lowest item number).

Two before/after pairs, because the gain depends on whether `build/` survives between runs:

| Stage                     | Before, slowest: normal run (cold, APIs requested) | After, fastest: `build/` kept, cache filled (`after-g` run 1) |     Change | Before, slowest offline run (`warm` run 3) | After, fastest with `build/` cleared (`after-warm` run 3) |     Change |
| ------------------------- | -------------------------------------------------: | ------------------------------------------------------------: | ---------: | -----------------------------------------: | --------------------------------------------------------: | ---------: |
| `01_get_fallback_sources` |                                                  4 |                                                             5 |            |                                          5 |                                                         4 |            |
| `02_prepare_base`         |                                             50 505 |                                                            87 |     −99.8% |                                     52 185 |                                                    11 769 |     −77.4% |
| `03_build_data`           |                                             42 760 |                                                           144 |     −99.7% |                                        139 |                                                       142 |            |
| `04_build_tiles` (+ `05`) |                                              9 159 |                                                         9 270 |            |                                      9 476 |                                                     9 257 |            |
| `06_build_registry`       |                                              5 184 |                                                            79 |     −98.5% |                                         82 |                                                        82 |            |
| **Total**                 |                                        **107 750** |                                                     **9 715** | **−91.0%** |                                 **61 981** |                                                **21 349** | **−65.6%** |
| API requests              |                                                 10 |                                                             0 |            |                            6 (all blocked) |                                                         0 |            |

- **Before, normal run:** before C every run requested the APIs, so the cold run is what any run looked like (stage 03 spent 39.4 s of its 42.8 s on three Wikidata queries). After C, a run with a filled cache makes no request at all. A run with an empty cache still has to request the APIs after C; that case was not re-measured, except one `--online` run that fetched the single new G response (`pipeline-after-g-online.json`: 1 request, 14 750 ms total).
- **Before, offline run:** the bench made every request fail so the clients fell back to the cache; a real run could not do this before C. It isolates A from C.

Output size and identity, same runs:

| Output                                                   |                                                                  Before |                 After | Change                                         |
| -------------------------------------------------------- | ----------------------------------------------------------------------: | --------------------: | ---------------------------------------------- |
| Tile set files                                           |                                                                   3 446 |                 3 446 | none                                           |
| Tile set bytes (`.pbf` + `tiles.json` + `metadata.json`) |                                                   4 988 841 – 4 988 843 | 4 988 846 – 4 988 849 | `metadata.json` only (records the output path) |
| `.pbf` bytes by zoom 0 / 1 / 2 / 3 / 4 / 5 / 6           | 108 584 / 152 457 / 254 667 / 464 591 / 811 460 / 1 185 642 / 1 961 855 |             identical | none                                           |
| `countries.playable.json` bytes                          |                                                                 129 567 |               129 567 | none                                           |
| `countries.registry.json` bytes                          |                                                                 169 728 |               169 728 | none                                           |

Every after run reproduced the cold run's 3 444 tiles and `tiles.json` byte for byte and both catalog files field for field (only `generated_at` differs). Size reduction D (drop unused tile attributes, `.pbf` bytes 4 939 256 → 4 536 090, −8.2%, measured with a probe) was proposed but not implemented, so the shipped tile set is unchanged.

## Not benchmarked

- **Phase 4 (room capacity):** not implemented. The capacity check from the load bench is a functional check, not a benchmark, and gave the same result before and after Phase 3: with the default `ROOM_CAPACITY_LIMIT=40`, a group room rejects player 40 (the host counts) and a classroom room rejects player 41, both with `room_participant_capacity_limit_exceeded`.
- **Phase 7b (room-creation rate limit):** not run. The live-rooms-per-IP figures in `measurements.md` (100 rooms in steady state, 105 at peak, 1.41–1.48 MiB of heap) are computed from the nginx config and the idle-memory heap figure, not measured against nginx.
- **Phase 1 stats-line event-loop delay:** a measurement correction, not an optimization. `monitorEventLoopDelay` includes its sampling interval, so an idle server reported p50 10.40 ms at a 10 ms resolution; after subtracting the resolution it reports 1.04 ms.
- **Phase 6 (anti-cheat):** an audit with tests, no performance measurement.
