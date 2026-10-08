---
name: hyperion
description: Use Hyperion when the user says “usa Hyperion”, “quiero usar Hyperion”, or asks to guide an activity through its visual workflow. Start or resume the local canvas, generate the process from the request, and report real progress with human decisions in the canvas.
license: MIT
---

# Hyperion

Requires Node.js 22.13+ and local shell access, or an already connected Hyperion MCP server.

The user describes the activity in their chat. You construct and advance its visual workflow. Preserve their scope and original request. Hyperion is independent of the model or agent vendor.

## Start from a request

Use loaded `hyperion_*` MCP tools when available. Otherwise run the script next to this skill:

```sh
node /absolute/path/to/this/skill/scripts/hyperion.mjs --agent YOUR_AGENT_ID up
```

Use a stable lowercase identity for your tool (for example `codex`, `claude`, `cursor`, or another ID). The script starts/reuses the local service, registers that identity and returns the canvas URL. No API key, manual server startup or MCP configuration is needed. An occupied port with incompatible credentials/version requires resolving that existing instance, not deleting its data.

Read [the protocol](references/protocol.md) for commands and [the process contract](references/process-contract.md) for gates, typed I/O and public traces. Generate a plan specific to the request, write it to a temporary JSON file, then run:

```sh
node /absolute/path/to/this/skill/scripts/hyperion.mjs --agent YOUR_AGENT_ID create /absolute/path/plan.json UNIQUE_REQUEST_ID
```

Always preserve the original text in `plan.request`. Prefer `bpmn-lite` for process flows: start/end, structured split/join blocks only when meaningful, typed task ports and short clear phase names. Do not substitute a canned example for the requested activity. Share the returned URL. The agent writes JSON; the user does not.

## Execute and resume

Use `get RUN_ID` to read current state and decisions. For an existing run use its coordinator identity; do not create a replacement run on every continuation. Start only ready agent tasks, execute their actual work with your own tools, and send evidence. Use `command RUN_ID /absolute/path/command.json` for typed outputs and structured logs. Reuse an action's commandId only on transport retries with identical content.

Logs may contain public summaries, actions and observations. Do not expose or request private chain-of-thought. Hyperion only displays the events you submit; it does not intercept your tools. Parallel gates make work eligible together; report simultaneous execution only when it actually happened.

Manual responses and approvals happen in the canvas. Never submit or approve for the person. Provide the URL and the waiting step, then yield or use `wait RUN_ID REVISION 30` for a bounded wait. A timeout is not approval. Continue after a new user message or actual state change; do not promise background wakeups. Respect pause, cancellation, rejection and the user's explicit instructions.

If only “quiero usar Hyperion” is given without an activity, start the canvas and ask what activity they want to guide. Do not invent a task.
