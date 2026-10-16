# Generated brand and floating navigation

Status: accepted.

The user requested a generated modern software icon and a more refined dynamic navbar. The chosen image is an original generated asset stored in the repository, with its prompt in the brand folder. It replaces the previous H mark in documentation, favicon, product example and README; UI icons retain SVG geometry.

The home uses one floating navigation surface. Its shadow and opacity respond to VitePress's existing scroll state, without new listeners or layout resizing. Guide and architecture links indicate their current section. A Try Hyperion action opens the local documentation simulation. Native VitePress search, localization, theme controls and overflow/mobile navigation remain intact.

Acceptance criteria: the generated logo loads; desktop navigation has a floating surface and changes its shadow after scrolling; section links remain active on child pages; the demo action works on desktop and through the mobile menu. Both themes, reduced motion, keyboard focus, search and language switching remain usable. Validate with a failing browser regression, the docs suite, project checks and visual inspection at desktop and mobile sizes.
