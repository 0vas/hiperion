---
name: hyperion
description: Use Hyperion when the user says “usa Hyperion”, “quiero usar Hyperion”, or asks to guide an activity through its visual workflow. Start or resume the local canvas, generate the process from the request, and report real progress with human decisions in the canvas.
license: MIT
---

# Hyperion

Requires local shell access with Node.js 22.13+ or the bundled Desktop runtime, or an already connected Hyperion MCP server.

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

Always preserve the original text in `plan.request`. Prefer `bpmn-lite` for process flows: start/end, structured split/join blocks only when meaningful, typed task ports and short clear phase names. Do not substitute a canned example for the requested activity. Share the returned URL. The agent writes JSON; the user does not. Do not give installation commands as the daily usage path when this skill is already available. Connect the service yourself, create the flow, and return its link.

Group a multi-stage activity with `jobs: [{id, title, description?}]` and assign steps using `jobId`. Each step is independently executable with its own evidence and I/O; a job only summarizes them. Keep each job contiguous in the dependency graph (no reentry after leaving it). Group internal gateways with their job when needed. The canvas can show jobs or their steps.

For human steps, declare `interaction: {question, context, next}`: the exact decision, why it matters, and what follows. Use clear output descriptions as field labels. Prefer simple booleans, text or numbers for nontechnical users; do not make them author JSON. Typed fields are the response: do not ask for the same information again in free text. Do not add artificial approvals or choices unrelated to the request.

## Execute and resume

Use `get RUN_ID` to read current state and decisions. For an existing run use its coordinator identity; do not create a replacement run on every continuation. Start only ready agent tasks, execute their actual work with your own tools, and send evidence. Use `command RUN_ID /absolute/path/command.json` for typed outputs and structured logs. Reuse an action's commandId only on transport retries with identical content.

Logs may contain public summaries, actions and observations. Do not expose or request private chain-of-thought. Hyperion only displays the events you submit; it does not intercept your tools. Parallel gates make work eligible together; report simultaneous execution only when it actually happened.

Manual responses and approvals happen in the canvas. Never submit or approve for the person. Provide the URL and the waiting step, then yield or use `wait RUN_ID REVISION 30` for a bounded wait. A timeout is not approval. Continue after a new user message or actual state change; do not promise background wakeups. Respect pause, cancellation, rejection and the user's explicit instructions.

If only “quiero usar Hyperion” is given without an activity, start the canvas and ask what activity they want to guide. Do not invent a task.

## Presentation chosen in the chat

Keep the same run when the user switches presentation. If they request split/web, return the run URL (`open RUN_ID split` also returns it). With MCP, use `hyperion_open({runId, presentation: "split" | "desktop"})`. Otherwise, if they request desktop, run `open RUN_ID desktop`; the adapter launches the locally registered Hyperion Desktop with the same authenticated service and run. Only report the launch after the command succeeds. If Desktop is not installed/registered, explain that its installer must be opened once and keep the web link available. Do not silently install or choose desktop when the user requested split.

The canvas supports vertical/horizontal orientation and SVG parallel, exclusive and inclusive gateways. Include only gateways justified by the activity. Human decisions appear as a list with progress; use short field descriptions and explicit booleans. Failed agent tasks expose Reintentar: this makes the task ready, preserves history, and still requires the coordinator to execute it. Read state before resuming; do not start a retry automatically because a timeout elapsed.

Desktop also offers **Conectar con mi IA** in its native menu to install the managed skill. If the harness has no `node` executable, read the installed `runtime.json`: invoke its `node` executable with its `cli` path and the desired arguments, applying `nodeEnv`, `HYPERION_DATA_DIR=directory` and `HYPERION_URL=url`. This uses Desktop's bundled runtime; do not ask the user to install Node or type shell commands.
