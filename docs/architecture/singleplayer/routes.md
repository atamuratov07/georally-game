# Routes

The player connects a start and a target country by naming the countries between them. The shared flow and saving are in [`../singleplayer.md`](../singleplayer.md).

## Rules and engine

The engine (`game-domain/src/singleplayer/routes/`) has Recall Sprint's shape, one session per game instead of question rounds, and its names: `RouteSession`, `prepareRouteSession`, `reduceRouteState`. Its phases are `idle` → `playing` → `finished`.

- **The puzzle.** A start and a target country, joined by land borders with at least one country between them. Borders come from stage 09 ([`data-pipeline.md`](../data-pipeline.md#borders)). **Par** is the number of countries between them on a shortest path: Portugal to Germany has a par of 2 (Spain, France).
- **Solving.** The player names countries in any order. The named and hinted countries are the **known** ones. The puzzle is solved when the known countries and the two ends contain a chain of neighbours from start to target. Any chain counts, not only a shortest one.
- **Score.** The score is guesses plus hints, shown against par ("5 / 4"). A hint costs what a guess costs. Otherwise, hinting every country would reach par. A **perfect** game is solved at par with no hints, and only that gets the confetti.
- **What counts.** Only a country not known yet counts as a guess. Repeats, the ends, ambiguous names ("Congo") and unrecognised text get a note and cost nothing. Names after the solving one in the same sentence are ignored, so "France, Belgium" doesn't add Belgium once France has solved the puzzle.
- **Verdicts.** Each country is coloured by its detour, `dS(x) + dT(x) − dS(target)`, where `dS` counts steps from the start and `dT` steps to the target:
   - 0 is on a shortest path (`route`, green);
   - 1 is one step longer (`near`, yellow);
   - 2 or more, or unreachable, is `off` (red).

   A verdict depends only on the ends, so it never changes during a game.

- **The best completion** is the cheapest chain from start to target where the known countries and the target cost 0 and every other country costs 1. Ties go to the chain with fewer borders, then by neighbours in ascending id order, so the same state gives the same answer after a reload. Puzzles often have several shortest paths: Spain to Austria goes through France and then Switzerland, Germany or Italy. Hints and give-up therefore build on what the player knows instead of on one stored solution, which would steer a player who has named Italy towards Switzerland.
- **A hint** reveals one unknown country of the best completion: the one nearest the latest country the player named or revealed, so a player building from the target's side isn't sent back to the start. With nothing known, it reveals the first unknown country. A hint can solve the puzzle. The revealed country shows its real verdict, which isn't always green.
- **Give up** reveals the rest of the best completion.
- **A two-step hint was dropped.** In that design, a country's outline came first and its name second. The outline gives away which country borders which, the skill the mode tests, and outline plus name costs as much as a reveal.

The code has three layers, each knowing less than the one above:

- **Graph functions** (`game-domain/src/borders/`, `@georally/game-domain/borders`): BFS distances, `shortestPath` (optionally only through allowed countries), `routeDistances` and `detour`, `bestCompletion` and `easiestShortestPathRank`. They know nothing about puzzles. `fromEdges` is the only way to build a `BorderGraph`. It sorts every neighbour list, which the tie rule relies on, so the code that depends on the order also sets it up. The functions sit outside `singleplayer/` because mastery's planned neighbours skill and a multiplayer route game can use them too.
- **The board.** `createRouteBoard(graph, ends)` binds the graph to one puzzle and measures the distances from both ends once. It answers par, `verdict`, `isSolved`, `completion`, `nextHint` and `chainWithin` (the chain a solve used). It returns `null` when the ends are the same, neighbours or not connected.
- **The reducer.** `reduceRouteState(board, state, action)` asks the board every graph question, so it holds no graph code. The game page builds the board once and passes it to every call, and the screens colour with the same board. A board from another game throws on its first use. The actions:
   - `START` works from any phase, so Next puzzle is a single `START`.
   - `ATTEMPT` takes every match from one typed answer or one spoken sentence.
   - `HINT` adds `board.nextHint`.
   - `GIVE_UP` finishes as `gaveUp`.

   After the finish, only `START` acts.

- **The state holds only what the player did:** the config, the ends, the guesses and hints with their times, and the last attempt's notes. Par, verdicts and the known set are derived. A stored verdict or par would be graph data in a saved game, and after a border change it would disagree with the solve check.
- **Selectors** read a state:
   - `getScore` and `getKnownIds`;
   - `getTimeline`, for the screen-reader list. It is a stable merge: names from one sentence share a time and keep their order, and a guess comes before a hint at the same time;
   - `getMoves` and `getLastMove`. The camera, the rings, the feedback and the announcements all react to the last move;
   - `getFinalChain` (the player's chain, or the completion after a give-up), `getMissingIds` and `isPerfect`.
- **`routeLinks`** builds the map's route line move by move, so a restored game shows the links its player saw and a later state only ever adds links. The line is one network grown from both ends:
   - A new country joins through the neighbour on the network closest to its end, the start's part first.
   - Links between countries on a shortest way come before side branches, so the way never runs through a branch.
   - When the known countries connect, the network takes in any link of their chain it lacks, and that chain becomes the main line.
   - When a country joins the start's part next to the target's, one link bridges the two parts.
   - A red country gets no link until a later country joins through it, since a red dead end only clutters the map.
   - After a give-up, all the missing countries join in one last step.

**Practice sessions.** The config is `{ kind: 'practice', scope, difficulty }`. The `daily` config and `dailyRouteSession` exist in the engine, but the daily isn't built yet. `prepareRouteSession(graph, pool, config, rng)` draws both ends inside the region; the path between them may leave it, so a Europe puzzle may run through Turkey.

- **Regions** (`ROUTE_SCOPES`): World, Europe, Asia, Africa, and the Americas as one region. Each American continent alone had only about 30 puzzles. Oceania has none: its only bordered country, Papua New Guinea, borders Indonesia, which is in Asia.
- **Difficulty** (`routeLevels`) comes mostly from par. The catalog's country ratings measure how well known a country is, not how well its borders are, so they only keep obscure countries out of the lower levels. The **best-path rating** is the hardest rating on the easiest shortest path, ends included.

   | Level  | Par                                                        |
   | ------ | ---------------------------------------------------------- |
   | Easy   | 1–3, all easy or medium                                    |
   | Medium | 3–5 with all easy or medium, or 2–3 with any rating        |
   | Hard   | 6 or more with any rating, or 4 or more with a hard rating |

   The levels overlap so that each one has enough puzzles. Two alternatives were dropped:
   - A separate length setting multiplied the combinations, and many of them were empty.
   - Rating by the catalog alone left the world with about 67 all-easy puzzles, none of them in Africa, South America or Oceania.

- **Hard draws a region pair first.** Long routes need distant ends, and those sit behind the few borders that join Africa and the Americas to Eurasia. Drawn uniformly over pairs, two thirds of hard world puzzles therefore had an end in Africa, and half ran through France. Hard sessions pick a region pair uniformly instead, from Africa, the Americas, Asia (with Oceania) and Europe, and then a pair inside it. Every pair that leaves the Americas counts as one region pair, since all of them cross French Guiana. This lowers Africa ends to 43%, routes through France to 31% and routes through Spain–Morocco to 16%. Easy and medium still draw over pairs: their smallest region pairs hold 23 to 30 puzzles, which a region draw would repeat.
- **Every offered combination has puzzles.** A test in `country-catalog` checks it against the real catalog; Africa easy, with 23, is the thinnest. So the setup page checks nothing at runtime and never loads the graph.

## In the browser

- **Setup.**
   - The page offers the region and the difficulty; Oceania is shown disabled, not hidden.
   - `ModeTabs` carries `scope` between modes. Routes maps `north-america` and `south-america` to `americas`, and `oceania` to `all`.
   - The description ends in a "What counts as a border?" link (`BordersNote`). It opens a dialog with the rule and the surprising cases: the fixed links, French Guiana, Ceuta and Melilla, Kaliningrad, Cabinda, Kazungula, and the gaps left by Kosovo, Somaliland and Western Sahara. The lines are hand-written in the translation files, since they need proper wording in three languages and the runtime never needs border reasons as data. Border rulings are where geography fans push back, and a visible rule settles most of it.
- **Loading and saving.** The game page lazy-loads the graph and the border crossings with the routes chunk, builds the board, and dispatches `START`. The game is saved under `georally.singleplayer.routes`, with the other modes' lifetime and discard rules. A restored game is discarded when no board can be built for its ends any more. A border change that only moves colours is accepted.
- **Input.**
   - Typing waits for Enter, unlike Recall Sprint, because every name costs a point. Accepting early would score Niger while the player is still typing Nigeria.
   - Voice is the toggle microphone (`useContinuousSpeech`), and each sentence goes through `matchAll`, so "Kazakhstan, Russia" names two countries. Push-to-talk would need a press per sentence in a mode where a sentence of names is the normal move.
   - Tapping the map isn't an input: it would turn knowing borders into tracing shapes.
- **Layout.** The map is the record of the game, and the controls around it repeat nothing it shows.
   - **The ends** (`RouteJourney` over `JourneyView`): each flag above its name, with "score / par" between them over a thick arrow. Nothing sits on a card. The score turns coral once it passes par.
   - **Feedback** covers the last move only: a pill in its verdict colour for each country named, with a bulb for a hint, and a red note for a name that didn't count ("Germany: already named"). Screen readers get the guesses as a hidden list, each with its verdict in words.
   - **Desktop:** the ends top centre; the field at the bottom with the microphone inside it and Hint beside it, and the feedback above the field; Leave top left, Give up top right.
   - **Touch:** the field at the top with Hint at its end, so the keyboard never covers them, and the feedback hangs under it. The ends sit at the bottom with the microphone above them. While the keyboard is open, only the microphone rises with it.
   - **Give up** is final and needed at most once a game, so it sits in a top corner behind Recall Sprint's two-tap confirm. Hint states no cost, since a hint costs what a guess does.
- **The map.** Every colour goes through feature state.
   - **Fills:** the two ends are blue, since the puzzle has no direction. Known countries take their verdict colour, and unknown ones are a faint grey.
   - **Revealed countries** (a hint, or the rest of the route after a give-up) take a pale tint of their verdict colour and a dashed outline. The outline is offset just inside each country, so two revealed neighbours draw two parallel lines instead of patterns that clash.
   - **Labels** are shown only for the ends and the known countries.
   - **The route line** (`RouteLine`, from `routeLinks`) runs centroid, border crossing, centroid along great circles. Passing through the crossing keeps Brazil–France from running to Paris. Links grow at 1.5 km/ms, each starting when the line reaches its first country.
   - **The beads:** the main way is white beads on a navy cord; side branches to yellow countries are smaller beads on a thin cord. Each country the line reaches gets a gold-centred bead, and the ends get a larger blue one.
   - **Bead placement:** beads sit at fixed map points, in five nested levels that each halve the gaps of the one before. A new level appears every 1.2 zoom steps. MapLibre's line-placed symbols were dropped because they re-placed every bead on each update and cross-faded on zoom.
   - **Tiny countries get no rings.** The six with land borders (Andorra, Liechtenstein, Luxembourg, Monaco, San Marino, Vatican City) are marked by their bead once the line reaches them.
- **Motion** (`useRouteIntro`, `useRouteFinish`, `routeCameras`, `RouteTour`). Reduced motion sets every state at once.
   - **Open.** While the map loads, the ends appear large in the centre, with the arrow drawing from start to target, for about 1 s. They then shrink into their header place in a View Transition. The bars slide in from the edges after that, and the ends get white rings. A restored game skips all of it.
   - **A guess.** Each new country gets a `HitRing` in its verdict colour, staggered within a sentence, and the line grows to it. The counter pops while within par and shakes once past it.
   - **Following the guesses.** When a new green or yellow country lies outside the view, the camera eases to fit the ends and the new countries. Each country is framed by a box near its centre, so Svalbard or France's overseas parts don't pull the camera out. A red guess never moves the camera. `keepVisibleAreaOnMap` keeps the world filling the screen, as in Recall Sprint. A hint behaves like a guess.
   - **Solved.** The last link grows, then the camera dives to the start. A puck tours the chain at 2.2 km/ms, clamped to 1.1–4.5 s, turning the way gold behind it. The camera then pulls back to the whole route and Next puzzle appears. Any tap or key skips to the end. A perfect game adds confetti.
   - **Gave up.** The camera flies to the route while the missing countries appear at once and the line grows through them. Next puzzle appears once both are done.
- **The finish** has no card: the ends and the score stay at the top, Leave stays where it was, and Next puzzle is the only button. The outcome is announced to screen readers.
- **Analytics.** `trackRoutesStart` and `trackRoutesEnd` send the shared `sp_game_start` and `sp_game_end` with `route_kind`, `par`, `guesses`, `hints` and `outcome`. These parameters must be registered as custom dimensions in GA4.
- **The landing demo** (`app/landing/RoutesDemo.tsx`) is the third mode showcase on the home page, scripted like the others on the SVG world.
   - It plays Portugal to Poland, par 3:
      1. Spain is typed.
      2. Czechia is said aloud and shows yellow, so the verdict colours appear.
      3. "France, Germany" in one breath solves it at 4 / 3, and the puck tours the route.
   - It reuses the game's `JourneyView`, which takes names and flag URLs instead of ids, so the country catalog stays out of the landing chunk. For the same reason, the two flag URLs leave out the catalog's version suffix.
