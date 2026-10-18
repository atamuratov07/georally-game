# Proposals

Improvements found during the October 2026 review of the realtime server and client, written down so they can be picked up later. Each file is self-contained: the problem, the evidence in the code, the proposed change, how to test it, and the risks.

Code references name functions and files rather than line numbers, so they stay findable as the code moves.

| Proposal                                                               | Kind              | Priority                    | Effort |
| ---------------------------------------------------------------------- | ----------------- | --------------------------- | ------ |
| [Member departure and room capacity](member-departure-and-capacity.md) | Bug (user-facing) | High                        | S–M    |
| [Classroom fair play](classroom-fair-play.md)                          | Bug and features  | High (option 1), medium–low | S–M    |
| [Player room lookup extraction](player-room-lookup-extraction.md)      | Simplification    | Medium                      | M      |
| [Client session cleanup](client-session-cleanup.md)                    | Simplification    | Low                         | S      |

Suggested order: the user-facing bug and the deadline check (fair play, option 1) first, then the simplifications; the other fair-play options when classrooms need them.

Background reading: [`../architecture/connection-lifecycle.md`](../architecture/connection-lifecycle.md) explains the connection layers these proposals refer to.
