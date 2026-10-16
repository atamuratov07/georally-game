# Proposals

Improvements found during the October 2026 review of the realtime server and client, written down so they can be picked up later. Each file is self-contained: the problem, the evidence in the code, the proposed change, how to test it, and the risks.

Code references name functions and files rather than line numbers, so they stay findable as the code moves.

| Proposal                                                               | Kind              | Priority | Effort |
| ---------------------------------------------------------------------- | ----------------- | -------- | ------ |
| [Server clock offset for countdowns](server-clock-offset.md)           | Bug (user-facing) | High     | S      |
| [Member departure and room capacity](member-departure-and-capacity.md) | Bug (user-facing) | High     | S–M    |
| [Player room lookup extraction](player-room-lookup-extraction.md)      | Simplification    | Medium   | M      |
| [Server room code consolidation](server-room-code-consolidation.md)    | Simplification    | Low      | M      |
| [Client session cleanup](client-session-cleanup.md)                    | Simplification    | Low      | S      |
| [Socket.IO member channels](socketio-member-channels.md)               | Refactor          | Low      | L      |
| putting session token in cookies instead of localStorage               | Refactor          | Low      |        |

Suggested order: the two user-facing bugs first, then the simplifications. Do the member-channels refactor together with the server consolidation (they touch the same handlers and service methods), or when running more than one server instance becomes a real goal.

Background reading: [`../architecture/connection-lifecycle.md`](../architecture/connection-lifecycle.md) explains the connection layers these proposals refer to.
