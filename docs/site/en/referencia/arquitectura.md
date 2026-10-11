# Architecture

Hyperion separates workflow state from the tool executing each task. Its core does not depend on Codex, Claude, Cursor, Hermes or Olimpo.

## Explore the architecture

[Explore in Archify](/architecture/hyperion-en.html){target="_self"} · [Diagram source](https://github.com/0vas/hiperion/blob/main/docs/architecture/archify/hyperion.en.json)

<Architecture />

Open **Explore in Archify** to zoom, focus, change theme and inspect each component’s source code. This is the 0.5 core runtime; native resume connectors remain pending.

## Responsibilities

| Component               | Responsibility                                                      |
| ----------------------- | ------------------------------------------------------------------- |
| External agent          | Turn the request into a plan, execute tools and report real results |
| MCP / CLI adapters      | Connect the agent to the shared local contract                      |
| Domain engine           | Validate dependencies, decisions, gateways, data and revisions      |
| HTTP service and SQLite | Persist workflow state and stream updates to the canvas over SSE    |
| React canvas            | Display the workflow and collect human decisions                    |
| Electron Desktop        | Run the local service and host the canvas and setup assistant       |

## Formal ArchiMate model

Archify provides an interactive runtime view. The existing ArchiMate exchange models remain the formal architectural reference, with implemented and proposed views identified separately. The execution format is a simplified BPMN profile, separate from architectural notation.

[ArchiMate models and SVG views](https://github.com/0vas/hiperion/tree/main/docs/architecture).

## From conversation to result

1. The agent creates a plan from the request and shares its URL.
2. The engine computes ready tasks and their inputs.
3. The agent starts eligible tasks, executes tools and reports evidence.
4. The user responds or approves on the canvas.
5. The agent reads the change and records subsequent work.

The service does not launch an agent by itself. Core 0.5 adds a durable queue and I/O worker that delegates to an installed connector; native resume connectors remain pending. See [pause and resume](../guia/reanudacion.md). Live canvas updates and conversation resumption are distinct capabilities.

## Data and evolution

Tasks declare typed inputs and outputs. Inputs can come from context, literals or earlier outputs. The server validates values, including allowed choices.

Command identifiers prevent duplicate transport retries. Revisions prevent decisions against stale state. Plan changes preserve history and pause for human review.

[Process contract](https://github.com/0vas/hiperion/blob/main/docs/process-contract.md) · [Architecture decisions](https://github.com/0vas/hiperion/tree/main/docs/decisions)
