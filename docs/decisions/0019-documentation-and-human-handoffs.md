# ADR 0019 — Documentation site and explicit human handoffs

Status: accepted, 2026-10-09.

## Problem

New users need a public explanation and setup path. Human decisions with finite choices were rendered as free text, and a low-contrast continuation button made the cooperative host boundary harder to understand. A submitted choice correctly enabled the next task but could not resume an idle conversation.

## Decision

- Publish Spanish documentation from `docs/site` using VitePress and GitHub Pages. Keep its dependencies and build separate from the application; upload only the generated site. The site follows `main` and identifies differences from downloadable preview installers.
- Fix the VitePress 2 preview version in the lockfile, using its supported modern Vite dependency rather than overriding the older stable line's vulnerable dependency. Validate local search, base paths, accessibility and builds before publishing. Dependabot tracks this isolated package.
- Add `form.options` for string ports, with unique values and readable labels. The domain and UI enforce the same allowed values. No default human choice; old plans remain valid and are not reinterpreted from free text.
- Prefer bounded MCP/CLI waiting during an active agent turn and resume on actual state changes. If the turn ends, explain the explicit continuation message. Do not simulate execution or claim a universal conversation wakeup.

## Validation

Failing tests demonstrated unsupported options and the original 1.73:1 button contrast. Tests now cover domain rejection, dropdown submission, light/dark contrast, inherited task readiness and a waiting adapter receiving a real human command in an isolated test server. Documentation checks cover every page, local links/search, narrow layouts and WCAG AA checks.

## Limits

Updating instructions improves active-turn continuity but cannot force a host to keep its conversation alive. Durable background execution requires a separate execution adapter and authorization model. Pages cannot provide that runtime. These changes do not rewrite completed decisions or resume another conversation on the user's behalf.
