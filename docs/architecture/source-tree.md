# Source tree

The full source tree, excluding large checked-in map assets under `apps/web/public/map/**` and build/cache outputs.

```text
georally-game/
|-- apps/
|   |-- server/
|   |   |-- Dockerfile
|   |   |-- package.json
|   |   |-- tsup.config.ts
|   |   |-- vitest.config.ts
|   |   |-- src/
|   |   |   |-- index.ts                # server composition root
|   |   |   |-- app.ts                  # Express app: /health, /api router (CORS, no-store, JSON), error handler
|   |   |   |-- server.ts               # HTTP + Socket.IO server setup (namespace /game)
|   |   |   |-- config/
|   |   |   |   `-- env.ts              # zod env parsing
|   |   |   |-- http/
|   |   |   |   `-- responses.ts        # Ack<T> HTTP responses + final error handler
|   |   |   `-- features/
|   |   |       `-- rooms/
|   |   |           |-- http.ts         # POST /api/rooms, GET /api/rooms/:roomCode
|   |   |           |-- socket.ts       # socket event handlers, payload validation, socket auth
|   |   |           |-- service.ts      # multiplayer application service
|   |   |           |-- service.test.ts # service unit tests
|   |   |           |-- repository.ts   # in-memory rooms, member sessions, socket bindings, timers
|   |   |           |-- publisher.ts    # pushes host/player snapshots and room-closed events
|   |   |           |-- ids.ts          # room/member/game id, room code, session token generation
|   |   |           `-- types.ts        # Socket.IO namespace/socket types
|   |   `-- tests/
|   |       |-- setup.ts                # boots a real server on a random port for integration tests
|   |       `-- integration/
|   |           `-- app.test.ts         # HTTP routes + socket flows end to end
|   `-- web/
|       |-- Dockerfile
|       |-- nginx.conf                  # production nginx: static client, proxies /socket.io/, /api/, /health
|       |-- package.json
|       |-- vite.config.ts
|       |-- index.html
|       |-- locales/                    # one Vite entry per locale: en.html, ru.html, uz.html
|       |-- public/
|       |   |-- _headers
|       |   |-- _redirects
|       |   |-- robots.txt
|       |   |-- sitemap.xml
|       |   `-- map/                    # checked-in vector tiles, fonts, style.json
|       `-- src/
|           |-- app/
|           |   |-- main.tsx            # React root + router
|           |   |-- App.tsx
|           |   |-- routes.tsx          # route table
|           |   |-- HomePage.tsx        # mode chooser
|           |   |-- LocaleGate.tsx      # detects language, redirects unprefixed URLs
|           |   |-- LocaleContext.tsx
|           |   |-- LocalizedLink.tsx
|           |   |-- useLocalizedNavigate.tsx
|           |   `-- globals.css
|           |-- shared/
|           |   |-- analytics/
|           |   |   |-- track.ts        # GA4 event helpers
|           |   |   |-- useMultiplayerGameAnalytics.ts
|           |   |   `-- useSingleplayerGameAnalytics.ts
|           |   |-- i18n/
|           |   |   |-- setup.ts        # i18next init
|           |   |   |-- locales/        # en, ru, uz-Latn translations
|           |   |   |-- countryText.ts
|           |   |   |-- gameLabels.ts
|           |   |   |-- locale-segment.ts
|           |   |   |-- useAppLanguage.tsx
|           |   |   |-- I18nDocumentSync.tsx
|           |   |   |-- LanguageSwitcher.tsx
|           |   |   `-- index.ts
|           |   |-- map/
|           |   |   |-- MapRenderer.tsx # MapLibre wrapper used by game UIs
|           |   |   |-- continent-view.ts
|           |   |   |-- map-styles.tsx
|           |   |   `-- types.ts
|           |   |-- ui/                 # AlertMessage, Button, CopyButton, FloatingNotice, FormControls,
|           |   |                       # IconButton, ScreenShell, SurfacePanel, buttonStyles
|           |   |-- utils/
|           |   |   `-- cn.ts
|           |   `-- widgets/
|           |       |-- CountryInfoCard.tsx
|           |       `-- ScoreBanner.tsx
|           |-- singleplayer-game/
|           |   |-- index.ts
|           |   |-- core/
|           |   |   |-- config.ts         # URL <-> singleplayer config conversion
|           |   |   `-- useGameSession.ts # local game orchestration hook
|           |   |-- screens/
|           |   |   |-- SetupPage.tsx
|           |   |   |-- GamePage.tsx
|           |   |   |-- GameScreen.tsx
|           |   |   `-- InvalidConfigScreen.tsx
|           |   `-- components/
|           |       |-- GameHeader.tsx
|           |       |-- GameResultModal.tsx
|           |       |-- Hearts.tsx
|           |       `-- QuestionTimer.tsx
|           `-- multiplayer-game/
|               |-- index.ts
|               |-- api/
|               |   |-- roomsApi.ts           # HTTP client: create room, look up room
|               |   |-- socketGateway.ts      # typed Socket.IO client boundary
|               |   `-- errors.ts             # gateway error normalization + messages
|               |-- session/
|               |   |-- types.ts
|               |   |-- sessionStorage.ts     # localStorage persistence for host/player sessions
|               |   |-- useActionStatus.ts
|               |   |-- useRoomRuntime.ts     # connection status, resume on reconnect, snapshots
|               |   |-- useRoomHostController.ts
|               |   |-- useRoomPlayerController.ts
|               |   |-- useGroupHostActions.ts
|               |   `-- useClassroomHostActions.ts
|               |-- model/
|               |   |-- gameConfig.ts
|               |   |-- gameSelectors.ts
|               |   `-- roomSelectors.ts
|               |-- create/
|               |   `-- CreateRoomForm.tsx
|               |-- join/
|               |   |-- JoinRoomForm.tsx
|               |   `-- PlayerJoinScreen.tsx
|               |-- lobby/
|               |   |-- GameConfigPanel.tsx
|               |   `-- RoomLobbyScreen.tsx
|               |-- game/
|               |   |-- ActiveGameHostScreen.tsx
|               |   |-- ActiveGameParticipantScreen.tsx
|               |   |-- hooks/
|               |   |   |-- useCountdown.ts
|               |   |   `-- useTimestampGate.ts
|               |   `-- country-map/
|               |       |-- CountryMapGameScreen.tsx
|               |       |-- GameQuestionBar.tsx
|               |       |-- LeaderboardOverlay.tsx
|               |       |-- SelectedAnswerMarker.tsx
|               |       `-- useGameMap.tsx
|               |-- finished/
|               |   |-- ResultsList.tsx
|               |   `-- RoomFinishedScreen.tsx
|               |-- pages/
|               |   |-- HomePage.tsx
|               |   |-- RoomHostPage.tsx
|               |   `-- RoomPlayerPage.tsx
|               `-- screens/
|                   |-- RoomClosedScreen.tsx
|                   |-- RoomErrorScreen.tsx
|                   `-- RoomLoadingScreen.tsx
|-- packages/
|   |-- game-domain/
|   |   `-- src/
|   |       |-- index.ts
|   |       |-- shared/                  # base types, result, errors, random, time
|   |       |-- catalog/                 # country eligibility selectors
|   |       |-- singleplayer/            # local state machine
|   |       `-- multiplayer/
|   |           |-- orchestration.ts     # room + game commands combined (start, submit, reveal, advance)
|   |           |-- errors.ts
|   |           |-- room/                # room state machine, expiry, selectors, visibility
|   |           `-- game/                # game state machine, scoring, leaderboard, scheduling, visibility
|   |-- game-protocol/
|   |   `-- src/
|   |       |-- ack.ts                   # Ack<T> shape shared by socket acks and HTTP bodies
|   |       |-- errors.ts
|   |       |-- events.ts                # socket namespace + event contracts
|   |       |-- requests.ts              # zod request schemas
|   |       |-- responses.ts             # response/event types
|   |       `-- index.ts
|   |-- country-catalog/
|   |   |-- generated/
|   |   |   |-- countries.registry.json
|   |   |   `-- countries.playable.json
|   |   `-- src/
|   |       |-- index.ts                 # builds in-memory catalog + country pool
|   |       `-- types.ts
|   |-- country-build/
|   |   |-- data/
|   |   |   |-- playable_states_195.json
|   |   |   `-- manual_overrides.json
|   |   |-- docker/
|   |   |   `-- Dockerfile               # tippecanoe image
|   |   |-- upstream/                    # source zip/mbtiles inputs
|   |   |-- tools/                       # bundled tippecanoe/tile-join binaries
|   |   `-- scripts/
|   |       |-- 01_get_fallback_sources.sh
|   |       |-- 02_prepare_base.sh
|   |       |-- 02b_dump_base_country_tiles.sh
|   |       |-- 02c_merge_base_countries.mjs
|   |       |-- 03_build_data.mjs
|   |       |-- 04_build_tiles.sh
|   |       |-- 05_make_tilesjson.mjs
|   |       |-- 06_build_registry.mjs
|   |       |-- 06_build_registry.sh
|   |       `-- lib/
|   |           |-- cache.mjs
|   |           |-- continent.mjs
|   |           |-- output-paths.mjs
|   |           |-- restcountries.mjs
|   |           |-- uz-latn.mjs
|   |           `-- wdqs.mjs
|   `-- map-assets/                      # generated map tiles, written by country-build
|-- docs/
|   |-- architecture/                    # this folder
|   `-- proposals/                       # reviewed improvements, not yet implemented
|-- docker-compose.yaml
|-- README.md
|-- package.json
|-- pnpm-workspace.yaml
|-- tsconfig.base.json
`-- tsconfig.json
```
