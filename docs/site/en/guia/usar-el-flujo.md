# Use the canvas

The chat defines the goal and performs the work with its tools. The canvas lets you follow the process and make decisions.

<GuideLens kind="canvas" />

## Find your next task

Select a task in the top navigation and use **Enfocar tarea** (Focus task). **Seguir actividad** (Follow activity) keeps active work in view. Settings offer vertical or horizontal layouts and light or dark themes. Expand jobs to see their steps.

| Signal         | Meaning                                         |
| -------------- | ----------------------------------------------- |
| Green start    | Process entry                                   |
| Yellow gateway | Splits or joins paths                           |
| Red end        | Process closure; not necessarily an error       |
| Green task     | Completed                                       |
| Blue task      | Ready for the agent or running; read its status |
| Amber task     | Needs your input                                |
| Red task       | Failure or rejection                            |
| Gray path      | Pending or skipped, depending on its stroke     |

Paths reflect recorded progress. Animation does not prove that an agent is connected. Motion respects your system's reduced-motion preference.

## Answer what is needed

Forms should ask a concrete question using dropdowns, Yes/No, numbers or text. No choice is approved by default. Expand help only when needed.

**I/O** shows inputs and outputs. **Logs** contains public summaries, actions and observations sent by the agent, not an automatic recording of every tool or private reasoning.

## Resume work

**Espera al agente** (Waiting for the agent) means that the task is ready but has not started. Saving an answer does not itself execute actions in another application.

During an active integration wait, the agent can receive the change in the same turn. Otherwise use **Copiar continuación** (Copy continuation) and send the text in the connected chat. Its run ID preserves your existing decision.

Check for a paused run, another unanswered question or a reported error before retrying. Do not approve the same decision again to bypass a block.

## Retry

Use **Reintentar** (Retry) on a ready or failed AI task. For a stuck running task, use **Recuperar tarea** (Recover task) and confirm. Responses and logs remain intact. An actively waiting agent receives the recovery event. External tools are not cancelled; the agent must check what happened before repeating an action. Results from an older attempt are rejected.

## Change the plan

Ask in the chat: “From this phase, add a review.” The agent can revise future work with a reason. Hyperion preserves completed work and pauses the revised plan for your review. History must not be rewritten.

## Gateways

- **Exclusive (×):** selects one path.
- **Inclusive (○):** enables one or more matching paths.
- **Parallel (+):** enables branches and waits for their join.

Multiple ready tasks do not guarantee concurrent execution; that depends on the agent.

## Runtime versions

The 0.4.1 runtime added active-agent presence and event delivery. The 0.4.2 skill added bounded guided waiting and validation of detected free-text choice lists. Core 0.5 adds durable continuation infrastructure; native resume connectors remain pending. These changes are not in the 0.4.0 preview installer. [Read about pause and resume](./reanudacion.md).
