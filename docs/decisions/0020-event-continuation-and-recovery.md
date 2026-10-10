# ADR 0020 — Event-driven continuation and task recovery

Status: accepted, 2026-10-09. Runtime: 0.4.1.

## Problem and criteria

A saved human decision must reach the coordinator that is waiting for it without asking the human for a second chat message. A task left ready or running must have a recovery action, while completed human answers and logs remain intact. Late reports from an interrupted attempt must not complete a newer one.

## Decision

- Replace adapter snapshot polling with a coordinator-only HTTP long poll. Accepted state changes notify active waiters immediately. The wait is bounded to 55 seconds and cleans up on response, timeout or disconnect. CLI and MCP share it.
- Expose ephemeral wait presence to the canvas. Presence updates carry a monotonic observation timestamp without changing the workflow revision, creating log activity, or entering persistent run state. Older observations cannot overwrite newer presence.
- Allow `retry` on failed, ready and running agent tasks. Ready tasks send a new recovery event; recovering running work requires a canvas confirmation. All dependency, pause, terminal-state and human-revision guards remain in force.
- Require the `attempt` from `start` for logs and results after a retry. First-attempt clients remain compatible; late or missing attempt identifiers cannot overwrite a new attempt. MCP exposes the field and the CLI provides `--attempt`.
- Use runtime version 0.4.1 so the bootstrap rejects an older service instead of silently calling an unsupported wait endpoint.

## Limits

Delivery of a confirmation does not execute tools. The host agent must keep a wait active and execute ready work after receiving the event. An idle conversation requires a new host turn; universal host wakeups and background execution remain outside this runtime. Recovery does not cancel or undo external effects: a coordinator must reconcile those effects before retrying.

## Validation

Test-first coverage exercises event delivery, coordinator authorization, timeout/disconnect cleanup, presence ordering, recovery with preserved human input, and rejection of stale execution results. Browser tests use a synthetic harness to consume a real confirmation, produce a result and reach review with no extra chat message. Recovery is tested from both the node and inspector; light/dark accessibility and existing workflow regressions are checked. MCP contract tests run under Codex, Claude and Cursor identities; these are protocol tests, not native application certifications.
