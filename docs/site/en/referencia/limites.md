# Scope and limits

## Available

Vertical and horizontal canvas layouts, jobs and steps, human decisions, typed inputs and outputs, agent-reported logs, retry and future-plan revisions. Local integrations use MCP or a skill; Desktop includes its runtime.

Core 0.5 provides durable suspension and a harness-independent worker. Native session-resumption connectors still need implementation and verification. See [pause and resume](../guia/reanudacion.md).

The `bpmn-lite` profile supports start/end nodes and structured exclusive, inclusive and parallel split/join gateways.

## Not available yet

- Universal wakeup of a chat that has ended its turn.
- Built-in execution of tools or interception of all agent calls.
- BPMN XML import/export or full BPMN: no loops, timers, compensation or messages between pools.
- Hosted multi-user operation, universal installation from a phrase or cross-device connections.
- Publishing changes or completing human decisions without appropriate authorization.

## Distribution

The downloadable `v0.4.0-preview.1` includes Apple Silicon and Intel Mac packages and Windows x64. Builds and runtime checks run on those platforms; this does not certify every AI client's environment.

Installers are unsigned previews. Newer `main` changes will reach future installers; this documentation follows `main`.

## Privacy

Workflow state and events live on the computer running Hyperion. Your AI provider's terms still apply to content it receives. Logs may contain work information; share only what is needed and never credentials.

GitHub Pages serves this static documentation. It does not receive or execute workflows, host SQLite or replace the local application.
