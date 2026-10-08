# Agent integration

Hyperion runs separately from the agent and owns workflow state. The agent proposes a plan, claims ready work, performs it with its own tools, and reports evidence. The human participates through the web interface.

For setup in Codex, Claude Code, Claude Desktop, Cursor and other local clients, follow the [connection guide](conexion.md). The user starts with a natural-language request; the host agent generates the plan and includes its original text in `plan.request`. Do not ask the user to author JSON.

## Portable invocation

Prefer `hyperion install` for local agents supporting Agent Skills and shell access. The installed skill recognizes requests to use Hyperion and launches the same compiled CLI independently of vendor MCP settings. Its script pins the runtime/data paths; `--agent ID` registers a caller without a vendor allowlist. The CLI starts or reuses the authenticated local server automatically. A standalone npm archive includes production assets; no source checkout is needed at runtime. See [the connection guide](conexion.md) for the one-time installation and host-discovery limits.

## This Codex conversation

Use the repository CLI. New MCP configuration does not automatically inject tools into an already running conversation.

1. Read `npm run hyperion -- --help`.
2. Generate a JSON plan from the user’s request using the [protocol](protocol.md) and create it with `npm run hyperion -- create PLAN.json UNIQUE_REQUEST_ID`.
3. Show the returned URL to the user.
4. Read `get RUN_ID`. Start only agent steps whose status is `ready` while the run is `active`.
5. Execute real work. Report progress with `log`; report an actual result with `complete`, or a failure with `fail`.
6. For `manual` and `approval` steps, wait for the user's action in the browser. Never submit or approve on the user's behalf.
7. Use `wait RUN_ID REVISION 30` for a bounded wait, or resume after the user's next message. A timeout is not approval. Re-read the run before acting.
8. If the run is cancelled or rejected, stop scheduling. Respect pauses. A pause permits reporting the result of work already started.

Independent ready steps may be active together. Only do this when the underlying actions are genuinely independent. A running indicator means a start was recorded; it does not prove the external agent is still alive.

## MCP stdio

Recommended: `npm run hyperion -- setup codex` (or `claude` / `cursor`) configures the adapter and local startup on demand. Reload tools or open a new client session. For structured gateways, typed outputs and public traces, follow the [process contract](process-contract.md).

Manual alternative: build and start the HTTP server first. Run `npm run hyperion -- connect CLIENT_ID` to register an identity and generate an absolute-path MCP configuration without credentials. Register the adapter in a compatible MCP client:

```json
{
  "mcpServers": {
    "hyperion": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/hiperion/dist/adapters/mcp.js"],
      "env": {
        "HYPERION_AGENT_ID": "codex",
        "HYPERION_DATA_DIR": "/absolute/path/to/hiperion/.hyperion",
        "HYPERION_URL": "http://127.0.0.1:4317"
      }
    }
  }
}
```

Clients have different configuration locations. The example defines the portable command and environment, not a universal configuration file path.

For Codex, the CLI supports registering stdio servers:

```sh
codex mcp add hyperion \
  --env HYPERION_AGENT_ID=codex \
  --env HYPERION_DATA_DIR=/absolute/path/to/hiperion/.hyperion \
  --env HYPERION_URL=http://127.0.0.1:4317 \
  -- node /absolute/path/to/hiperion/dist/adapters/mcp.js
```

Verify with `codex mcp get hyperion` and use a session in which the tools are loaded. This command changes your local Codex MCP configuration; it is an optional setup step, not part of the server startup. Documentation: [official OpenAI MCP guidance](https://developers.openai.com/codex/mcp).

| Tool                  | Behavior                                                     |
| --------------------- | ------------------------------------------------------------ |
| `hyperion_create_run` | Validate and persist a plan; return a browser URL            |
| `hyperion_list_runs`  | Read recent executions                                       |
| `hyperion_get_run`    | Read state, decisions, results and history                   |
| `hyperion_step`       | `start`, `log`, `complete`, `fail`, or `retry` an agent step |
| `hyperion_wait`       | Wait up to 55 seconds for a revision change                  |

Create/step tools require `commandId`. Reuse it when retrying a transport request with the same content. A different action or changed content requires a new ID. The MCP server intentionally exposes no human approval tool. It uses the same HTTP contract as the CLI, with no direct access to the database.

## Other providers and environments

An agent with HTTP or shell access can use the same protocol. MCP support alone does not guarantee that an agent can remain alive waiting for a decision or wake a conversation. Document those capabilities per integration. A remote/cloud agent cannot reach `127.0.0.1` on your laptop; remote access is outside this release.

Set `HYPERION_AGENT_ID` to a registered identity when using CLI/MCP. Each identity has its own credential and can coexist in the same data directory; registration preserves existing credentials and is picked up by the running server. A run retains its original coordinator. Identities share read access within this trusted local deployment, but cannot mutate another coordinator’s agent steps. These are integration identities, not an isolation boundary against programs running as the same OS user.
