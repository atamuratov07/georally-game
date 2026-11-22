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
|   |   |       |-- feedback/
|   |   |       |   |-- http.ts         # POST /api/feedback: validate, honeypot, forward to Telegram
|   |   |       |   |-- http.test.ts    # delivery, failure logging, honeypot
|   |   |       |   |-- message.ts      # formats the Telegram message text
|   |   |       |   `-- telegram.ts     # Bot API sendMessage call with a 5 s timeout
|   |   |       `-- rooms/
|   |   |           |-- http.ts         # POST /api/rooms, GET /api/rooms/:roomCode
|   |   |           |-- socket.ts       # socket event handlers, payload validation, socket auth
|   |   |           |-- service.ts      # multiplayer application service
|   |   |           |-- service.test.ts # service unit tests
|   |   |           |-- repository.ts   # in-memory rooms, member sessions, timers
|   |   |           |-- publisher.ts    # pushes room updates, per-viewer parts and room-closed events
|   |   |           |-- publisher.test.ts # every client's composed view equals the server view
|   |   |           |-- channels.ts     # Socket.IO member/room channel names, member socket check
|   |   |           |-- ids.ts          # room/member/game id, room code, session token generation
|   |   |           `-- types.ts        # Socket.IO namespace/socket types
|   |   `-- tests/
|   |       |-- setup.ts                # boots a real server on a random port for integration tests
|   |       |-- roomClient.ts           # test client that applies room updates with the domain reducer
|   |       `-- integration/
|   |           `-- app.test.ts         # HTTP routes + socket flows end to end
|   `-- web/
|       |-- Dockerfile
|       |-- nginx.conf                  # production nginx: static client, proxies /socket.io/, /api/, /health
|       |-- package.json
|       |-- vite.config.ts              # also builds the service worker (vite-plugin-pwa, injectManifest)
|       |-- tsconfig.sw.json            # WebWorker-lib type check for sw/
|       |-- sw/
|       |   `-- sw.ts                   # service worker: precache, locale shells, tile and glyph caches, see pwa.md
|       |-- vite/
|       |   |-- precompress.ts          # writes a .gz next to every compressible build output
|       |   `-- regionMap.ts            # serves virtual:region-map: region outlines projected at bundle time
|       |-- index.html
|       |-- locales/                    # one Vite entry per locale: en.html, ru.html, uz.html
|       |-- public/
|       |   |-- manifest.webmanifest
|       |   |-- icon-*.png, apple-touch-icon.png, favicon-*.png
|       |   |-- robots.txt
|       |   |-- sitemap.xml
|       |   |-- flags/                  # one SVG per country, written by pnpm build:flags
|       |   `-- map/                    # checked-in vector tiles and fonts
|       `-- src/
|           |-- app/
|           |   |-- main.tsx            # React root + router
|           |   |-- App.tsx
|           |   |-- routes.tsx          # route table
|           |   |-- HomePage.tsx        # mode chooser
|           |   |-- landing/            # home page pieces: hero globe, mode showcases and their demos
|           |   |                       # (a fixed 720x540 replica of the desktop game built from the
|           |   |                       # real widgets and scaled to fit; country names copied from the
|           |   |                       # catalog in demoNames.ts so the home page doesn't load it)
|           |   |-- LocaleGate.tsx      # detects language, redirects unprefixed URLs
|           |   |-- LocaleContext.tsx
|           |   |-- LocalizedLink.tsx
|           |   |-- useLocalizedNavigate.tsx
|           |   `-- globals.css
|           |-- shared/
|           |   |-- answers/            # the app's answer matcher, typed answers, answer field basics,
|           |   |                       # speech recognition (helpers, status, push-to-talk and continuous hooks)
|           |   |-- analytics/
|           |   |   |-- track.ts        # GA4 event helpers
|           |   |   `-- useMultiplayerGameAnalytics.ts
|           |   |-- feedback/           # the feedback form and the end-of-game reaction, see feedback.md
|           |   |-- pwa/                # service worker registration and update prompt, install button,
|           |   |                       # useOnline, see pwa.md
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
|           |   |   |-- PickCountryMap.tsx # the pick-a-country map (locate, multiplayer), composed from the parts below
|           |   |   |-- BaseMap.tsx     # MapLibre map, style, load and error, projection and its toggle
|           |   |   |-- camera/         # useRegionCamera (region views, reset), useRevealCamera, useFitCamera,
|           |   |   |                   # framing (fitCamera, flight settings, isTinyAt,
|           |   |   |                   # loosenCameraConstraint, keepVisibleAreaOnMap)
|           |   |   |-- interaction/    # useCountryPicking (hover and click)
|           |   |   |-- layers/         # CountryLayers (highlights, dimming, hover), LabelLayers
|           |   |   |-- CardToggle.tsx, MapMarkers.tsx, ProjectionToggle.tsx, RevealPopup.tsx,
|           |   |   |   TinyCountryRing.tsx, HitRing.tsx
|           |   |   |-- map-controls.ts # shared style of the round map buttons
|           |   |   |-- continent-view.ts
|           |   |   |-- map-styles.tsx  # fixed layer specs driven by feature state
|           |   |   |-- style.json, mapStyle.ts # base style; inlines the tile list and outlines URL
|           |   |   |-- generated/      # tiles.json, archipelagos.geojson, border-crossings.json (country-build output)
|           |   |   |-- prefetchMap.ts  # warms the outlines, low-zoom tiles and common glyphs
|           |   |   |-- useFeatureState.ts # sets per-country states, applying only the changes
|           |   |   `-- types.ts
|           |   |-- time/               # useDeadline, useNow
|           |   |-- ui/                 # AlertMessage, Button, CopyButton, FloatingNotice, FormControls,
|           |   |                       # IconButton, ScreenShell, SurfacePanel, buttonStyles
|           |   |-- utils/
|           |   |   `-- cn.ts
|           |   `-- widgets/
|           |       |-- CountryInfoCard.tsx
|           |       |-- ScoreBanner.tsx
|           |       `-- region-map/
|           |           `-- RegionPicker.tsx  # continent picker drawn from virtual:region-map
|           |-- singleplayer-game/
|           |   |-- index.ts              # exports singleplayerRoutes
|           |   |-- modes.ts              # mode registry: id and lazy pages
|           |   |-- paths.ts              # /singleplayer/<mode> and /singleplayer/<mode>/play
|           |   |-- routes.tsx            # routes from the registry, redirects from the old paths
|           |   |-- RedirectWithSearch.tsx
|           |   |-- locate/
|           |   |   |-- SetupPage.tsx
|           |   |   |-- GamePage.tsx
|           |   |   |-- GameScreen.tsx
|           |   |   |-- config.ts         # setting options and the setup URL's query string
|           |   |   |-- store.ts          # the saved locate game and its checks
|           |   |   |-- useLocateGame.ts  # restores, runs and saves the locate game
|           |   |   |-- analytics.ts
|           |   |   `-- components/       # GameHeader, Hearts
|           |   |-- name-it/
|           |   |   |-- SetupPage.tsx
|           |   |   |-- GamePage.tsx
|           |   |   |-- RoundScreen.tsx   # joins the map, the round state and a layout
|           |   |   |-- useRoundView.tsx  # the round's camera focus, highlights and reveal
|           |   |   |-- useAnswerInput.ts # typing and voice state shared by the parts
|           |   |   |-- roundControls.ts  # what a layout receives
|           |   |   |-- layouts/          # DesktopRoundLayout, TouchRoundLayout, their insets
|           |   |   |-- NameItMap.tsx     # the map: fit camera, target highlight, labels only on reveal
|           |   |   |-- config.ts
|           |   |   |-- store.ts
|           |   |   |-- useNameItGame.ts  # begins and advances when the camera settles
|           |   |   |-- analytics.ts
|           |   |   `-- components/       # DesktopAnswerBar, TouchAnswerBar, useAnswerField, AttemptFeedback,
|           |   |                         # RoundButtons
|           |   |-- recall-sprint/
|           |   |   |-- SetupPage.tsx, GamePage.tsx
|           |   |   |-- SprintScreen.tsx  # joins the map, the controls and a layout per phase
|           |   |   |-- SprintMap.tsx     # map shell: region view, what is revealed, the phase's child
|           |   |   |-- useOverlayCamera.ts # pole rule, follows the overlays (both phases)
|           |   |   |-- PlayCamera.tsx    # flights and stays on finds (while running)
|           |   |   |-- ReviewLayers.tsx  # active country, lifted look, card, taps (review)
|           |   |   |-- RevealLayers.tsx  # reveal dim, labels, hit rings, tiny-country rings
|           |   |   |-- useReview.ts, reviewOrder.ts, liftedLayers.ts
|           |   |   |-- regionCountries.ts # the region's countries, free of map code for the setup page
|           |   |   |-- sprintRegion.ts   # region bounds, opening view, bounds of finds
|           |   |   |-- useSprintGame.ts, useSprintInput.ts
|           |   |   |-- sprintControls.ts, reviewControls.ts # what a layout receives
|           |   |   |-- layouts/          # Desktop/Touch SprintLayout and ReviewLayout, their overlays
|           |   |   |-- config.ts, store.ts, analytics.ts
|           |   |   `-- components/       # DesktopSprintBar, TouchSprintBar, FoundCounter,
|           |   |                         # SprintNote, ReviewBar, ReviewArrow
|           |   |-- routes/
|           |   |   |-- SetupPage.tsx, GamePage.tsx # GamePage remounts the game for the next puzzle
|           |   |   |-- RoutesScreen.tsx  # joins the map, the controls, a layout and the opening
|           |   |   |-- useRouteIntro.ts  # the opening's stages, its View Transition; route-transitions.css
|           |   |   |-- useRouteFinish.ts # which finish camera runs, when Next puzzle shows
|           |   |   |-- RouteAnnouncements.tsx # screen-reader guess list and announcements
|           |   |   |-- map/              # everything drawn on the map
|           |   |   |   |-- RoutesMap.tsx     # BaseMap, opening view; mounts the layers and cameras
|           |   |   |   |-- RouteLayers.tsx   # verdict fills, dashed outline on revealed countries,
|           |   |   |   |                     # labels, the line and the rings
|           |   |   |   |-- routeFrame.ts     # bounds that keep both ends in view, however large a country
|           |   |   |   |-- routeGeometry.ts  # border crossings, arcs along the links
|           |   |   |   |-- routeBeads.ts     # bead points in nested zoom levels, country beads
|           |   |   |   |-- routeLineStyle.ts # line data, cord and bead paint
|           |   |   |   |-- BeadLayers.tsx    # one circle layer per bead level, for the line and the tour
|           |   |   |   |-- RouteLine.tsx     # grows the links the engine works out
|           |   |   |   |-- RouteRings.tsx, useRouteRings.ts # rings on new countries and on the ends
|           |   |   |   |-- routeCameras.tsx  # follow camera, give-up flight; moveCamera.ts awaits a move
|           |   |   |   `-- RouteTour.tsx     # the tour after a solve and its puck
|           |   |   |-- useRoutesGame.ts  # restores or prepares, builds the one board, runs and saves
|           |   |   |-- useRoutesInput.ts, countryNames.ts, routesControls.ts
|           |   |   |-- layouts/          # Desktop/Touch RoutesLayout and their map padding
|           |   |   |-- config.ts, store.ts, analytics.ts
|           |   |   `-- components/       # RouteJourney and IntroJourney over JourneyView (ends and counter,
|           |   |                         # no catalog, so the landing demo shares it), RouteFeedback,
|           |   |                         # HintButton, GiveUpButton, RouteResult, SlideIn, BordersNote, verdictStyle
|           |   `-- shared/
|           |       |-- touch.ts          # the touch-screen media query
|           |       |-- gameStore.ts      # createGameStore, hasValidQuestionProgress
|           |       |-- useStoredGame.ts
|           |       |-- useGuessField.ts  # the open guess field of Recall Sprint and Routes
|           |       |-- questionCountFit.ts
|           |       |-- setupParams.ts    # shared URL parameter readers and the difficulty options
|           |       |-- useRoundEvents.ts
|           |       `-- components/       # SetupShell, SetupCard, ModeTabs, GameErrorBoundary,
|           |                             # GameErrorScreen, GameResultModal, ResumeGameCard,
|           |                             # KeyboardGameFrame, LeaveButton, CountdownBar,
|           |                             # MicButton, VoiceButton, AnswerNotice, ConfirmButton
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
|               |   |-- useRoomRuntime.ts     # connection status, resume on reconnect, room sync state
|               |   |-- useRoomHostController.ts
|               |   |-- useRoomPlayerController.ts
|               |   |-- useGroupHostActions.ts
|               |   `-- useClassroomHostActions.ts
|               |-- model/
|               |   |-- gameConfig.ts
|               |   |-- gameSelectors.ts
|               |   |-- roomSelectors.ts      # members by id, closed reasons
|               |   `-- serverClock.ts        # server clock offset for countdowns
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
|   |       |-- catalog/                 # country eligibility selectors, question set selection
|   |       |-- answers/                 # typed and spoken answer matcher (Name It)
|   |       |-- borders/                 # the land border graph and its searches
|   |       |-- singleplayer/
|   |       |   |-- rounds.ts            # phases, state shape and selectors shared by the modes
|   |       |   |-- locate/              # find-on-the-map mode
|   |       |   |-- name-it/             # name-the-country mode
|   |       |   |-- recall-sprint/       # name-as-many-as-you-can mode
|   |       |   `-- routes/              # connect-two-countries mode
|   |       `-- multiplayer/
|   |           |-- orchestration.ts     # room + game commands combined (start, submit, reveal, advance)
|   |           |-- errors.ts
|   |           |-- room/                # room state machine, expiry, selectors, visibility, sync (update split + reducer)
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
|   |   |-- data/
|   |   |   `-- aliases.json             # hand-curated extra answer names
|   |   |-- generated/
|   |   |   |-- borders.json             # land borders as id pairs, written by country-build
|   |   |   |-- countries.json           # playable countries, written by country-build
|   |   |   `-- regions.geojson          # continent outlines, written by country-build
|   |   `-- src/
|   |       |-- index.ts                 # re-exports
|   |       |-- catalog.ts               # in-memory catalog + country pool
|   |       |-- aliases.ts               # registry names + aliases → answer entries
|   |       |-- aliases.test.ts
|   |       |-- borders.ts               # borders.json → border graph
|   |       |-- borders.test.ts
|   |       `-- types.ts
|   |-- country-build/
|   |   |-- data/
|   |   |   |-- border_overrides.json
|   |   |   |-- playable_states_195.json
|   |   |   `-- manual_overrides.json
|   |   |-- docker/
|   |   |   `-- Dockerfile               # tippecanoe image
|   |   |-- upstream/                    # Natural Earth zips
|   |   |-- tools/                       # bundled tippecanoe/tile-join binaries
|   |   `-- scripts/
|   |       |-- 01_get_sources.sh        # downloads missing Natural Earth zips
|   |       |-- 02_prepare_base.mjs      # Natural Earth layers → build/*.geojson
|   |       |-- 03_build_data.mjs
|   |       |-- 03b_fetch_flags.mjs     # downloads and checks the flags
|   |       |-- 04_build_tiles.sh
|   |       |-- 05_make_tilesjson.mjs
|   |       |-- 06_build_registry.mjs
|   |       |-- 07_build_archipelago_outlines.mjs
|   |       |-- 08_build_regions.mjs
|   |       |-- 09_build_borders.mjs     # measures land borders
|   |       `-- lib/
|   |           |-- cache.mjs
|   |           |-- continent.mjs
|   |           |-- countries.mjs        # reads build/countries.json
|   |           |-- natural-earth.mjs    # reads an upstream/ zip
|   |           |-- output-paths.mjs     # the shared --out option
|   |           |-- problems.mjs         # print all problems, exit before writing
|   |           |-- restcountries.mjs
|   |           |-- uz-latn.mjs          # Uzbek apostrophe normalization
|   |           `-- wdqs.mjs
|-- docs/
|   |-- architecture/                    # this folder
|   |   `-- singleplayer/                # one doc per singleplayer mode
|   `-- proposals/                       # reviewed improvements, not yet implemented
|-- docker-compose.yaml
|-- README.md
|-- package.json
|-- pnpm-workspace.yaml
|-- tsconfig.base.json
`-- tsconfig.json
```
