# ADR 0021 — Attached guidance and choice authoring checks

Status: accepted, 2026-10-10. Runtime: 0.4.2.

## Observed failure

A newly generated human form listed known products in a hint but declared only a string output. The renderer correctly displayed a textarea. The host created the run, ended its turn and never subscribed to the human decision. Event delivery and retry from 0.4.1 could not restart that closed conversation.

## Criteria and decision

- Reject the demonstrated free-text choice pattern at new-plan creation and for changed forms in plan revisions before persisting a run. The domain authoring guard recognizes bounded imperative comma-separated lists in Spanish/English hints, placeholders and descriptions (write/enter also requires selection intent in the task title) and asks the agent for `form.options`. It does not infer values, use a vendor catalog, claim general semantic recognition, or modify existing responses. Ordinary open questions remain valid.
- Add CLI `guide` and `follow`: stream the canvas link before waiting, renew short event waits automatically, and return current saved input as soon as the host has ready work. Each attached session is bounded to ten minutes. Expiry means renew, never approval.
- Route portable-skill `create` through `guide`, including older conversations using the updated script. Preserve direct CLI `create` for nonblocking consumers. The portable wrapper forwards termination to its child so a stopped host cannot leave the adapter waiting as if connected.
- Return `agentNext` in CLI/MCP run results: ready work, human wait with arguments, pause/end, or inspection of running/failed work. The host must carry out the real task; no adapter fabricates completion or performs arbitrary commands on its own.
- Update the managed skill and correct contradictory manual instructions that required a second chat message after every response.

## Validation and limits

Failing tests reproduced acceptance of the bad form and the missing attached lifecycle. Tests cover rejection before persistence, valid dropdowns, open text, timeout renewal, preservation of submitted values and pause/expiry behavior. A browser test invokes the installed portable skill through its legacy `create` entrypoint, receives the live URL while the tool remains active, selects a dropdown value, and verifies the returned input before a synthetic host produces a harmless result. The same browser test terminates an attached wait and verifies presence is cleared without submitting the human step. MCP checks verify the next-action contract under three agent identities.

This fixes the attached integration path, not universal wakeup of idle chats. Hosts must keep the invocation active and consume its result. New or cached applications that use a custom raw HTTP integration without the attached lifecycle still require their own wait/execution loop. Previously published installers are not updated by changing source code. Completed decisions and existing run history remain immutable.
