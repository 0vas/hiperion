# Contributing to Hyperion

Contributions are welcome under the [MIT license](LICENSE). Please follow our [code of conduct](CODE_OF_CONDUCT.md).

## Working agreement

Describe the behavior you want to change, write a failing test, implement the smallest coherent change, and then refactor. For visual/documentation changes, define review criteria first and verify the rendered result or links. Include both the normal path and meaningful failure cases.

Keep the domain independent from HTTP, MCP, React and persistence. Providers belong behind adapters. Do not simulate agent activity or weaken human approval gates to make a demo pass. Discuss protocol changes in an architecture decision record before changing consumers.

## Local checks

```sh
npm ci
npm run format
npm run check
npx playwright install chromium
npm run test:e2e
```

The browser test server uses `.hyperion-e2e/` on port 4318. Never run tests against your real data directory. Preserve `package-lock.json`; use `npm ci` for reproducible verification.

## Pull requests

Explain the concrete problem, the resulting behavior, and how you verified it. Add screenshots for UI changes and update the relevant protocol/architecture docs. Keep PRs focused. Do not commit credentials, real user workflow data, generated builds, or local browser traces.

Use descriptive commits and branches, prefer accessible native controls, and test narrow screens. A new integration must pass the same workflow contract tests; provider-specific behavior must not leak into state transitions.

## Design decisions

Record material choices under `docs/decisions/`. Distinguish implemented behavior from proposed capabilities. Keep ArchiMate diagrams consistent with the architecture they describe; do not label a generic flowchart as an ArchiMate model.
