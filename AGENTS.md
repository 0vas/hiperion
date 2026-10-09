# Working in Hyperion

Hyperion is an independent open-source module for human-guided AI workflows. Preserve the MIT license and provider-independent domain model.

- Use TDD: specify meaningful behavior, observe a failing test, implement, then refactor.
- Run `npm run check` and the relevant Playwright tests for user-facing changes.
- Keep implementation and architecture decisions in the repository; distinguish present behavior from roadmap.
- Never commit `.hyperion/`, secrets, local traces, or real user responses.
- Keep protocol rules in `src/domain/`, not duplicated in adapters or the UI.
- Do not publish/deploy/push unless requested.

## When the user asks to use Hyperion

Read `docs/integration.md`. Use the CLI in an existing conversation or the MCP tools when available. Generate a plan from the user’s natural-language request, include the original text in `plan.request`, provide its browser URL, start only ready agent steps, execute the actual work, and report real results. Read the run after a human handoff. Never approve or complete a manual step for the user. Timeouts do not imply approval. Do not claim to launch a background agent or wake a conversation; this release uses cooperative execution.

For new process requests, read `docs/process-contract.md`. Prefer the structured `bpmn-lite` profile when gateways are needed. Declare typed task inputs/outputs; supply output values when completing tasks. Only start ready agent tasks. Start/end/gateway nodes are automatic. Report public summaries, actions and observations through structured log traces; never request private chain-of-thought.
