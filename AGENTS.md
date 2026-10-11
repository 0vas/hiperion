# Working in Hyperion

## Product and scope

Hyperion turns a natural-language request into a visible, human-guided workflow. The external AI agent plans and performs work; Hyperion owns the recorded process state, validates transitions, collects human decisions and shows evidence. Preserve the MIT license and the provider-independent domain model. Product name: **Hyperion**; repository: `0vas/hiperion`.

The same process can be viewed in a browser, a split window or Electron. Olimpo is a possible consumer, not a privileged dependency. Codex, ChatGPT, Claude, Claude Code, Cursor, Hermes and Google Antigravity are integration targets, not proof of equivalent installed capabilities.

## Read before changing a subsystem

| Area                            | Code                                                                                               | Documentation / evidence                                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Process state and commands      | `src/domain/workflow.ts`, `process.ts`                                                             | `docs/protocol.md`, `docs/process-contract.md`, `tests/domain.test.ts`, `tests/process.test.ts`                   |
| Typed inputs, outputs and forms | `src/domain/contracts.ts`, `context.ts`, `human-forms.ts`                                          | Process contract, `tests/context.test.ts`, `tests/decision-form.test.ts`                                          |
| HTTP, roles and persistence     | `src/server/app.ts`, `store.ts`                                                                    | Protocol, `SECURITY.md`, `tests/http.test.ts`, `tests/store.test.ts`                                              |
| Durable continuation            | `src/domain/continuation.ts`, `src/server/continuations.ts`, `src/adapters/continuation-worker.ts` | `docs/continuacion-agnostica.md`, ADR 0022, `tests/continuation-queue.test.ts`, `tests/continuation-http.test.ts` |
| CLI, MCP and installation       | `src/adapters/`, `skills/hyperion/`                                                                | `docs/integration.md`, `docs/conexion.md`, `skills/hyperion/SKILL.md`                                             |
| Canvas and human interaction    | `src/client/`                                                                                      | `docs/manual-uso.md`, relevant `tests/e2e/` scenarios                                                             |
| Desktop packaging               | `desktop/`, root `package.json`                                                                    | `desktop/README.md`, desktop tests, release workflows                                                             |
| Public documentation            | `docs/site/` (VitePress / Vue)                                                                     | ES and `en/` pages, `docs/site/tests/docs.spec.mjs`                                                               |
| Architecture                    | `docs/architecture/`, `docs/decisions/`                                                            | Archify JSON + generated viewers; formal ArchiMate XML/SVG                                                        |

Read the actual source and targeted tests before making a behavioral claim. Architecture pages explain current behavior; older ADRs preserve historical decisions and are not automatically the current specification.

## Non-negotiable execution rules

- Keep deterministic protocol rules in `src/domain/`; adapters and UI must not invent parallel state machines.
- Only ready agent tasks may start. Start/end/gateway nodes advance through the engine. Jobs group steps; they are not independent executors.
- Human responses and approvals belong to the human. Never fabricate them, complete manual tasks on their behalf, or infer consent from a timeout.
- Preserve typed I/O. Required data controls readiness; available context is a read projection, not a substitute for declared inputs. Known choices should use `form.options` instead of instructions to type an option into free text.
- Preserve revision checks, command IDs, transactional snapshots and receipts. A transport retry must not become duplicate work.
- Preserve history when retrying, recovering a stuck attempt or revising future work. Replanning requires the existing review mechanism; do not silently rewrite completed evidence.
- Log real public summaries, actions and observations. Do not invent progress or request private chain-of-thought. An animated edge or live SSE connection does not prove that an agent is executing.
- Keep human and agent credentials separate. Bind the service locally by default. Do not expose the local service to the internet as a shortcut for a cloud client.
- Never commit `.hyperion/`, credentials, session references, local traces, real user answers or runtime databases. Use synthetic fixtures.

## Harness independence and continuation

The default integration is cooperative execution through CLI/HTTP/MCP. Durable suspension, a persistent queue and a generic I/O worker are implemented. Provider-specific native resume connectors are not shipped or certified simply because their identity is supported.

A resumable connector must be installed, have a real session reference and support durable deduplication. A delivered request acknowledges dispatch, not successful task execution. Ambiguous delivery must be reconciled before another attempt; never blindly resend after a lease expires. A connector is trusted local code configured outside a model-generated plan. Preserve host permissions.

Do not claim that MCP alone wakes a chat after its turn ends. Do not present ChatGPT as connected to local stdio. Document capabilities and missing transport honestly. Do not keep sending repetitive chat messages while a human decision is unchanged.

## When asked to use Hyperion

Read `docs/integration.md`, `docs/process-contract.md` and the portable skill. Generate the workflow from the user's goal, retain the original request in `plan.request`, ask only for missing information and provide the run URL. Do not require the user to specify protocol details in their prompt.

Execute real work through the available harness. Start only eligible tasks, report outputs and logs, and read the updated run after a human handoff. Use a genuine installed connector for durable resumption; otherwise disclose the cooperative integration's limits. Product development in this repository does not itself require launching a workflow unless requested.

## TDD and validation

1. Define acceptance criteria before editing. For behavioral changes, observe a meaningful failing test, implement, then refactor.
2. For documentation or design, define factual, link, accessibility and visual criteria; use the existing browser harness where appropriate.
3. Run `npm run check` (types, unit tests, build, production smoke and formatting). Run the relevant Playwright scenarios for user-facing changes.
4. For public docs, run `npm --prefix docs/site test`. Inspect desktop and narrow layouts, ES/EN, light/dark and reduced motion. Verify internal links, forms, keyboard use and contrast.
5. For architecture changes, regenerate Archify with the pinned renderer using `docs/architecture/archify/README.md`; inspect each view. Keep source links on a verified immutable revision. Never edit generated HTML manually.
6. Record what passed and any remaining limitation. A mocked connector test does not certify a real provider integration. A built installer is not automatically signed or published.

Use the repository's actual package scripts; Node must satisfy `package.json` engines. Keep changes scoped and preserve unrelated work. Do not install new infrastructure solely to test a small documentation edit.

## Documentation is part of the change

Update documentation **in the same change** as behavior, contracts, capabilities or setup. Before finishing, review this matrix and explain any intentionally unchanged surface:

| Change                                            | Update together                                                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Commands, schemas, states, I/O or gates           | Protocol, process contract, examples, integration instructions and tests                                                       |
| Human flow, settings, retry or forms              | User manual, ES/EN guides, illustrative demo when affected, browser tests                                                      |
| Installation, harness connection or resumption    | Connection guide, portable skill, continuation capability matrix, ES/EN setup pages                                            |
| Component ownership, storage, trust or deployment | Architecture pages in both languages, relevant Archify sources/viewers and ArchiMate model; add an ADR for a material decision |
| Release or installer availability                 | README, download links, release notes and actual published artifact versions                                                   |
| Brand or public navigation                        | README and site assets, ES/EN copy, light/dark/mobile visual checks                                                            |

Public pages live in `docs/site/` and `docs/site/en/` with matching slugs. Keep both languages semantically aligned, including limitations. Keep README entry points useful. Distinguish implemented, experimental and planned functionality; never turn a diagram or simulation into a claim of shipped behavior.

Maintain source JSON and generated Archify HTML together. Archify is the interactive viewer; ArchiMate XML/SVG is the formal architectural model. BPMN-lite describes the executed process, not the architecture; it is not full BPMN 2.0 compliance. Keep local generation receipts outside public assets. Validate XML references and record any unverified formal import/XSD validation.

## Design and publication

Keep the canvas primary, tasks compact, forms explicit and details progressively disclosed. Use SVG UI icons, meaningful state colors with text/symbols, and motion that communicates state. Background motion must loop without a visible reset and honor pause, hidden tabs and reduced motion. Never let decorative animation imply runtime progress.

Do not publish, deploy, push or send messages externally without user authorization. Existing explicit authorization in the current conversation applies; do not ask again for an already authorized action. Follow the user's chosen branch/PR workflow and verify deployment before claiming the public site is updated.
