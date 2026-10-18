# Proposals

Improvements found during the October 2026 review of the realtime server and client, written down so they can be picked up later. Each file is self-contained: the problem, the evidence in the code, the proposed change, how to test it, and the risks.

Code references name functions and files rather than line numbers, so they stay findable as the code moves.

| Proposal                                                               | Kind              | Priority | Effort |
| ---------------------------------------------------------------------- | ----------------- | -------- | ------ |
| [Member departure and room capacity](member-departure-and-capacity.md) | Bug (user-facing) | High     | S–M    |
| [Player room lookup extraction](player-room-lookup-extraction.md)      | Simplification    | Medium   | M      |
| [Client session cleanup](client-session-cleanup.md)                    | Simplification    | Low      | S      |

Suggested order: the user-facing bug first, then the simplifications.

Background reading: [`../architecture/connection-lifecycle.md`](../architecture/connection-lifecycle.md) explains the connection layers these proposals refer to.
