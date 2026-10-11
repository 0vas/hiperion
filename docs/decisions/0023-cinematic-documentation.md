# 0023 — A solar landscape for the documentation home

Status: accepted.

## Intent and acceptance criteria

The home should feel like Hyperion, with a full-width cinematic landscape, a clear request-to-canvas story, and immediate paths to the quickstart, interactive simulation and installers. Preserve bilingual documentation, search, Archify, working download URLs and honest integration limits.

- Desktop: the hero fills the available viewport below navigation; text and actions remain readable.
- Narrow windows: stack copy and canvas without horizontal overflow or cropped actions.
- Motion: a subtle continuous atmosphere with matching endpoints, a pause control, reduced-motion support and suspension when offscreen or the browser tab is hidden.
- Accessibility: keyboard navigation, visible focus, localized labels and WCAG AA checks in both themes.
- Simulation: retain the existing SVG canvas, predefined example data and explicit simulation label. Never present the illustration as a live agent session.

## Design decision

Use an original SVG solar horizon, orbital geometry and layered terrain. Keep the minimal solar brand. Dark midnight, ivory type and restrained solar gold connect the landscape to the product. The existing VitePress navigation floats above the scene; documentation content retains the reader's theme.

The two supplied landing-page prompts are visual references: immersive composition, generous typography, subtle glass and purposeful motion. Their unrelated product names, metrics, endorsements and commercial claims are not part of Hyperion. External reference videos are not bundled or fetched: the code-native artwork is self-contained and remains sharp at all viewport sizes. No new animation or framework dependency is needed.

Applied guidance: [Emil Kowalski design engineering](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md) and [animation](https://github.com/emilkowalski/skills/blob/main/skills/animate/SKILL.md). First-visit motion serves orientation and atmosphere; ordinary navigation remains immediate. CSS opacity and transforms handle the landscape and short staggered entry. Existing canvas motion continues to explain flow state.

## Validation

The new Playwright acceptance test failed against the previous home before implementation. It checks viewport composition, pause/resume, reduced motion, accessibility and the demo link in Spanish and English. Existing documentation checks cover mobile layouts, both themes, search, locale navigation, download links and the interactive example. Inspect desktop and mobile screenshots alongside automated checks. Physical-device testing is not implied by browser viewport emulation.
