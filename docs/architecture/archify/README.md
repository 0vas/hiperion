# Interactive runtime architecture

The Spanish and English JSON sources describe the implemented core at `83cf85d420b44b3b3a34e08bdfd03c042f0fcc09`. Component links point to that immutable revision. Sources, relationships and limitations must be reviewed when the runtime changes. Native resume connectors are **pending**, not inferred from MCP compatibility.

[Archify](https://github.com/tt-a1i/archify) 3.0.1 generates the standalone HTML/SVG viewers published from `docs/site/public/architecture/`. Its MIT license is included beside the output. ArchiMate XML/SVG in the parent directory remains the formal architecture model.

## Views

- `hyperion.{es,en}.json`: execution ownership, adapters, local API, store, engine and canvas.
- `process.{es,en}.json`: typed context/input handoff, human response, validation, successor readiness, immutable step artifacts and a linked cycle after a new user request. This is a responsibility view, not a BPMN execution trace.
- `continuation.{es,en}.json`: persisted response, queue, worker and the external connector boundary. The connector is explicitly pending.

The architecture page selects one viewer at a time; its full-screen and source links follow the selection. Every view has code references and a short explanatory annotation. Generate all six viewers together after changing sources. Formal implemented/continuation ArchiMate models remain linked from both locales.

## Reproduce

Use Node.js and a separate checkout of Archify pinned to `58ab0b98d2d0def8e49dced705c7b566936723ec`. No global skill installation is needed:

```sh
git clone https://github.com/tt-a1i/archify.git /tmp/hyperion-archify
git -C /tmp/hyperion-archify checkout 58ab0b98d2d0def8e49dced705c7b566936723ec
```

From the Hyperion repository root:

```sh
node docs/architecture/archify/generate.mjs /tmp/hyperion-archify/archify
npm --prefix docs/site test
```

The generator checks the pinned Archify revision and removes its local delivery receipts from the public directory. `finalize` validates the specification, renders, checks provenance and runs browser checks. Keep local evidence receipts outside `public/`: they contain local paths. Commit only the JSON specifications, generated HTML and license. Generated viewers are excluded from Prettier to preserve their provenance; do not hand-edit them.

The Spanish viewer uses Archify's Spanish UI catalog embedded in `meta.translations`. Pages are static and do not connect to the local Hyperion service. Narrow screens can open the full viewer from the architecture page. Shared page slugs under `en/` preserve context when switching languages.

## Documentation walkthrough

The site also includes a separate illustrative workflow in `docs/site/.vitepress/components/WorkflowDemo.vue`. It uses predefined local text, sends no API requests and is explicitly marked as a simulation. It teaches a human response, data handoff and review; it does not certify runtime resumption or replace the domain engine. Both languages share the same demo component. The home animation has a pause control and obeys reduced-motion settings.
