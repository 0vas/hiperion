# Working in Hyperion

Hyperion is an independent open-source module for human-guided AI workflows. Preserve the MIT license and provider-independent domain model.

- Use TDD: specify meaningful behavior, observe a failing test, implement, then refactor.
- Run `npm run check` and the relevant Playwright tests for user-facing changes.
- Keep implementation and architecture decisions in the repository; distinguish present behavior from roadmap.
- Never commit `.hyperion/`, secrets, local traces, or real user responses.
- Keep protocol rules in `src/domain/`, not duplicated in adapters or the UI.
- Do not publish/deploy/push unless requested.

## When the user asks to use Hyperion

Read `docs/integration.md`. Use the CLI in an existing conversation or the MCP tools when available. Create a plan, provide its browser URL, start only ready agent steps, execute the actual work, and report real results. Read the run after a human handoff. Never approve or complete a manual step for the user. Timeouts do not imply approval. Do not claim to launch a background agent or wake a conversation; v0.1 uses cooperative execution.
