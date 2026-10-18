# Classroom fair play

**Kind:** bug (option 1) and features (options 2–6) · **Priority:** high for option 1, medium for options 2–3, low for options 4–6 · **Effort:** small (options 1, 2, 3, 6) to medium (options 4, 5)

What a player with DevTools or a script can still do in a game, and what a teacher could get to act on it. Found during the anti-cheat audit (Phase 6 of the measurements work); the server's existing protections are proven by `service.test.ts` ("RoomsService fair play") and `tests/integration/fairPlay.test.ts`.

## What the server already guarantees

- Correctness is decided on the server (`evaluateSubmissions` in `game/commands.ts`), and the time and score come from the server clock (`RoomsService.submitAnswer` stamps `acceptedAt`; `calculateAnswerScore` scores it). `submitAnswerRequestSchema` accepts only `countryId`; any other field a client sends is dropped.
- An answer counts for the member bound to the socket (`socket.data`), never for an identity in the payload.
- One locked answer per player per round (`participant_already_submitted`); only countries in the game's pool (`country_not_eligible`); no answers once the round is revealed (`game_not_open`).
- Players see neither other players' answers nor the leaderboard before the leaderboard phase. Only the host can start, reveal, advance, return to the lobby or close the room.

## What a player can still do

- **Read the answer from the question.** The question is "find country X" and the answer is X's id. Every player receives `questionCountryId` in the open round, which is exactly what `game:submit-answer` expects. A script can answer every round correctly within the first second, and `elapsedSeconds` rounds down, so it gets 100 points every round.
- **Join as extra identities** (new tab, incognito, another device) while the room has capacity. Participants are fixed at game start, so this only works in the lobby, and the host cannot remove anyone.
- **Take a classmate's name** if it is still free.
- **Answer just after the deadline** (option 1).

Two ideas that do not help:

- **The question as display text instead of an id.** The client ships the full catalog (ids, names in three languages, centroids); turning a name back into an id is one lookup. The catalog has to stay: the map tiles and the info card work by id.
- **Click coordinates with a server-side point-in-polygon check.** Country locations are public and the client ships centroids, so a script sends a point inside X. It would cost polygons on the server, a lookup per answer, and border and small-island cases that real players would see as wrong answers.

Because the quiz asks about public facts, a script can always answer. The options below make it visible to the teacher or worth less.

## Options

### 1. Reject answers after the deadline (bug)

`SUBMIT_ANSWER` checks only that the round is `open`; the round closes when the scheduled reveal runs (`RoomsService.executeScheduledRoomAdvance`). An answer that arrives after `deadlineAt` but before the timer callback runs is accepted and scored from its real time. With an injected clock, a 10 s round and an answer at the deadline + 2 s (before the timer ran) was accepted as correct with 40 points (100 − 12 × 5). In production the window is as long as the timer is late, which is the event-loop delay at that moment.

```ts
case 'SUBMIT_ANSWER': {
	if (state.phase !== 'open') {
		return err({ code: 'game_not_open' })
	}
	const { deadlineAt } = state.currentRound
	if (deadlineAt !== null && command.now > deadlineAt) {
		return err({ code: 'game_not_open' })
	}
	...
```

Reusing `game_not_open` keeps the protocol, the client error mapping and the translations as they are; a dedicated code would only matter if the client should say something different.

Test (`service.test.ts`, "RoomsService fair play"): with an injected clock and fake timers, move the clock past `deadlineAt` without advancing the timers, submit, and expect `game_not_open` and no submission in the round.

### 2. Flag answers faster than a human reaction threshold on the teacher's view

The classroom host already receives every participant's `submittedAt` and the round's `startedAt` (`room:host-detail`), and `ActiveGameHostScreen` already shows each answer's time. Add a mark next to answers under a threshold, and optionally a per-student count at the end.

- Host UI only; no server or protocol change.
- The threshold must be chosen. There is no data yet on how fast real students answer, so start with a setting or a cautious constant, and record answer times (the analytics hook already computes them) to tune it.
- A lucky fast click is a false positive; a script that waits a random second or two is not flagged.

### 3. Show each student's answer-time pattern after the game

On the finished screen for the classroom host: per student, the fastest and median answer time and how many answers came in under the threshold from option 2. `lastGameResult` already holds every round's `submittedAt` per student, so this is UI only. It catches a script that answers instantly and correctly in every round better than a per-answer mark does, with the same limit against a script that adds human-looking delays. Best shipped together with option 2.

### 4. Let the teacher remove a student

A `REMOVE_MEMBER` room command, a host-only socket event and a button in the host's member list; the removed member's session is deleted, and the client shows the "session expired" state it already has for `member_session_not_found`. Shares most of its work with [Member departure and room capacity](member-departure-and-capacity.md), options B and C. Mid-game removal needs a rule for the game's participant list and for results that reference the `memberId`; lobby-only removal avoids both.

It detects nothing; it lets the teacher act on what options 2 and 3 show, and on fake or offensive names.

### 5. Lock the room once the game starts, or let the teacher approve joins

A room flag set by the host; `joinRoom` rejects new members while it is set (a new error code and its translations). Stops extra identities and late fake names. Medium effort (room state, host control, join error). Approval per join is more work (a pending-member state and a host prompt) for little extra over a lock.

### 6. Score only correctness in classroom mode

Skip the time penalty when the room is in classroom mode (or behind a game-config switch), so a script gains nothing over a student who knows the answer, and the speed race that rewards scripts goes away. Small in code (`calculateAnswerScore` and its caller), but it changes the game rules and how classroom games feel; a product decision.

## Recommendation

Do **1** now. Do **2** and **3** together as the classroom answer: the teacher in the room is the real enforcement and needs to see who looks suspicious. Do **4** together with the member-departure work. **5** and **6** only if teachers ask for them.

## Risks

- Options 2 and 3 accuse by heuristic. Present them as "check this", never as a verdict, and do not show them to students.
- Option 1 can reject an answer a student clicked just before the deadline if it arrives after it; the countdown already shows the deadline from the server clock, so the visible rule and the enforced rule then match.
