# Hyperion

**Human-guided workflows for any AI tool.** Turn a conversation into a visible plan: see what your agent is doing, supply information, review evidence, and decide when it can continue.

Hyperion is an independent, MIT-licensed module. It can accompany Codex or another compatible agent through HTTP, a CLI, or MCP. It has no dependency on Olimpo and does not require an AI API key.

> **v0.1 — local cooperative preview.** One trusted user and one external coordinator per execution. Hyperion manages workflow state; your agent performs the actual work. Multi-agent dispatch, hosted multi-user operation, and automatic conversation wakeups are future work.

![Hyperion workflow interface with a completed browser test](docs/images/workflow.png)

## Run locally

Requirements: Node.js **22.13+** (Node 24 LTS recommended) and npm. `node:sqlite` may emit an experimental warning on older supported Node versions.

```sh
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:4317**. State and locally generated credentials live in `.hyperion/`, excluded from Git. Keep the server running while using the CLI or MCP adapter.

In another terminal, create a real workflow:

```sh
npm run hyperion -- create examples/codex-trial.json
```

Open the returned URL, submit your objective, and ask your agent to read the run and continue. The sample does not fabricate agent activity or run commands automatically.

## What works

- Directed acyclic plans with agent, manual, and approval steps.
- Dependency gates, independent parallel steps, and explicit coordinator ownership.
- A visual graph, step details, result evidence, and an activity timeline.
- Human input, approval/rejection, pause/resume, cancel, and retry after failure.
- Transactional SQLite persistence and command idempotency.
- Version checks that reject stale human decisions.
- A JSON HTTP API, CLI, and tested MCP stdio adapter.

The interface refreshes state every second. An agent must cooperate with the protocol; Hyperion cannot stop arbitrary work performed outside it. Plans are immutable in this release. Create a new run when the scope changes.

## Connect an agent

The CLI works immediately from an existing Codex conversation with local shell access:

```sh
npm run hyperion -- list
npm run hyperion -- get RUN_ID
npm run hyperion -- start RUN_ID STEP_ID
# Perform the actual authorized work using your own tools.
npm run hyperion -- complete RUN_ID STEP_ID 'What was done and how it was verified'
```

For MCP clients, run `node /absolute/path/to/hiperion/dist/adapters/mcp.js` with `HYPERION_DATA_DIR` pointing at the server's absolute data directory. See [integration instructions](docs/integration.md) for Codex configuration, exact tools, and the human handoff protocol.

## Develop and verify

```sh
npm run dev       # API, watch mode
npm run dev:ui    # Vite UI, separate terminal
npm run check     # Types, unit/integration/MCP tests, build, formatting
npx playwright install chromium
npm run test:e2e  # Real browser interaction and accessibility checks
```

Tests use isolated storage. The browser suite runs a separate server on port 4318 and resets only `.hyperion-e2e/`.

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). CI runs on Node 22 and 24.

## Architecture

```text
src/domain/       Pure workflow model, validation, state transitions
src/server/       HTTP boundary, local sessions, transactional SQLite store
src/adapters/     HTTP client, CLI, MCP stdio server
src/client/       React UI and graph
```

[Architecture context and ArchiMate view](docs/architecture/README.md) · [First increment decision](docs/decisions/0001-functional-increment.md) · [Protocol](docs/protocol.md) · [Functional test with Codex](docs/functional-test.md)

## Configuration

| Variable            | Default                           | Purpose                                                 |
| ------------------- | --------------------------------- | ------------------------------------------------------- |
| `HYPERION_PORT`     | `4317`                            | Local server port                                       |
| `HYPERION_DATA_DIR` | `.hyperion`                       | SQLite and credentials directory                        |
| `HYPERION_AGENT_ID` | `codex`                           | Coordinator identity when credentials are first created |
| `HYPERION_URL`      | `http://127.0.0.1:4317`           | CLI/MCP target                                          |
| `HYPERION_TOKEN`    | Agent token from credentials file | Optional CLI/MCP credential override                    |

Use `127.0.0.1` in browser URLs, not `localhost`; Host and Origin are checked against the bound address. The local edition deliberately binds only to loopback. Do not expose it through a public tunnel or reverse proxy without adding a suitable authentication and authorization design.

## License

[MIT](LICENSE) — Copyright © 2026 Oscar Lobaton Salas.
